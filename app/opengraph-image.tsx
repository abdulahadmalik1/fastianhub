import { ImageResponse } from 'next/og';

export const alt = 'FastianHub — FAST NUCES past papers across four campuses';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 72, background: '#f7f8f4', color: '#193b2d', fontFamily: 'sans-serif', borderBottom: '16px solid #245b42' }}>
      <div style={{ display: 'flex', fontSize: 32, fontWeight: 700 }}>FastianHub</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', fontSize: 70, fontWeight: 700 }}>FAST NUCES past papers.</div>
        <div style={{ display: 'flex', fontSize: 32 }}>Sessionals, finals, quizzes &amp; study resources.</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div style={{ display: 'flex', fontSize: 26 }}>Islamabad · Karachi · Lahore · Chiniot-Faisalabad</div>
        <div style={{ display: 'flex', fontSize: 24, color: '#607568' }}>fastianhub.com</div>
      </div>
    </div>,
    size,
  );
}
