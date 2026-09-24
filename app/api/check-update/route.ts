import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getDriveModifiedTime, syncSpreadsheet } from '@/lib/syncEngine';
import { clearScheduleCache } from '@/app/api/schedule/route';

export const dynamic = 'force-dynamic';

// In-memory server cooldown so Google Drive is checked at most once every 60 seconds
let lastServerCheckTime = 0;
let cachedDriveModifiedTime: string | null = null;
let isSyncing = false;

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const force = url.searchParams.get('force') === 'true';
    const now = Date.now();

    // If a sync is already running, skip
    if (isSyncing) {
      return NextResponse.json({ updated: false, syncing: true });
    }

    // 45-second server-side throttle unless forced
    if (!force && now - lastServerCheckTime < 45_000 && cachedDriveModifiedTime) {
      return NextResponse.json({ updated: false, cached: true });
    }

    const metadataRef = doc(db, 'sections', '_metadata');
    const [metadataSnap, currentModifiedTime] = await Promise.all([
      getDoc(metadataRef),
      getDriveModifiedTime(),
    ]);

    lastServerCheckTime = now;
    cachedDriveModifiedTime = currentModifiedTime;

    const storedModifiedTime = metadataSnap.exists() ? metadataSnap.data()?.lastModifiedTime : null;

    if (currentModifiedTime && currentModifiedTime !== storedModifiedTime) {
      isSyncing = true;
      console.log(`[Check Update] Sheet modified detected: ${storedModifiedTime} -> ${currentModifiedTime}. Updating Firestore...`);
      try {
        await syncSpreadsheet(currentModifiedTime);
        clearScheduleCache();
        return NextResponse.json({ updated: true, newModifiedTime: currentModifiedTime });
      } finally {
        isSyncing = false;
      }
    }

    return NextResponse.json({ updated: false, modifiedTime: storedModifiedTime });
  } catch (err: any) {
    console.error('[Check Update Error]', err);
    return NextResponse.json({ updated: false, error: err.message }, { status: 500 });
  }
}
