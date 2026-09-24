import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export const dynamic = 'force-dynamic';

// Ultra-fast in-memory cache (<5ms response time)
const scheduleCache = new Map<string, any>();

export function clearScheduleCache() {
  scheduleCache.clear();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const section = searchParams.get('section');

  if (!section) {
    return NextResponse.json({ error: 'Section parameter is required' }, { status: 400 });
  }

  const safeSection = section.replace(/\//g, '-');

  // 1. Instant RAM Cache hit (0-5ms)
  if (scheduleCache.has(safeSection)) {
    return NextResponse.json(
      { schedule: scheduleCache.get(safeSection) },
      {
        headers: {
          'X-Cache': 'RAM-HIT',
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400',
        },
      }
    );
  }

  try {
    let docRef = doc(db, 'sections', safeSection);
    let docSnap = await getDoc(docRef);

    // Fallback: if not found directly and no batch prefix provided, default to 2026 batch
    if (!docSnap.exists() && !safeSection.startsWith('202')) {
      const fallbackRef = doc(db, 'sections', `2026-${safeSection}`);
      const fallbackSnap = await getDoc(fallbackRef);
      if (fallbackSnap.exists()) {
        docSnap = fallbackSnap;
      }
    }

    if (docSnap.exists()) {
      const schedule = docSnap.data().schedule || [];
      scheduleCache.set(safeSection, schedule);

      return NextResponse.json(
        { schedule },
        {
          headers: {
            'X-Cache': 'FIRESTORE-MISS',
            'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=86400',
          },
        }
      );
    } else {
      return NextResponse.json({ schedule: [] });
    }
  } catch (error: any) {
    console.error('API Error fetching schedule:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch schedule' }, { status: 500 });
  }
}
