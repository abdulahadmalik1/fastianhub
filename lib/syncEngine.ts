import { doc, getDoc, setDoc, writeBatch, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
const DRIVE_API_KEY = "AIzaSyAC-up-io_qnVRIk2uHUtPkCB873hPC6ag";
const SHEETS_API_KEY = "AIzaSyChPGp69rr55E97_SJr_Ez6f95XPtbW6Ao";
const SPREADSHEET_ID = "1vlTuotLw34fedME3gNQj09cZw-todVomxAiu5P1wZ6Q";

const FIELDS = (
  "sheets.properties(sheetId,title,sheetType,gridProperties)," +
  "sheets.merges," +
  "sheets.data.rowData.values(" +
  "formattedValue," +
  "effectiveFormat.backgroundColor," +
  "effectiveFormat.textFormat.foregroundColor," +
  "effectiveFormat.textFormat.bold" +
  ")"
);

function toHex(color: any): string | null {
  if (!color) return null;
  const r = Math.round((color.red || 0) * 255);
  const g = Math.round((color.green || 0) * 255);
  const b = Math.round((color.blue || 0) * 255);
  const hex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function fmtTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function parseTimeRange(timeStr: string) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!m) return null;
  let [_, startStr, endStr] = m;
  let startH = parseInt(startStr.split(':')[0], 10);
  let startM = parseInt(startStr.split(':')[1], 10);
  let endH = parseInt(endStr.split(':')[0], 10);
  let endM = parseInt(endStr.split(':')[1], 10);

  if (startH < 8) startH += 12;
  if (endH < 8) endH += 12;
  if (endH < startH) endH += 12;

  const startMins = startH * 60 + startM;
  const endMins = endH * 60 + endM;
  const canonSlot = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}-${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  return {
    slot: canonSlot,
    startMins,
    endMins,
    startLabel: fmtTime(startMins),
    endLabel: fmtTime(endMins),
  };
}

function detectSlotsFromHeader(row: any[]) {
  const slots: any[] = [];
  let current: any = null;

  row.forEach((cell, idx) => {
    const txt = cell.text?.trim() || '';
    const parsed = parseTimeRange(txt);

    if (parsed) {
      if (current) {
        current.endCol = idx - 1;
        slots.push(current);
      }
      current = {
        startCol: idx,
        endCol: idx,
        ...parsed,
      };
    } else if (current && /room/i.test(txt)) {
      current.endCol = idx - 1;
      slots.push(current);
      current = null;
    }
  });

  if (current) {
    current.endCol = row.length - 1;
    slots.push(current);
  }

  return slots;
}

function extractDynamicLegend(sheets: any[]) {
  const legendMap = new Map<string, any>();
  const daySheetNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  sheets.forEach(sheet => {
    if (!daySheetNames.some(d => sheet.title?.includes(d))) return;

    for (let r = 0; r < 4; r++) {
      const row = sheet.grid[r] || [];
      row.forEach((cell: any, cIdx: number) => {
        const txt = cell.text?.trim();
        const bg = cell.bg ? cell.bg.toLowerCase() : null;
        if (!txt || !bg || bg === '#ffffff') return;

        if (daySheetNames.some(d => txt.toLowerCase().includes(d.toLowerCase()))) return;

        let batch = 'Other';
        let program = txt;

        const batchYearMatch = txt.match(/\((20\d{2})\)/);
        if (batchYearMatch) {
          batch = batchYearMatch[1];
          program = txt.replace(/\(20\d{2}\)/, '').trim();
        } else if (/^ms\b/i.test(txt) || /\(ms\)/i.test(txt)) {
          batch = 'MS';
        } else if (/^phd\b/i.test(txt)) {
          batch = 'PhD';
        } else if (/repeat/i.test(txt)) {
          batch = 'Repeat';
        }

        const isEvening = cIdx >= 30;
        const scopedKey = `${bg}_${isEvening ? 'eve' : 'day'}`;

        const legendItem = {
          batch,
          program,
          color: bg,
          textColor: cell.fg || '#000000',
        };

        legendMap.set(scopedKey, legendItem);
        if (!legendMap.has(bg)) {
          legendMap.set(bg, legendItem);
        }
      });
    }
  });

  return legendMap;
}

function expandSections(rawSec: string, defaultProgram: string) {
  if (!rawSec || rawSec === 'NO_PARENS') return [];
  const s = rawSec.trim();

  const multiSlash = s.match(/^([A-Za-z0-9]+)\/([A-Za-z0-9](?:\/[A-Za-z0-9])*)/i);
  if (multiSlash) {
    const prog = multiSlash[1].toUpperCase();
    const letters = multiSlash[2].split('/');
    return letters.map(l => `${prog}-${l.trim().toUpperCase()}`);
  }

  const ampMatch = s.match(/^([A-Za-z0-9]+)-([A-Za-z0-9])&([A-Za-z0-9])/i);
  if (ampMatch) {
    const prog = ampMatch[1].toUpperCase();
    return [`${prog}-${ampMatch[2].toUpperCase()}`, `${prog}-${ampMatch[3].toUpperCase()}`];
  }

  const commaMatch = s.match(/^([A-Za-z0-9-]+)(?:,\s*\d+)?/i);
  if (commaMatch && commaMatch[1].includes('-')) {
    return [commaMatch[1].trim().toUpperCase()];
  }

  if (/^[A-Za-z0-9]+-[A-Za-z0-9]+$/i.test(s)) {
    return [s.toUpperCase()];
  }

  if (/^[A-Z]$/i.test(s) && defaultProgram) {
    const pPrefix = defaultProgram.replace(/^BS\s+/i, '').replace(/^MS\s+/i, '').trim();
    return [`${pPrefix}-${s.toUpperCase()}`];
  }

  return [s.toUpperCase()];
}

function buildGrid(sheet: any) {
  const rows = (sheet.data && sheet.data[0] && sheet.data[0].rowData) || [];
  const grid: any[] = [];
  for (const row of rows) {
    const cells: any[] = [];
    const values = row.values || [];
    for (const cell of values) {
      const fmt = cell.effectiveFormat || {};
      const textFmt = fmt.textFormat || {};
      cells.push({
        text: cell.formattedValue || "",
        bg: toHex(fmt.backgroundColor),
        fg: toHex(textFmt.foregroundColor),
        bold: Boolean(textFmt.bold),
      });
    }
    grid.push(cells);
  }
  return grid;
}

// Check Drive API for modifiedTime
export async function getDriveModifiedTime(): Promise<string | null> {
  const url = `https://www.googleapis.com/drive/v3/files/${SPREADSHEET_ID}?fields=modifiedTime&key=${DRIVE_API_KEY}`;
  try {
    const resp = await fetch(url, { cache: 'no-store' });
    if (!resp.ok) {
      console.warn(`[Drive API] Status ${resp.status}: Could not fetch modifiedTime.`);
      return null;
    }
    const data = await resp.json();
    return data.modifiedTime || null;
  } catch (err) {
    console.warn('[Drive API Error]', err);
    return null;
  }
}

// Fetch full spreadsheet and parse all sections
export async function syncSpreadsheet(newModifiedTime: string | null) {
  const query = new URLSearchParams({
    includeGridData: "true",
    fields: FIELDS,
    key: SHEETS_API_KEY,
  }).toString();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?${query}`;

  const resp = await fetch(url, { cache: 'no-store' });
  if (!resp.ok) {
    throw new Error(`Sheets API error: ${resp.status}`);
  }
  const rawData = await resp.json();
  const sheets = rawData.sheets || [];

  const fullData = {
    spreadsheetId: SPREADSHEET_ID,
    sheets: sheets.map((sheet: any) => {
      const props = sheet.properties || {};
      const gridProps = props.gridProperties || {};
      return {
        sheetId: props.sheetId,
        title: props.title,
        rowCount: gridProps.rowCount,
        columnCount: gridProps.columnCount,
        merges: sheet.merges || [],
        grid: buildGrid(sheet),
      };
    })
  };

  const dynamicLegend = extractDynamicLegend(fullData.sheets);
  const daySheetNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sectionsMap = new Map<string, any>();

  fullData.sheets.forEach((sheet: any) => {
    const isDaySheet = daySheetNames.some(d => sheet.title.toLowerCase().startsWith(d.toLowerCase()));
    if (!isDaySheet) return;

    const dayName = daySheetNames.find(d => sheet.title.toLowerCase().startsWith(d.toLowerCase())) || sheet.title;

    let classHeaderRowIndex = sheet.grid.findIndex((row: any[], idx: number) =>
      idx < 10 && row.some(c => parseTimeRange(c.text?.trim()))
    );
    if (classHeaderRowIndex === -1) classHeaderRowIndex = 4;

    const classSlots = detectSlotsFromHeader(sheet.grid[classHeaderRowIndex] || []);

    const labHeaderRowIndex = sheet.grid.findIndex((row: any[], idx: number) =>
      idx > classHeaderRowIndex && row[0]?.text?.trim()?.toLowerCase() === 'lab'
    );

    const labSlots = labHeaderRowIndex !== -1
      ? detectSlotsFromHeader(sheet.grid[labHeaderRowIndex] || [])
      : [];

    const headerRow = sheet.grid[classHeaderRowIndex] || [];
    let roomColLeft = 0;
    let roomColRight = headerRow.findIndex((c: any, idx: number) => idx > 15 && /room/i.test(c.text?.trim() || ''));
    if (roomColRight === -1) roomColRight = 30;

    sheet.grid.forEach((row: any[], rIdx: number) => {
      if (rIdx <= classHeaderRowIndex || rIdx === labHeaderRowIndex) return;

      const isLab = labHeaderRowIndex !== -1 && rIdx > labHeaderRowIndex;
      const availableSlots = isLab ? labSlots : classSlots;
      if (!availableSlots.length) return;

      const roomLeft = row[roomColLeft]?.text?.trim() || '';
      const roomRight = row[roomColRight]?.text?.trim() || '';

      row.forEach((cell: any, cIdx: number) => {
        if (cIdx === roomColLeft || cIdx === roomColRight || !cell.text || !cell.text.trim()) return;
        const rawText = cell.text.trim();
        if (['fsm', 'ee', 'reserved', 'prayer break'].some(s => rawText.toLowerCase().includes(s))) return;

        const bg = cell.bg ? cell.bg.toLowerCase() : '';
        const isEvening = cIdx >= roomColRight;

        const colorInfo = dynamicLegend.get(`${bg}_${isEvening ? 'eve' : 'day'}`) || dynamicLegend.get(bg);
        if (!colorInfo) return;

        const slotDef = availableSlots.find((s: any) => cIdx >= s.startCol && cIdx <= s.endCol);
        if (!slotDef) return;

        const customTime = parseTimeRange(rawText);
        const effectiveSlot = customTime || slotDef;
        const room = (isEvening && roomRight) ? roomRight : (roomLeft || roomRight);

        let textWithoutTime = rawText.replace(/\d{1,2}:\d{2}\s*-\s*\d{1,2}:\d{2}/, '').trim();
        const match = textWithoutTime.match(/^(.+?)\s*\(([^)]+)\)(.*)$/);
        let course = textWithoutTime;
        let sectionRaw = '';
        if (match) {
          course = match[1].trim();
          sectionRaw = match[2].trim();
        }

        let batch = colorInfo.batch;
        let program = colorInfo.program;
        if (/^ms\s/i.test(course) || /\(ms\)/i.test(rawText)) {
          batch = 'MS';
        }

        const sections = expandSections(sectionRaw, program);
        if (!sections.length) return;

        sections.forEach(sec => {
          const targets = [sec];
          const baseMatch = sec.match(/^([A-Za-z0-9]+-[A-Za-z])\d$/);
          if (baseMatch) {
            targets.push(baseMatch[1]);
          }

          targets.forEach(targetSec => {
            const docId = `${batch}-${targetSec}`;
            if (!sectionsMap.has(docId)) {
              sectionsMap.set(docId, {
                docId,
                batch,
                program,
                section: targetSec,
                color: bg,
                schedule: [],
              });
            }

            const entry = {
              id: `${dayName}-${room}-${effectiveSlot.slot}-${course}-${sec}`.replace(/[\s\/:]+/g, '_'),
              day: dayName,
              room,
              slot: effectiveSlot.slot,
              startMins: effectiveSlot.startMins,
              endMins: effectiveSlot.endMins,
              startLabel: effectiveSlot.startLabel,
              endLabel: effectiveSlot.endLabel,
              course,
              section: sec,
              program,
              batch,
              color: bg,
              textColor: cell.fg || '#000000',
              bold: Boolean(cell.bold),
              type: isLab || course.toLowerCase().includes('lab') ? 'lab' : 'lecture',
            };

            const existing = sectionsMap.get(docId).schedule.find(
              (e: any) => e.day === entry.day && e.slot === entry.slot && e.course === entry.course && e.section === entry.section
            );
            if (!existing) {
              sectionsMap.get(docId).schedule.push(entry);
            }
          });
        });
      });
    });
  });

  const dayOrder: Record<string, number> = { "Monday":1, "Tuesday":2, "Wednesday":3, "Thursday":4, "Friday":5, "Saturday":6 };
  for (const [_, val] of sectionsMap.entries()) {
    val.schedule.sort((a: any, b: any) => {
      if (a.day !== b.day) return (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      return a.startMins - b.startMins;
    });
  }

  // Upload to Firestore
  let batchWriter = writeBatch(db);
  let count = 0;

  // Save new metadata with lastModifiedTime
  const metadataRef = doc(db, 'sections', '_metadata');
  await setDoc(metadataRef, {
    lastModifiedTime: newModifiedTime || new Date().toISOString(),
    lastSyncedAt: new Date().toISOString(),
    sectionsCount: sectionsMap.size,
  });

  for (const [docId, val] of sectionsMap.entries()) {
    const safeId = docId.replace(/[\/]+/g, '-');
    batchWriter.set(doc(db, 'sections', safeId), val);
    count++;
    if (count % 100 === 0) {
      await batchWriter.commit();
      batchWriter = writeBatch(db);
    }
  }

  if (count % 100 !== 0) {
    await batchWriter.commit();
  }

  console.log(`[Sync Engine] Successfully updated ${count} sections with modifiedTime: ${newModifiedTime}`);
  return sectionsMap;
}
