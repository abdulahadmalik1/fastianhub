import { ImageResponse } from 'next/og';

export const alt = 'FAST-NUCES Student Q&A — FastianHub';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#f7f8f4', color: '#193b2d', fontFamily: 'sans-serif', borderBottom: '16px solid #245b42' }}>
      <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>FastianHub</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 72, fontWeight: 700 }}>FAST-NUCES Student Q&amp;A</div>
        <div style={{ display: 'flex', fontSize: 32 }}>GPA, attendance, exams &amp; university life.</div>
      </div>
      <div style={{ display: 'flex', fontSize: 26, color: '#607568' }}>Ask anonymously. Explore the answers. · fastianhub.com/qa</div>
    </div>, size,
  );
}
