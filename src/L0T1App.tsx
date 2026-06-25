/**
 * L0T1App — Thin wrapper for the L0 T1 motion lab.
 * Route: /l0_t1 or /l0-t1
 *
 * Wraps the fixed 1920×1080 canvas in a scale-to-fit shell so it renders
 * correctly on any viewport (laptop browser, Vercel preview, TV).
 */

import React, { useEffect, useRef, useState } from 'react';
import L0T1Lab from './L0T1Lab';

export default function L0T1App() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const update = () => {
      const scaleX = window.innerWidth  / 1920;
      const scaleY = window.innerHeight / 1080;
      setScale(Math.min(scaleX, scaleY));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div style={{
      width: '100vw', height: '100vh',
      overflow: 'hidden', background: '#040208',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        width: 1920, height: 1080,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
        flexShrink: 0,
      }}>
        <L0T1Lab />
      </div>
    </div>
  );
}
