import { useState } from 'react';
import { BorderBeam } from 'border-beam';
import type { BorderBeamColorVariant, BorderBeamSize } from 'border-beam';

const DEFAULTS = {
  brightness: 1.0,
  saturation: 1.0,
  duration: 2.0,
  strength: 1.0,
  colorVariant: 'colorful' as BorderBeamColorVariant,
  size: 'md' as BorderBeamSize,
};

export default function BeamButtonPOC() {
  const [cfg, setCfg] = useState({ ...DEFAULTS });

  function set(key: keyof typeof DEFAULTS, value: number | string) {
    setCfg(prev => ({ ...prev, [key]: value }));
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: '#111',
      display: 'flex',
      fontFamily: 'system-ui',
      overflowY: 'auto',
    }}>
      {/* ── Controls panel ── */}
      <div style={{
        width: 260,
        flexShrink: 0,
        background: 'rgba(255,255,255,0.04)',
        borderRight: '1px solid rgba(255,255,255,0.08)',
        padding: '28px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}>
        <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.02em' }}>Controls</div>

        <Slider label="Brightness" value={cfg.brightness} min={0.1} max={3} step={0.05}
          onChange={v => set('brightness', v)} />
        <Slider label="Saturation" value={cfg.saturation} min={0.1} max={4} step={0.1}
          onChange={v => set('saturation', v)} />
        <Slider label="Duration (s)" value={cfg.duration} min={0.5} max={6} step={0.1}
          onChange={v => set('duration', v)} />
        <Slider label="Strength" value={cfg.strength} min={0} max={2} step={0.05}
          onChange={v => set('strength', v)} />

        <Select label="Color" value={cfg.colorVariant}
          options={['colorful', 'ocean', 'sunset', 'mono']}
          onChange={v => set('colorVariant', v)} />

        <Select label="Size" value={cfg.size}
          options={['sm', 'md', 'line']}
          onChange={v => set('size', v)} />

        <button
          onClick={() => setCfg({ ...DEFAULTS })}
          style={{
            marginTop: 8,
            padding: '10px 0',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: '#fff',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Reset to defaults
        </button>
      </div>

      {/* ── Preview area ── */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 52,
        padding: '40px 0',
      }}>
        <h2 style={{ color: '#fff', fontWeight: 700, fontSize: 22, margin: 0, letterSpacing: '-0.02em' }}>
          Beam Button POC
        </h2>

        <div style={{ display: 'flex', gap: 20, marginBottom: -32 }}>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, width: 260, textAlign: 'center' }}>Dark</span>
          <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: 12, width: 260, textAlign: 'center' }}>White</span>
        </div>

        {/* Pill button row */}
        <Row label="Pill button">
          <BorderBeam size={cfg.size} colorVariant={cfg.colorVariant} duration={cfg.duration}
            strength={cfg.strength}>
            <BeamPillButton label="See the secret recipe" />
          </BorderBeam>
          <BorderBeam size={cfg.size} colorVariant={cfg.colorVariant} duration={cfg.duration}
            brightness={cfg.brightness} saturation={cfg.saturation} strength={cfg.strength}>
            <BeamPillButtonWhite label="See the secret recipe" />
          </BorderBeam>
        </Row>

        {/* Card row */}
        <Row label="Card">
          <BorderBeam size={cfg.size} colorVariant={cfg.colorVariant} duration={cfg.duration}
            strength={cfg.strength}>
            <BeamCard />
          </BorderBeam>
          <BorderBeam size={cfg.size} colorVariant={cfg.colorVariant} duration={cfg.duration}
            brightness={cfg.brightness} saturation={cfg.saturation} strength={cfg.strength}>
            <BeamCardWhite />
          </BorderBeam>
        </Row>
      </div>
    </div>
  );
}

// ── Layout helpers ────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 13, marginBottom: 20 }}>{label}</p>
      <div style={{ display: 'flex', gap: 40, alignItems: 'center', justifyContent: 'center' }}>
        {children}
      </div>
    </div>
  );
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>{label}</span>
        <span style={{ color: '#fff', fontSize: 12, fontWeight: 600 }}>{value.toFixed(2)}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        style={{ width: '100%', accentColor: '#7047E2' }} />
    </div>
  );
}

function Select({ label, value, options, onChange }: {
  label: string; value: string; options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(o => (
          <button key={o} onClick={() => onChange(o)} style={{
            padding: '5px 12px', borderRadius: 6,
            background: value === o ? '#7047E2' : 'rgba(255,255,255,0.07)',
            border: '1px solid ' + (value === o ? '#7047E2' : 'rgba(255,255,255,0.1)'),
            color: '#fff', fontSize: 12, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'inherit',
          }}>{o}</button>
        ))}
      </div>
    </div>
  );
}

// ── Card & button variants ────────────────────────────────────────────────────

function BeamPillButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      height: 54, padding: '0 26px',
      borderRadius: 999,
      background: 'rgba(255,255,255,0.95)',
      border: 'none', cursor: 'pointer', outline: 'none',
      fontSize: 18, fontWeight: 600, color: '#111',
      fontFamily: 'inherit', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 16, color: '#7047E2' }}>⊙</span>
      {label}
    </button>
  );
}

function BeamPillButtonWhite({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 10,
      height: 54, padding: '0 26px',
      borderRadius: 999,
      background: '#fff',
      border: 'none', cursor: 'pointer', outline: 'none',
      fontSize: 18, fontWeight: 600, color: '#111',
      fontFamily: 'inherit', whiteSpace: 'nowrap',
      boxShadow: '0 2px 16px rgba(0,0,0,0.12)',
    }}>
      <span style={{ fontSize: 16, color: '#7047E2' }}>⊙</span>
      {label}
    </button>
  );
}

function BeamCard() {
  return (
    <div style={{
      width: 260, padding: '24px 28px',
      borderRadius: 16,
      background: 'rgba(255,255,255,0.06)',
      color: '#fff', textAlign: 'left',
    }}>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Premium Card</div>
      <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14 }}>
        border-beam wraps any element automatically.
      </div>
    </div>
  );
}

function BeamCardWhite() {
  return (
    <div style={{
      width: 260, padding: '24px 28px',
      borderRadius: 16,
      background: '#fff',
      color: '#111', textAlign: 'left',
      boxShadow: '0 2px 16px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8 }}>Premium Card</div>
      <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 14 }}>
        border-beam wraps any element automatically.
      </div>
    </div>
  );
}

/* Production-ready version used in the real CTA */
export function CSSBeamButton({ label, onClick }: { label: string; onClick?: () => void }) {
  return (
    <BorderBeam size="sm" colorVariant="colorful" duration={1.96}>
      <BeamPillButton label={label} onClick={onClick} />
    </BorderBeam>
  );
}
