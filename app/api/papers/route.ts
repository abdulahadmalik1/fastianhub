import { NextRequest, NextResponse } from 'next/server';

const RAW_REPO_BASE = 'https://raw.githubusercontent.com/malikhacks/fsc-past-papers/main';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filePath = searchParams.get('path');
  const isDownload = searchParams.get('download') === 'true';

  if (!filePath) {
    return new NextResponse('File path is required', { status: 400 });
  }

  // Prevent directory traversal or unauthorized access
  const normalizedPath = filePath.replace(/\\/g, '/').replace(/\.\./g, '').replace(/^\/+/, '');
  if (!normalizedPath.startsWith('semester-') && !normalizedPath.startsWith('Course Outlines/')) {
    return new NextResponse('Invalid file path', { status: 403 });
  }

  // Encode each segment for safe fetch
  const encodedPath = normalizedPath
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  const targetUrl = `${RAW_REPO_BASE}/${encodedPath}`;

  try {
    const upstreamRes = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'FastiFlex',
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
    } else if (lowerPath.endsWith('.docx')) {
      contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (lowerPath.endsWith('.zip')) {
      contentType = 'application/zip';
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
