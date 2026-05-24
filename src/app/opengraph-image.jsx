// Default OG image (Next.js opengraph-image convention).
// Used for link previews on Twitter/Slack/Discord/Messages when no per-page
// opengraph-image is set. 1200×630 is the standard.
import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'QuizFeast — Free CBT Answers & AI Study Tools';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: 80,
          color: 'white',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: 'linear-gradient(135deg, #9370ff 0%, #7c3aed 100%)',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 48,
              fontWeight: 800,
            }}
          >
            Q
          </div>
          <div style={{ fontSize: 44, fontWeight: 800 }}>QuizFeast</div>
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>
          CBT Answers &amp;
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, background: 'linear-gradient(135deg, #b5a0ff 0%, #9370ff 100%)', backgroundClip: 'text', color: 'transparent', lineHeight: 1.05 }}>
          AI Study Tools
        </div>
        <div style={{ fontSize: 28, marginTop: 30, color: '#94a3b8' }}>
          Free · No ads · No paywalls
        </div>
      </div>
    ),
    { ...size }
  );
}
