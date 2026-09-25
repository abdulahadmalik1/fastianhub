import { NextRequest, NextResponse } from 'next/server';

const ISLAMABAD_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/fsc-past-papers/main';
const KARACHI_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/PastPaper-FAST-NUCES/main';
const LAHORE_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/past-papers/main';
const CFD_RAW_BASE = 'https://raw.githubusercontent.com/malikhacks/FAST-NUCES-CFD/master';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  const source = (searchParams.get('source') || 'islamabad').toLowerCase();
  const isDownload = searchParams.get('download') === 'true';

  if (!filePath) {
    return new NextResponse('File path is required', { status: 400 });
  }

  // Prevent directory traversal or unauthorized access
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');
  if (!normalizedPath || normalizedPath.startsWith('.')) {
    return new NextResponse('Invalid file path', { status: 403 });
  }

  let rawBase = ISLAMABAD_RAW_BASE;
  if (source === 'karachi') {
    rawBase = KARACHI_RAW_BASE;
  } else if (source === 'lahore' || source === 'central' || source === 'time-machine') {
    rawBase = LAHORE_RAW_BASE;
  } else if (source === 'cfd' || source === 'faisalabad') {
    rawBase = CFD_RAW_BASE;
  }

  // Encode each segment for safe fetch
  const encodedPath = normalizedPath
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  const targetUrl = `${rawBase}/${encodedPath}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'FastianHub',
      },
      next: { revalidate: 86400 }, // Cache on server for 24h
    });

    if (!upstreamRes.ok) {
      return new NextResponse('File not found', { status: upstreamRes.status });
    }

    let contentType = upstreamRes.headers.get('content-type') || 'application/octet-stream';
    const lowerPath = normalizedPath.toLowerCase();
    if (lowerPath.endsWith('.pdf')) {
      contentType = 'application/pdf';
    } else if (lowerPath.endsWith('.png')) {
      contentType = 'image/png';
    } else if (lowerPath.endsWith('.jpg') || lowerPath.endsWith('.jpeg')) {
      contentType = 'image/jpeg';
    } else if (lowerPath.endsWith('.webp')) {
      contentType = 'image/webp';
    } else if (lowerPath.endsWith('.doc')) {
      contentType = 'application/msword';
    } else if (lowerPath.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (lowerPath.endsWith('.ppt')) {
      contentType = 'application/vnd.ms-powerpoint';
    } else if (lowerPath.endsWith('.pptx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    } else if (lowerPath.endsWith('.zip')) {
      contentType = 'application/zip';
    } else if (
      lowerPath.endsWith('.txt') ||
      lowerPath.endsWith('.c') ||
      lowerPath.endsWith('.cpp') ||
      lowerPath.endsWith('.java') ||
      lowerPath.endsWith('.py') ||
      lowerPath.endsWith('.asm') ||
      lowerPath.endsWith('.html') ||
      lowerPath.endsWith('.xml') ||
      lowerPath.endsWith('.csv') ||
      lowerPath.endsWith('.json') ||
      lowerPath.endsWith('.sql')
    ) {
      contentType = 'text/plain; charset=utf-8';
    }

    const fileName = normalizedPath.split('/').pop() || 'document.pdf';

    const dispositionType = isDownload ? 'attachment' : 'inline';
    const disposition = `${dispositionType}; filename="${encodeURIComponent(fileName)}"`;

    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Content-Disposition', disposition);
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=86400');

    // Stream the response body directly
    return new NextResponse(upstreamRes.body, {
      status: 200,
      headers,
    });
  } catch (err: any) {
    console.error('[Papers Proxy Error]:', err);
    return new NextResponse('Failed to retrieve file', { status: 502 });
  }
}
