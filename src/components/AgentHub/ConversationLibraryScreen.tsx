/**
 * ConversationLibraryScreen — the complete conversation history, reached from
 * ReturningUserScreen via "View All Conversations".
 *
 * This is where browsing and management (Archive) live — the homepage never
 * shows more than a hero + a handful of secondary cards, by design.
 *
 * Layout: sections (Today / Yesterday / Earlier This Week / Older), each a
 * horizontal carousel. Every card exposes a "More" (⋯) affordance; Enter on a
 * focused card opens a small action menu with Resume Conversation / Archive
 * Conversation. Archiving removes the card from view immediately — a real
 * app would still let a user recover it later, but that surface doesn't
 * exist in this prototype yet.
 *
 * D-pad flow: section rows stack vertically (UP/DOWN), cards within a row
 * scroll horizontally (LEFT/RIGHT). Enter on a card opens the action menu;
 * inside the menu, UP/DOWN chooses Resume/Archive and Enter confirms.
 * Escape/Backspace closes the menu if open, otherwise leaves the library.
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import GlanceLogo from '../Shared/GlanceLogo';
import { gsap } from 'gsap';
import {
  type IconComponent,
  IconHanger, IconAirplane, IconChefHat, IconGlobe, IconLotus, IconHouse,
  IconMore, IconArchive, IconPlay,
} from './agentHubIcons';

// ─── Data ──────────────────────────────────────────────────────────────────────

type LibraryConversation = {
  id: string;
  title: string;
  category: string;
  thumbnail: string;
  lastOpened: string;
  icon: IconComponent;
  accentColor: string;
};

type LibrarySection = {
  id: string;
  label: string;
  items: LibraryConversation[];
};

const IMG = '/images/feed/';

const LIBRARY_SECTIONS: LibrarySection[] = [
  {
    id: 'today', label: 'Today',
    items: [
      { id: 'wellness',  title: 'Morning Wellness Routine',   category: 'Wellness', thumbnail: `${IMG}feed_52-wellness-surf-morning.jpg`,              lastOpened: 'Today', icon: IconLotus,    accentColor: '#F06292' },
    ],
  },
  {
    id: 'yesterday', label: 'Yesterday',
    items: [
      { id: 'goa',       title: 'Goa Weekend Getaway',        category: 'Travel',   thumbnail: `${IMG}feed_54-travel-kerala-backwaters-houseboat.jpg`, lastOpened: 'Yesterday', icon: IconAirplane, accentColor: '#60A5FA' },
      { id: 'wedding',   title: 'Wedding Outfit',              category: 'Fashion',  thumbnail: `${IMG}feed_46-fashion-luxury-flatlay.jpg`,             lastOpened: 'Yesterday', icon: IconHanger,   accentColor: '#A78BFA' },
      { id: 'living',    title: 'Living Room Makeover',        category: 'Home',     thumbnail: `${IMG}feed_24-home-cozy-monsoon-living-room.jpg`,      lastOpened: 'Yesterday', icon: IconHouse,    accentColor: '#2DD4BF' },
      { id: 'seoul',     title: 'Seoul Café Recommendations',  category: 'Travel',   thumbnail: `${IMG}feed_22-travel-seoul-cafe-street.jpg`,           lastOpened: 'Yesterday', icon: IconAirplane, accentColor: '#60A5FA' },
      { id: 'japandi',   title: 'Japandi Home Inspo',          category: 'Home',     thumbnail: `${IMG}feed_28-home-japandi-minimal-living.jpg`,        lastOpened: 'Yesterday', icon: IconHouse,    accentColor: '#2DD4BF' },
      { id: 'court',     title: 'Basketball Court Picks',      category: 'Sports',   thumbnail: `${IMG}feed_45-sports-basketball-sunset-court.jpg`,     lastOpened: 'Yesterday', icon: IconGlobe,    accentColor: '#4CAF50' },
    ],
  },
  {
    id: 'earlier', label: 'Earlier This Week',
    items: [
      { id: 'ramen',     title: 'Ramen Recipe',                category: 'Recipes', thumbnail: `${IMG}feed_04-food-dinner-party-table.jpg`,             lastOpened: '2 days ago', icon: IconChefHat,  accentColor: '#FF9800' },
      { id: 'wc',        title: 'World Cup Tickets',           category: 'Sports',  thumbnail: `${IMG}feed_25-sports-cricket-stadium-floodlights.jpg`, lastOpened: '3 days ago', icon: IconGlobe,    accentColor: '#4CAF50' },
      { id: 'kerala',    title: 'Kerala Backwaters Trip',      category: 'Travel',  thumbnail: `${IMG}feed_54-travel-kerala-backwaters-houseboat.jpg`, lastOpened: '3 days ago', icon: IconAirplane, accentColor: '#60A5FA' },
      { id: 'mandap',    title: 'Wedding Mandap Decor',        category: 'Fashion', thumbnail: `${IMG}feed_33-culture-wedding-mandap-decor.jpg`,       lastOpened: '4 days ago', icon: IconHanger,   accentColor: '#A78BFA' },
      { id: 'occasion',  title: 'Big Occasion Style',          category: 'Fashion', thumbnail: `${IMG}feed_46-fashion-luxury-flatlay.jpg`,             lastOpened: '4 days ago', icon: IconHanger,   accentColor: '#A78BFA' },
      { id: 'surf',      title: 'Surf Morning Routine',        category: 'Wellness', thumbnail: `${IMG}feed_52-wellness-surf-morning.jpg`,              lastOpened: '5 days ago', icon: IconLotus,    accentColor: '#F06292' },
    ],
  },
  {
    id: 'older', label: 'Older',
    items: [
      { id: 'dinner',    title: 'Dinner Party Table Ideas',    category: 'Recipes', thumbnail: `${IMG}feed_04-food-dinner-party-table.jpg`,            lastOpened: 'Last week', icon: IconChefHat, accentColor: '#FF9800' },
      { id: 'cricket',   title: 'Cricket Stadium Nights',      category: 'Sports',  thumbnail: `${IMG}feed_25-sports-cricket-stadium-floodlights.jpg`, lastOpened: 'Last week', icon: IconGlobe,   accentColor: '#4CAF50' },
      { id: 'monsoon',   title: 'Monsoon Living Room',         category: 'Home',    thumbnail: `${IMG}feed_24-home-cozy-monsoon-living-room.jpg`,      lastOpened: 'Last week', icon: IconHouse,   accentColor: '#2DD4BF' },
    ],
  },
];

// ─── Card dimensions ───────────────────────────────────────────────────────────

const CARD_W = 220;
const CARD_H = 142;
const CONTENT_PAD_LEFT = 96;

// ─── Focus model ───────────────────────────────────────────────────────────────

type FocusState = { section: number; idx: number };

const MENU_ACTIONS = ['Resume Conversation', 'Archive Conversation'] as const;

// ─── Component ─────────────────────────────────────────────────────────────────

export type ConversationLibraryScreenProps = {
  onStartConversation?: (query: string) => void;
  onBack?: () => void;
};

export default function ConversationLibraryScreen({
  onStartConversation,
  onBack,
}: ConversationLibraryScreenProps) {
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [focus, setFocus] = useState<FocusState>({ section: 0, idx: 0 });
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuSelected, setMenuSelected] = useState<0 | 1>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Visible sections/items — archived items disappear immediately, empty
  // sections disappear entirely.
  const sections = useMemo(
    () => LIBRARY_SECTIONS
      .map(s => ({ ...s, items: s.items.filter(i => !archivedIds.has(i.id)) }))
      .filter(s => s.items.length > 0),
    [archivedIds],
  );

  const focusedItem = sections[focus.section]?.items[focus.idx] ?? null;

  // ── Entrance animation ─────────────────────────────────────────────────────

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, { opacity: 0, y: 20, duration: 0.4, ease: 'power2.out' });
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // ── Clamp focus whenever the visible section list changes (e.g. archive) ──

  useEffect(() => {
    setFocus(prev => {
      if (sections.length === 0) return prev;
      const sectionIdx = Math.min(prev.section, sections.length - 1);
      const itemIdx = Math.min(prev.idx, sections[sectionIdx].items.length - 1);
      if (sectionIdx === prev.section && itemIdx === prev.idx) return prev;
      return { section: sectionIdx, idx: Math.max(0, itemIdx) };
    });
  }, [sections]);

  // ── Auto-scroll focused row/card into view ─────────────────────────────────

  useEffect(() => {
    const sectionEl = sectionRefs.current[focus.section];
    sectionEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const card = sectionEl?.querySelectorAll<HTMLElement>('[data-lib-card]')[focus.idx];
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }, [focus]);

  // ── Keyboard navigation ────────────────────────────────────────────────────

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter',' ','Escape','Backspace'].includes(e.key)) {
      e.preventDefault();
    }

    if (menuOpen) {
      if (e.key === 'Escape' || e.key === 'Backspace') { setMenuOpen(false); return; }
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { setMenuSelected(s => (s === 0 ? 1 : 0)); return; }
      if (e.key === 'Enter' || e.key === ' ') {
        if (!focusedItem) return;
        if (menuSelected === 0) {
          onStartConversation?.(focusedItem.title);
        } else {
          setArchivedIds(prev => new Set(prev).add(focusedItem.id));
        }
        setMenuOpen(false);
      }
      return;
    }

    if (e.key === 'Escape' || e.key === 'Backspace') { onBack?.(); return; }

    if (e.key === 'ArrowUp') {
      setFocus(prev => {
        if (prev.section === 0) return prev;
        const nextSection = prev.section - 1;
        return { section: nextSection, idx: Math.min(prev.idx, sections[nextSection].items.length - 1) };
      });
      return;
    }
    if (e.key === 'ArrowDown') {
      setFocus(prev => {
        if (prev.section >= sections.length - 1) return prev;
        const nextSection = prev.section + 1;
        return { section: nextSection, idx: Math.min(prev.idx, sections[nextSection].items.length - 1) };
      });
      return;
    }
    if (e.key === 'ArrowLeft') {
      setFocus(prev => (prev.idx > 0 ? { ...prev, idx: prev.idx - 1 } : prev));
      return;
    }
    if (e.key === 'ArrowRight') {
      setFocus(prev => {
        const max = sections[prev.section]?.items.length ?? 1;
        return prev.idx < max - 1 ? { ...prev, idx: prev.idx + 1 } : prev;
      });
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      if (focusedItem) { setMenuSelected(0); setMenuOpen(true); }
    }
  }, [menuOpen, menuSelected, focusedItem, sections, onBack, onStartConversation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute', inset: 0,
        background: [
          'radial-gradient(ellipse 1100px 720px at 50% -4%, rgba(124,58,237,0.16), transparent 62%)',
          'radial-gradient(ellipse 900px 680px at 88% 88%, rgba(76,29,149,0.10), transparent 65%)',
          'linear-gradient(180deg, #07050f 0%, #05040c 55%, #06040f 100%)',
        ].join(', '),
        overflow: 'hidden',
        display: 'flex', flexDirection: 'column',
        fontFamily: '"Plus Jakarta Sans", "Instrument Sans", system-ui, sans-serif',
      }}
    >
      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '30px 96px 0' }}>
        <GlanceLogo />
        <div style={{ fontSize: 13, fontWeight: 500, color: 'rgba(245,243,247,0.4)', letterSpacing: '-0.01em' }}>
          Back to return
        </div>
      </div>

      <div style={{ padding: `20px ${CONTENT_PAD_LEFT}px 0` }}>
        <div style={{
          fontSize: 32, fontWeight: 800, letterSpacing: '-0.025em', color: '#F5F3F7',
        }}>
          Conversation Library
        </div>
        <div style={{ fontSize: 14, fontWeight: 400, color: 'rgba(245,243,247,0.45)', marginTop: 6 }}>
          Everything you've talked to Glance about.
        </div>
      </div>

      {/* ── Scrollable sections ─────────────────────────────────────────────── */}
      <div
        ref={contentRef}
        style={{
          flex: 1, overflowY: 'auto', overflowX: 'hidden', scrollbarWidth: 'none',
          paddingTop: 28, paddingBottom: 60,
        }}
      >
        {sections.length === 0 && (
          <div style={{
            paddingLeft: CONTENT_PAD_LEFT, fontSize: 15, color: 'rgba(245,243,247,0.4)',
          }}>
            No conversations to show — everything's been archived.
          </div>
        )}

        {sections.map((section, sIdx) => (
          <div
            key={section.id}
            ref={el => { sectionRefs.current[sIdx] = el; }}
            style={{ marginBottom: 32 }}
          >
            <div style={{
              paddingLeft: CONTENT_PAD_LEFT, marginBottom: 12,
              fontSize: 12, fontWeight: 600, letterSpacing: '1.8px',
              textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)',
            }}>
              {section.label}
            </div>
            <div style={{
              display: 'flex', gap: 14,
              paddingLeft: CONTENT_PAD_LEFT, paddingRight: 60,
              overflowX: 'auto', scrollbarWidth: 'none',
            }}>
              {section.items.map((item, iIdx) => {
                const focused = focus.section === sIdx && focus.idx === iIdx;
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    data-lib-card=""
                    onClick={() => {
                      setFocus({ section: sIdx, idx: iIdx });
                      setMenuSelected(0);
                      setMenuOpen(true);
                    }}
                    style={{
                      flexShrink: 0,
                      width: CARD_W, height: CARD_H,
                      borderRadius: 18, overflow: 'hidden',
                      position: 'relative', cursor: 'pointer',
                      border: focused
                        ? '2px solid rgba(255,255,255,0.92)'
                        : '1.5px solid rgba(255,255,255,0.07)',
                      boxShadow: focused
                        ? '0 8px 24px rgba(0,0,0,0.5), 0 0 0 2px rgba(255,255,255,0.10)'
                        : 'none',
                      transform: focused ? 'translateY(-5px) scale(1.02)' : 'translateY(0) scale(1)',
                      transition: 'all 0.22s cubic-bezier(0.22,0.61,0.36,1)',
                      opacity: focused ? 1 : 0.72,
                    }}
                  >
                    <img
                      src={item.thumbnail} alt=""
                      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                    <div style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(180deg, transparent 20%, rgba(5,2,16,0.88) 100%)',
                    }} />
                    {/* More affordance */}
                    <div style={{
                      position: 'absolute', top: 9, right: 9,
                      width: 26, height: 26, borderRadius: 13,
                      background: focused ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(8px)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <IconMore color={focused ? '#FFFFFF' : 'rgba(255,255,255,0.55)'} size={14} />
                    </div>
                    <div style={{
                      position: 'absolute', left: 14, right: 14, bottom: 11,
                      display: 'flex', flexDirection: 'column', gap: 3,
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Icon color={item.accentColor} size={12} />
                        <span style={{
                          fontSize: 12, fontWeight: 700, letterSpacing: '-0.01em',
                          color: '#FFFFFF', lineHeight: 1.3,
                          overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', flex: 1,
                        }}>
                          {item.title}
                        </span>
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 400, color: 'rgba(255,255,255,0.4)', paddingLeft: 18 }}>
                        {item.lastOpened}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Action menu — Resume / Archive ──────────────────────────────────── */}
      {menuOpen && focusedItem && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 20,
          background: 'rgba(3,2,8,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: 420, borderRadius: 24,
            background: 'rgba(20,17,34,0.96)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
            padding: '28px 26px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                <img
                  src={focusedItem.thumbnail} alt=""
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#F5F3F7', letterSpacing: '-0.01em' }}>
                  {focusedItem.title}
                </div>
                <div style={{ fontSize: 12, fontWeight: 400, color: 'rgba(245,243,247,0.45)', marginTop: 2 }}>
                  {focusedItem.category} · {focusedItem.lastOpened}
                </div>
              </div>
            </div>

            {MENU_ACTIONS.map((label, i) => {
              const selected = menuSelected === i;
              const Icon = i === 0 ? IconPlay : IconArchive;
              return (
                <div
                  key={label}
                  onClick={() => {
                    if (i === 0) onStartConversation?.(focusedItem.title);
                    else setArchivedIds(prev => new Set(prev).add(focusedItem.id));
                    setMenuOpen(false);
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '13px 14px', borderRadius: 14,
                    background: selected ? 'rgba(255,255,255,0.10)' : 'transparent',
                    border: selected ? '1.5px solid rgba(255,255,255,0.5)' : '1.5px solid transparent',
                    marginBottom: i === 0 ? 8 : 0,
                    cursor: 'pointer',
                    transition: 'all 0.16s ease',
                  }}
                >
                  <Icon color={selected ? '#F5F3F7' : 'rgba(245,243,247,0.6)'} size={16} />
                  <span style={{
                    fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                    color: selected ? '#F5F3F7' : 'rgba(245,243,247,0.6)',
                  }}>
                    {label}
                  </span>
                </div>
              );
            })}

            <div style={{
              marginTop: 20, fontSize: 11, fontWeight: 500, color: 'rgba(245,243,247,0.3)',
              textAlign: 'center', letterSpacing: '0.02em',
            }}>
              ↑↓ to choose · Enter to select · Back to cancel
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
