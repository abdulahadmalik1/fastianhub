import { NextResponse } from 'next/server';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDriveModifiedTime, syncSpreadsheet } from '@/lib/syncEngine';
import { TIME_SLOTS, LAB_SLOTS, DAYS, Day } from '@/lib/timetableData';

export const dynamic = 'force-dynamic';

// In-memory cache for room schedules by day (<5ms response time)
interface DayRoomCache {
  timestamp: number;
  data: any[];
}
const dayCache = new Map<string, DayRoomCache>();

// Known standard campus rooms (fallback if needed)
const KNOWN_ROOMS = [
  // Building C
  { name: 'C-301', building: 'Building C', type: 'lecture' },
  { name: 'C-302', building: 'Building C', type: 'lecture' },
  { name: 'C-303', building: 'Building C', type: 'lecture' },
  { name: 'C-304', building: 'Building C', type: 'lecture' },
  { name: 'C-305', building: 'Building C', type: 'lecture' },
  { name: 'C-306', building: 'Building C', type: 'lecture' },
  { name: 'C-307', building: 'Building C', type: 'lecture' },
  { name: 'C-308', building: 'Building C', type: 'lecture' },
  { name: 'C-309', building: 'Building C', type: 'lecture' },
  { name: 'C-310', building: 'Building C', type: 'lecture' },
  { name: 'C-311', building: 'Building C', type: 'lecture' },
  { name: 'C-201', building: 'Building C', type: 'lecture' },
  { name: 'C-202', building: 'Building C', type: 'lecture' },
  { name: 'C-203', building: 'Building C', type: 'lecture' },
  { name: 'C-204', building: 'Building C', type: 'lecture' },
  { name: 'C-205', building: 'Building C', type: 'lecture' },
  // Building D
  { name: 'D-101', building: 'Building D', type: 'lecture' },
  { name: 'D-102', building: 'Building D', type: 'lecture' },
  { name: 'D-103', building: 'Building D', type: 'lecture' },
  { name: 'D-104', building: 'Building D', type: 'lecture' },
  { name: 'D-105', building: 'Building D', type: 'lecture' },
  { name: 'D-106', building: 'Building D', type: 'lecture' },
  { name: 'D-107', building: 'Building D', type: 'lecture' },
  { name: 'D-108', building: 'Building D', type: 'lecture' },
  { name: 'D-201', building: 'Building D', type: 'lecture' },
  { name: 'D-202', building: 'Building D', type: 'lecture' },
  { name: 'D-203', building: 'Building D', type: 'lecture' },
  { name: 'D-204', building: 'Building D', type: 'lecture' },
  { name: 'D-205', building: 'Building D', type: 'lecture' },
  // Labs
  { name: 'Margala 1 (C-209)', building: 'Labs', type: 'lab' },
  { name: 'Margala 2 (C-210)', building: 'Labs', type: 'lab' },
  { name: 'Margala 3', building: 'Labs', type: 'lab' },
  { name: 'Rawal 1', building: 'Labs', type: 'lab' },
  { name: 'Rawal 2', building: 'Labs', type: 'lab' },
  { name: 'Rawal 3', building: 'Labs', type: 'lab' },
  { name: 'Karakoram-1', building: 'Labs', type: 'lab' },
  { name: 'Karakoram-2', building: 'Labs', type: 'lab' },
  { name: 'Karakoram-3', building: 'Labs', type: 'lab' },
  { name: 'Kybher-1', building: 'Labs', type: 'lab' },
  { name: 'Kybher-2', building: 'Labs', type: 'lab' },
  { name: 'Kybher-3', building: 'Labs', type: 'lab' },
  { name: 'IT Lab 1', building: 'Labs', type: 'lab' },
  { name: 'IT Lab 2 (D-211)', building: 'Labs', type: 'lab' },
];

function getBuilding(roomName: string): string {
  const r = roomName.toLowerCase();
  if (r.startsWith('c-') || r.includes('(c-')) return 'Building C';
  if (r.startsWith('d-') || r.includes('(d-')) return 'Building D';
  if (r.startsWith('a-')) return 'Building A';
  if (r.startsWith('b-')) return 'Building B';
  if (r.includes('lab') || r.includes('margala') || r.includes('rawal') || r.includes('karakoram') || r.includes('kybher')) return 'Labs';
  return 'Other';
}

function parseMins(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const day = url.searchParams.get('day') || 'Monday';
    const slot = url.searchParams.get('slot'); // optional canonical slot like "08:30-09:50"
    const targetMins = url.searchParams.get('mins') ? parseInt(url.searchParams.get('mins')!, 10) : null;
    const force = url.searchParams.get('force') === 'true';

    // 1. Sync Check: Check Google Drive modifiedTime vs Firestore _metadata
    try {
      const metadataRef = doc(db, 'sections', '_metadata');
      const [metadataSnap, currentModifiedTime] = await Promise.all([
        getDoc(metadataRef),
        getDriveModifiedTime(),
      ]);

      const storedModifiedTime = metadataSnap.exists() ? metadataSnap.data()?.lastModifiedTime : null;

      // If modified on Drive, sync to Firestore immediately
      if (currentModifiedTime && (currentModifiedTime !== storedModifiedTime || force)) {
        console.log(`[Free Rooms] Sheet update detected: ${storedModifiedTime} -> ${currentModifiedTime}. Updating Firestore...`);
        await syncSpreadsheet(currentModifiedTime);
        dayCache.clear();
      }
    } catch (checkErr) {
      console.warn('[Free Rooms] Update check skipped, using cached Firestore data:', checkErr);
    }

    // 2. Cache Hit check for computed day schedule
    const cacheKey = `${day}`;
    let dayRooms = dayCache.get(cacheKey)?.data;

    if (!dayRooms || force) {
      // Query sections from Firestore to aggregate room occupancy for the requested day
      const sectionsSnap = await getDocs(collection(db, 'sections'));
      const roomOccupancyMap = new Map<string, any[]>();
      const discoveredRooms = new Set<string>();

      sectionsSnap.forEach((docSnap) => {
        if (docSnap.id === '_metadata') return;
        const schedule = docSnap.data().schedule || [];

        schedule.forEach((entry: any) => {
          if (!entry.room || entry.day.toLowerCase() !== day.toLowerCase()) return;
          const roomName = entry.room.trim();
          discoveredRooms.add(roomName);

          if (!roomOccupancyMap.has(roomName)) {
            roomOccupancyMap.set(roomName, []);
          }

          roomOccupancyMap.get(roomName)!.push({
            slot: entry.slot,
            startMins: entry.startMins,
            endMins: entry.endMins,
            startLabel: entry.startLabel,
            endLabel: entry.endLabel,
            course: entry.course,
            section: entry.section,
            type: entry.type || 'lecture',
          });
        });
      });

      // Combine known rooms and any discovered rooms
      const allRoomNames = Array.from(new Set([
        ...KNOWN_ROOMS.map(r => r.name),
        ...Array.from(discoveredRooms)
      ])).sort();

      dayRooms = allRoomNames.map((roomName) => {
        const occupied = roomOccupancyMap.get(roomName) || [];
        // Deduplicate duplicate section slots
        const uniqueOccupied: any[] = [];
        occupied.forEach(occ => {
          if (!uniqueOccupied.some(u => u.slot === occ.slot && u.course === occ.course)) {
            uniqueOccupied.push(occ);
          }
        });

        // Determine free standard slots
        const occupiedSlots = new Set(uniqueOccupied.map(o => o.slot));
        const freeSlots = TIME_SLOTS.filter(s => {
          const [sStart, sEnd] = s.split('-').map(parseMins);
          // Check if any occupied entry overlaps with this slot
          return !uniqueOccupied.some(occ => {
            return occ.startMins < sEnd && occ.endMins > sStart;
          });
        });

        return {
          room: roomName,
          building: getBuilding(roomName),
          type: roomName.toLowerCase().includes('lab') ? 'lab' : 'lecture',
          occupiedSlots: uniqueOccupied.sort((a, b) => a.startMins - b.startMins),
          freeSlots,
          totalFreeSlots: freeSlots.length,
          totalOccupiedSlots: uniqueOccupied.length,
        };
      });

      dayCache.set(cacheKey, { timestamp: Date.now(), data: dayRooms });
    }

    // 3. Filter by slot or time if requested
    let results = dayRooms.map(r => {
      let isFree = true;
      let occupyingClass = null;

      if (slot && slot !== 'all') {
        const [targetStart, targetEnd] = slot.split('-').map(parseMins);
        const match = r.occupiedSlots.find((occ: any) => occ.startMins < targetEnd && occ.endMins > targetStart);
        if (match) {
          isFree = false;
          occupyingClass = match;
        }
      } else if (targetMins !== null) {
        const match = r.occupiedSlots.find((occ: any) => occ.startMins <= targetMins && occ.endMins > targetMins);
        if (match) {
          isFree = false;
          occupyingClass = match;
        }
      }

      return {
        ...r,
        isFree,
        occupyingClass,
      };
    });

    return NextResponse.json({
      day,
      slot: slot || 'all',
      totalRooms: results.length,
      freeCount: results.filter(r => r.isFree).length,
      rooms: results,
    });
  } catch (error: any) {
    console.error('API Error in /api/free-rooms:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch free rooms' }, { status: 500 });
  }
}
