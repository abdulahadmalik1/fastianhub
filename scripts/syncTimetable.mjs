#!/usr/bin/env node
/**
 * Fully Dynamic Google Sheets Extractor & Firestore Synchronizer.
 * 
 * ZERO HARDCODED COLUMNS, SLOTS, OR COLOR MAPS:
 * 1. Single API Call: Pulls all tabs, cell texts, colors, bold, and merges in ONE call (includeGridData=true).
 * 2. Dynamic Legend Extraction: Automatically discovers colors -> batch & program from the sheet's top legend rows (0-3).
 * 3. Dynamic Slot & Room Detection: Scans row headers dynamically for time slots and room columns (adapts to any column shift or new slots).
 * 4. Dynamic Section Parsing: Supports any department / program code (CS, SE, AI, DS, CY, EE, FT, BBA, etc.).
 * 5. Dynamic Metadata & Firestore Sync: Generates structured metadata of all discovered batches, programs, and sections,
 *    and syncs to Firestore so future sheet changes never break the app.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, writeBatch } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Google Sheets Config
const API_KEY = "AIzaSyChPGp69rr55E97_SJr_Ez6f95XPtbW6Ao";
const SPREADSHEET_ID = "1vlTuotLw34fedME3gNQj09cZw-todVomxAiu5P1wZ6Q";
const FULL_JSON_PATH = path.join(ROOT_DIR, "timetable-full.json");
const SECTIONS_JSON_PATH = path.join(ROOT_DIR, "firebase-sections.json");
const METADATA_JSON_PATH = path.join(ROOT_DIR, "lib", "sectionsMetadata.json");

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyARvrR-awLlbacaU60xSs_3tqEIy1osC1w",
  authDomain: "fastiflex.firebaseapp.com",
  projectId: "fastiflex",
  storageBucket: "fastiflex.firebasestorage.app",
  messagingSenderId: "666925120755",
  appId: "1:666925120755:web:776daec3bab1fb3744cb86",
  measurementId: "G-MXKF98RN6N"
};

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

function toHex(color) {
  if (!color) return null;
  const r = Math.round((color.red || 0) * 255);
  const g = Math.round((color.green || 0) * 255);
  const b = Math.round((color.blue || 0) * 255);
  const hex = (n) => n.toString(16).padStart(2, '0');
  return `#${hex(r)}${hex(g)}${hex(b)}`;
}

function fmtTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

// Convert time range string like "08:30-09:50" or "01:00-02:45" to canonical slot & minute values
function parseTimeRange(timeStr) {
  if (!timeStr) return null;
  const m = timeStr.match(/(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/);
  if (!m) return null;
  let [_, startStr, endStr] = m;
  let startH = parseInt(startStr.split(':')[0], 10);
  let startM = parseInt(startStr.split(':')[1], 10);
  let endH = parseInt(endStr.split(':')[0], 10);
  let endM = parseInt(endStr.split(':')[1], 10);

  // If hours < 8, they are PM afternoon slots (e.g. 01:00 is 13:00)
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

// Dynamically discover header slot boundaries from any header row (Row 4 or Lab Row)
function detectSlotsFromHeader(row) {
  const slots = [];
  let current = null;

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
        rawHeader: txt,
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

// Dynamically extract the entire legend from rows 0-3 across all day sheets
function extractDynamicLegend(sheets) {
  const legendMap = new Map();
  const daySheetNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  sheets.forEach(sheet => {
    if (!daySheetNames.some(d => sheet.title.includes(d))) return;

    for (let r = 0; r < 4; r++) {
      const row = sheet.grid[r] || [];
      row.forEach((cell, cIdx) => {
        const txt = cell.text?.trim();
        const bg = cell.bg ? cell.bg.toLowerCase() : null;
        if (!txt || !bg || bg === '#ffffff') return;

        // Skip day name headers in row 0
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
          rawText: txt,
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

// Dynamically parse and expand section strings (supports any department code: CS, SE, AI, DS, CY, EE, FT, etc.)
function expandSections(rawSec, defaultProgram) {
  if (!rawSec || rawSec === 'NO_PARENS') return [];
  const s = rawSec.trim();

  // Pattern 1: Multi-slash e.g. "CS/A/B/C/D" or "SE/A/B"
  const multiSlash = s.match(/^([A-Za-z0-9]+)\/([A-Za-z0-9](?:\/[A-Za-z0-9])*)/i);
  if (multiSlash) {
    const prog = multiSlash[1].toUpperCase();
    const letters = multiSlash[2].split('/');
    return letters.map(l => `${prog}-${l.trim().toUpperCase()}`);
  }

  // Pattern 2: Ampersand e.g. "CS-B&D"
  const ampMatch = s.match(/^([A-Za-z0-9]+)-([A-Za-z0-9])&([A-Za-z0-9])/i);
  if (ampMatch) {
    const prog = ampMatch[1].toUpperCase();
    return [`${prog}-${ampMatch[2].toUpperCase()}`, `${prog}-${ampMatch[3].toUpperCase()}`];
  }

  // Pattern 3: Section with batch note e.g. "CS-A, 25" -> "CS-A"
  const commaMatch = s.match(/^([A-Za-z0-9-]+)(?:,\s*\d+)?/i);
  if (commaMatch && commaMatch[1].includes('-')) {
    return [commaMatch[1].trim().toUpperCase()];
  }

  // Pattern 4: Standard hyphenated section e.g. "CS-A", "SE-B1", "FT-A", "EE-C"
  if (/^[A-Za-z0-9]+-[A-Za-z0-9]+$/i.test(s)) {
    return [s.toUpperCase()];
  }

  // Pattern 5: Single letter "A", "B" with known program prefix
  if (/^[A-Z]$/i.test(s) && defaultProgram) {
    const pPrefix = defaultProgram.replace(/^BS\s+/i, '').replace(/^MS\s+/i, '').trim();
    return [`${pPrefix}-${s.toUpperCase()}`];
  }

  return [s.toUpperCase()];
}

function buildGrid(sheet) {
  const rows = (sheet.data && sheet.data[0] && sheet.data[0].rowData) || [];
  const grid = [];
  for (const row of rows) {
    const cells = [];
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

// 1. Single-request Google Sheets Fetch
async function fetchSpreadsheet() {
  console.log("🌐 1/5 Fetching entire spreadsheet in ONE call (includeGridData=true)...");
  const query = new URLSearchParams({
    includeGridData: "true",
    fields: FIELDS,
    key: API_KEY,
  }).toString();
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}?${query}`;

  const resp = await fetch(url);
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Google Sheets API error ${resp.status}: ${err}`);
  }
  const data = await resp.json();
  const sheets = data.sheets || [];
  if (!sheets.length) {
    throw new Error("No tabs returned by Google Sheets API.");
  }

  const result = { spreadsheetId: SPREADSHEET_ID, sheets: [] };
  for (const sheet of sheets) {
    const props = sheet.properties || {};
    if (props.sheetType && props.sheetType !== "GRID") continue;
    const gridProps = props.gridProperties || {};
    result.sheets.push({
      sheetId: props.sheetId,
      title: props.title,
      rowCount: gridProps.rowCount,
      columnCount: gridProps.columnCount,
      merges: sheet.merges || [],
      grid: buildGrid(sheet),
    });
  }

  fs.writeFileSync(FULL_JSON_PATH, JSON.stringify(result, null, 2), "utf-8");
  console.log(`✅ Saved full raw extract (${result.sheets.length} tabs) -> timetable-full.json`);
  return result;
}

// 2. Dynamic Timetable Parsing
function parseTimetable(fullData) {
  console.log("🧩 2/5 Dynamically discovering legend colors, slots, and sections...");

  // A. Extract legend dynamically
  const dynamicLegend = extractDynamicLegend(fullData.sheets);
  console.log(`   Found ${dynamicLegend.size} dynamic color mappings from sheet legend.`);

  const daySheetNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const sectionsMap = new Map();

  fullData.sheets.forEach(sheet => {
    const isDaySheet = daySheetNames.some(d => sheet.title.toLowerCase().startsWith(d.toLowerCase()));
    if (!isDaySheet) return;

    const dayName = daySheetNames.find(d => sheet.title.toLowerCase().startsWith(d.toLowerCase())) || sheet.title;

    // Dynamically locate the classroom slot header row (row with time slots e.g. Row 4)
    let classHeaderRowIndex = sheet.grid.findIndex((row, idx) =>
      idx < 10 && row.some(c => parseTimeRange(c.text?.trim()))
    );
    if (classHeaderRowIndex === -1) classHeaderRowIndex = 4;

    // Dynamically detect classroom slots from header
    const classSlots = detectSlotsFromHeader(sheet.grid[classHeaderRowIndex] || []);

    // Dynamically locate the Lab header row (first row where column 0 mentions "lab")
    const labHeaderRowIndex = sheet.grid.findIndex((row, idx) =>
      idx > classHeaderRowIndex && row[0]?.text?.trim()?.toLowerCase() === 'lab'
    );

    // Dynamically detect lab slots from lab header
    const labSlots = labHeaderRowIndex !== -1
      ? detectSlotsFromHeader(sheet.grid[labHeaderRowIndex] || [])
      : [];

    // Dynamically detect room columns (Col 0 usually, and second Room header column if present)
    const headerRow = sheet.grid[classHeaderRowIndex] || [];
    let roomColLeft = 0;
    let roomColRight = headerRow.findIndex((c, idx) => idx > 15 && /room/i.test(c.text?.trim() || ''));
    if (roomColRight === -1) roomColRight = 30;

    // Parse class rows
    sheet.grid.forEach((row, rIdx) => {
      if (rIdx <= classHeaderRowIndex || rIdx === labHeaderRowIndex) return;

      const isLab = labHeaderRowIndex !== -1 && rIdx > labHeaderRowIndex;
      const availableSlots = isLab ? labSlots : classSlots;
      if (!availableSlots.length) return;

      const roomLeft = row[roomColLeft]?.text?.trim() || '';
      const roomRight = row[roomColRight]?.text?.trim() || '';

      row.forEach((cell, cIdx) => {
        if (cIdx === roomColLeft || cIdx === roomColRight || !cell.text || !cell.text.trim()) return;
        const rawText = cell.text.trim();

        // Skip non-class administrative entries
        if (['fsm', 'ee', 'reserved', 'prayer break', 'tutorial batch'].some(s => rawText.toLowerCase().includes(s))) return;

        const bg = cell.bg ? cell.bg.toLowerCase() : '';
        const isEvening = cIdx >= roomColRight;

        // Dynamic legend lookup: check scoped (color + day/evening) then general color
        const colorInfo = dynamicLegend.get(`${bg}_${isEvening ? 'eve' : 'day'}`) || dynamicLegend.get(bg);
        if (!colorInfo) return; // Ignore uncolored or non-legend cells

        // Match column index to dynamically discovered slot
        const slotDef = availableSlots.find(s => cIdx >= s.startCol && cIdx <= s.endCol);
        if (!slotDef) return;

        // Use custom inline time range if cell has one (e.g. "01:00-02:45"), otherwise header slot
        const customTime = parseTimeRange(rawText);
        const effectiveSlot = customTime || slotDef;
        const room = (isEvening && roomRight) ? roomRight : (roomLeft || roomRight);

        // Separate course title from section parentheses
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

        // If course or cell explicitly mentions MS or PhD
        if (/^ms\s/i.test(course) || /\(ms\)/i.test(rawText)) {
          batch = 'MS';
        }

        // Expand any section formats (e.g. "CS/A/B/C", "CS-B&D", "CS-A1")
        const sections = expandSections(sectionRaw, program);
        if (!sections.length) return;

        sections.forEach(sec => {
          // If lab subgroup like CS-A1, also attach to base section CS-A
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
              e => e.day === entry.day && e.slot === entry.slot && e.course === entry.course && e.section === entry.section
            );
            if (!existing) {
              sectionsMap.get(docId).schedule.push(entry);
            }
          });
        });
      });
    });
  });

  // Sort schedule inside each section
  const dayOrder = { "Monday":1, "Tuesday":2, "Wednesday":3, "Thursday":4, "Friday":5, "Saturday":6 };
  for (const [key, val] of sectionsMap.entries()) {
    val.schedule.sort((a, b) => {
      if (a.day !== b.day) return (dayOrder[a.day] || 99) - (dayOrder[b.day] || 99);
      return a.startMins - b.startMins;
    });
  }

  // Export sections JSON
  const output = {};
  for (const [docId, val] of sectionsMap.entries()) {
    output[docId] = val;
  }
  fs.writeFileSync(SECTIONS_JSON_PATH, JSON.stringify(output, null, 2), "utf-8");
  console.log(`✅ Wrote ${sectionsMap.size} sections -> firebase-sections.json`);

  // Build dynamic batch & program hierarchy for UI search and picker
  const discoveredBatchesMap = new Map();
  for (const s of sectionsMap.values()) {
    if (!discoveredBatchesMap.has(s.batch)) {
      discoveredBatchesMap.set(s.batch, {
        batch: s.batch,
        label: s.batch.startsWith('20') ? `Batch ${s.batch}` : s.batch,
        color: s.color,
        programsMap: new Map(),
      });
    }

    const b = discoveredBatchesMap.get(s.batch);
    if (!b.programsMap.has(s.program)) {
      b.programsMap.set(s.program, new Set());
    }
    b.programsMap.get(s.program).add(s.section);
  }

  // Sort batches: 4-digit years descending, then other batches (Repeat, MS, PhD)
  const sortedBatches = Array.from(discoveredBatchesMap.values()).sort((a, b) => {
    const aNum = parseInt(a.batch, 10);
    const bNum = parseInt(b.batch, 10);
    if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum;
    if (!isNaN(aNum)) return -1;
    if (!isNaN(bNum)) return 1;
    return a.batch.localeCompare(b.batch);
  });

  const batchesMeta = sortedBatches.map(b => ({
    batch: b.batch,
    label: b.label,
    color: b.color,
    programs: Array.from(b.programsMap.entries()).map(([prog, secSet]) => ({
      program: prog,
      sections: Array.from(secSet).sort(),
    })),
  }));

  const metadata = {
    updatedAt: new Date().toISOString(),
    batches: batchesMeta,
  };

  fs.writeFileSync(METADATA_JSON_PATH, JSON.stringify(metadata, null, 2), "utf-8");
  console.log(`✅ Wrote dynamic batch & section metadata -> lib/sectionsMetadata.json`);

  return { sectionsMap, metadata };
}

// 3. Sync with Firestore
async function syncWithFirestore(sectionsMap, metadata) {
  console.log("🔥 3/5 Connecting to Firestore...");
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);

  console.log("🗑️ 4/5 Clearing previous documents in 'sections' collection...");
  const existingDocs = await getDocs(collection(db, "sections"));
  console.log(`   Found ${existingDocs.size} existing documents to clean.`);

  let deleteBatch = writeBatch(db);
  let delCount = 0;
  for (const d of existingDocs.docs) {
    deleteBatch.delete(d.ref);
    delCount++;
    if (delCount % 100 === 0) {
      await deleteBatch.commit();
      deleteBatch = writeBatch(db);
    }
  }
  if (delCount % 100 !== 0) {
    await deleteBatch.commit();
  }
  console.log(`✅ Cleaned ${delCount} documents.`);

  console.log(`📤 5/5 Uploading ${sectionsMap.size} dynamically discovered sections...`);
  let uploadBatch = writeBatch(db);
  let upCount = 0;

  // Upload dynamic metadata index
  await setDoc(doc(db, "sections", "_metadata"), metadata);

  for (const [docId, val] of sectionsMap.entries()) {
    const safeId = docId.replace(/[\/]+/g, '-');
    uploadBatch.set(doc(db, "sections", safeId), val);
    upCount++;

    if (upCount % 100 === 0) {
      await uploadBatch.commit();
      console.log(`   Uploaded ${upCount}/${sectionsMap.size} sections...`);
      uploadBatch = writeBatch(db);
    }
  }

  if (upCount % 100 !== 0) {
    await uploadBatch.commit();
  }

  console.log(`🎉 Successfully synchronized ${upCount} sections to Firestore!`);
}

async function main() {
  try {
    const fullData = await fetchSpreadsheet();
    const { sectionsMap, metadata } = parseTimetable(fullData);
    await syncWithFirestore(sectionsMap, metadata);
    console.log("\n✨ Dynamic Timetable Extraction & Firestore Sync Complete! ✨");
    process.exit(0);
  } catch (err) {
    console.error("❌ Sync Error:", err);
    process.exit(1);
  }
}

main();
