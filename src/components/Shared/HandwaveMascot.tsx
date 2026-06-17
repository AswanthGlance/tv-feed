import { DotLottieReact } from '@lottiefiles/dotlottie-react';

// Native canvas of the lottie file is 208×200 — render at 2× for TV clarity
const NATIVE_W = 208;
const NATIVE_H = 200;

type Props = {
  scale?: number;
  className?: string;
};

export default function HandwaveMascot({ scale = 0.8, className = '' }: Props) {
  const w = Math.round(NATIVE_W * scale);
  const h = Math.round(NATIVE_H * scale);

  return (
    <div
      className={`agent-mascot agent-mascot--looking${className ? ` ${className}` : ''}`}
      style={{
        position: 'relative',
        width: w,
        height: h,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* glow */}
      <div style={{
        position: 'absolute',
        inset: -w * 0.12,
        borderRadius: '50%',
        pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(192,132,252,0.18) 0%, transparent 65%)',
        animation: '_am-glow-looking 1.8s ease-in-out infinite',
      }} />
      <DotLottieReact
        src="/handwave-mascot.lottie"
        autoplay
        loop
        width={w}
        height={h}
        style={{ position: 'relative', zIndex: 1, display: 'block' }}
      />
    </div>
  );
}
