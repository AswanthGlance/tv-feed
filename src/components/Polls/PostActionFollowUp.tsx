import { useEffect, useRef, useState } from 'react';
import { THUMBS_DOWN_REASONS, DISLIKE_STEP2_QUESTION } from '../../data/preferenceQuestions';
import type { FeedItem } from '../../data/types';
import { tagOpts } from '../../data/tagLabel';

type Mode = 'l1-exit' | 'thumbs-down-step1' | 'thumbs-down-step2';

type Props = {
  mode: Mode;
  item: FeedItem;
  backgroundImage: string;
  step1Reason?: string;     // passed in for step 2 to contextualise alternatives
  onAnswer: (signal: FollowUpSignal) => void;
  onDismiss: () => void;
};

export type FollowUpSignal = {
  type: 'l1-exit' | 'thumbs-down-reason' | 'thumbs-down-alternative';
  label: string;
  key: string;
  sessionOnly: boolean;
};

const AUTO_DISMISS_MS = 9000;

export default function PostActionFollowUp({ mode, item, backgroundImage, step1Reason, onAnswer, onDismiss }: Props) {
  const [focusIdx, setFocusIdx] = useState(0);
  const [barWidth, setBarWidth] = useState(100);
  const startRef = useRef(Date.now());

  // Build a natural topic label from the card for use in questions and options
  const topicLabel = item.contextualTopic
    || (item.subCategories[0]
        ? item.subCategories[0].replace(/-/g, ' ')
        : item.category);

  const question = mode === 'l1-exit'
    ? `Want to see more ${topicLabel}?`
    : mode === 'thumbs-down-step1'
    ? "What didn't work for you?"
    : DISLIKE_STEP2_QUESTION;

  const subtext = mode === 'l1-exit'
    ? `Choose what Glance should bring into your feed next.`
    : mode === 'thumbs-down-step2'
    ? 'We\'ll reduce what didn\'t work and try a better direction.'
    : undefined;

  // Build options dynamically from card metadata
  const options: Array<{ id: string; label: string; key: string; sessionOnly: boolean }> = (() => {
    if (mode === 'l1-exit') {
      // Primary: broad "yes" — uses item's own contextual topic for specificity
      // Middle: up to 2 specific adjacent directions from the card's subCategories/vibes
      // Last: soft "Not really"
      const tags = tagOpts(item.subCategories, item.category, true).slice(0, 2);
      const specificOpts = tags.map(t => ({ id: t.key || t.label, label: `More ${t.label}`, key: t.key, sessionOnly: false }));
      return [
        { id: 'yes-more', label: `Yes — more ${topicLabel}`, key: '__yes_more__', sessionOnly: false },
        ...specificOpts,
        { id: 'not-really', label: 'Not really', key: '__not_really__', sessionOnly: false },
      ];
    }
    if (mode === 'thumbs-down-step1') {
      return THUMBS_DOWN_REASONS.map(r => ({ id: r.id, label: r.label, key: r.id, sessionOnly: r.type === 'session' }));
    }
    // step 2 — contextual alternatives based on step1 reason
    if (step1Reason === 'not-topic') {
      // Suggest adjacent categories
      const adjacent: Record<string, string[]> = {
        food: ['travel', 'home', 'wellness'],
        travel: ['wellness', 'luxury', 'home'],
        sports: ['entertainment', 'wellness', 'hobbies'],
        fashion: ['beauty', 'luxury', 'lifestyle'],
        entertainment: ['culture', 'music', 'home'],
        home: ['wellness', 'lifestyle', 'food'],
      };
      const alts = adjacent[item.category] || ['wellness', 'travel', 'home'];
      return alts.map(a => ({ id: a, label: `More ${a}`, key: a, sessionOnly: false }));
    }
    if (step1Reason === 'wrong-vibe' || step1Reason === 'too-busy') {
      return [
        { id: 'calmer', label: 'Something calmer', key: 'calm', sessionOnly: false },
        { id: 'different-style', label: 'A different style', key: 'vibe-change', sessionOnly: false },
        { id: 'skip', label: 'Just move on', key: '', sessionOnly: true },
      ];
    }
    return [
      { id: 'something-else', label: 'Show me something different', key: 'explore', sessionOnly: false },
      { id: 'skip', label: 'Just move on', key: '', sessionOnly: true },
    ];
  })();

  const totalOpts = options.length;

  useEffect(() => {
    startRef.current = Date.now();
    const raf = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.max(0, 100 - (elapsed / AUTO_DISMISS_MS) * 100);
      setBarWidth(pct);
      if (pct <= 0) { clearInterval(raf); onDismiss(); }
    }, 80);
    return () => clearInterval(raf);
  }, [mode, onDismiss]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      if (e.key === 'ArrowRight') { e.preventDefault(); setFocusIdx(i => Math.min(totalOpts - 1, i + 1)); }
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const opt = options[focusIdx];
        onAnswer({
          type: mode === 'l1-exit' ? 'l1-exit' : mode === 'thumbs-down-step1' ? 'thumbs-down-reason' : 'thumbs-down-alternative',
          label: opt.label, key: opt.key, sessionOnly: opt.sessionOnly,
        });
      }
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); onDismiss(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [focusIdx, options, mode, onAnswer, onDismiss, totalOpts]);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 22,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }}>
      {/* bg */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(3,1,10,0.97) 0%, rgba(3,1,10,0.7) 50%, rgba(19,12,44,0.5) 100%)' }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 2,
        marginBottom: 100, width: '100%', maxWidth: 900,
        background: 'rgba(14,10,30,0.88)',
        border: '1px solid rgba(167,134,229,0.2)',
        borderRadius: 24, padding: '36px 44px',
        boxShadow: '0 30px 80px rgba(0,0,0,0.6), 0 0 60px rgba(112,71,226,0.2)',
      }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#A786E5', marginBottom: 10 }}>
            {mode === 'l1-exit' ? `You just explored this` : mode === 'thumbs-down-step2' ? 'One more thing' : 'Quick question'}
          </div>
          <h3 style={{ fontFamily: 'var(--serif)', fontSize: 34, fontWeight: 600, color: '#F5F3F7', margin: 0 }}>
            {question}
          </h3>
          {subtext && <p style={{ fontSize: 16, color: '#B7B3C0', marginTop: 8 }}>{subtext}</p>}
        </div>

        {/* Options */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {options.map((opt, i) => (
            <button
              key={opt.id}
              onClick={() => onAnswer({ type: mode === 'l1-exit' ? 'l1-exit' : mode === 'thumbs-down-step1' ? 'thumbs-down-reason' : 'thumbs-down-alternative', label: opt.label, key: opt.key, sessionOnly: opt.sessionOnly })}
              onMouseEnter={() => setFocusIdx(i)}
              style={{
                padding: '14px 26px', borderRadius: 999, fontSize: 18, fontWeight: 600,
                cursor: 'pointer', fontFamily: 'var(--sans)', transition: 'all 0.15s',
                background: focusIdx === i ? '#F4F2F7' : 'rgba(255,255,255,0.07)',
                color: focusIdx === i ? '#111' : '#F5F3F7',
                border: focusIdx === i ? 'none' : '1px solid rgba(255,255,255,0.15)',
                boxShadow: focusIdx === i ? '0 0 0 3px rgba(3,1,10,0.6), 0 0 0 6px #fff, 0 0 24px rgba(255,255,255,0.3)' : 'none',
                transform: focusIdx === i ? 'scale(1.04)' : 'none',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, borderRadius: '0 0 24px 24px', background: 'rgba(167,134,229,0.15)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: '#A786E5', transition: 'width 0.08s linear' }} />
        </div>
      </div>
    </div>
  );
}
