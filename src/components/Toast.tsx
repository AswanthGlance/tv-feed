export default function Toast({ msg, show }: { msg: string; show: boolean }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 48,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(112, 71, 226, 0.92)',
        color: '#F5F3F7',
        padding: '14px 36px',
        borderRadius: 40,
        fontSize: 22,
        fontWeight: 600,
        letterSpacing: 0.2,
        boxShadow: '0 4px 32px rgba(112,71,226,0.35)',
        pointerEvents: 'none',
        zIndex: 9999,
        opacity: show ? 1 : 0,
        transition: 'opacity 0.35s ease',
        whiteSpace: 'nowrap',
      }}
    >
      {msg}
    </div>
  );
}
