/**
 * agentHubIcons — shared icon set + left-nav rail data for the Agent Hub
 * screens (NewConversationScreen, ReturningUserScreen, ConversationLibraryScreen).
 * Hand-written inline SVGs (no icon library in this project).
 */

export type IconProps = { color: string; size?: number };
export type IconComponent = (props: IconProps) => React.ReactElement;

export function IconHanger({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4.2" r="1.5" />
      <path d="M12 5.7v1.8" />
      <path d="M12 7.5 2.6 15a2 2 0 0 0 .95 3.6h16.9a2 2 0 0 0 .95-3.6L12 7.5Z" />
      <path d="M4.5 17h15" strokeWidth="1.3" />
    </svg>
  );
}

export function IconAirplane({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.5 2.5 10.6 13.4" />
      <path d="M21.5 2.5 14.8 21.5l-4-8.6-8.6-4L21.5 2.5Z" />
    </svg>
  );
}

export function IconChefHat({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.2 14.2A4 4 0 0 1 5 6.5a3.1 3.1 0 0 1 3.1-2.8A3.1 3.1 0 0 1 12 2a3.1 3.1 0 0 1 3.9 1.7 3.1 3.1 0 0 1 3.1 2.8 4 4 0 0 1-1.2 7.7H6.2Z" />
      <path d="M7 14v6.2h10V14" />
      <path d="M7 17.6h10" strokeWidth="1.3" />
    </svg>
  );
}

export function IconGlobe({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18" />
      <path d="M12 3c2.4 2.5 3.6 6 3.6 9s-1.2 6.5-3.6 9c-2.4-2.5-3.6-6-3.6-9S9.6 5.5 12 3Z" />
    </svg>
  );
}

export function IconLotus({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c0 4.2-2 6.2-2 9.2a2 2 0 0 0 4 0c0-3-2-5-2-9.2Z" />
      <path d="M12 12.2c-3-1-5.6-3-6.6-6.7C8.7 6 10.8 8 12 11" />
      <path d="M12 12.2c3-1 5.6-3 6.6-6.7C15.3 6 13.2 8 12 11" />
      <path d="M12 12.2c-4.2 0-7.4 2.1-8.4 5.2 3.2 1.6 6.9 1 8.4-2.1 1.5 3.1 5.2 3.7 8.4 2.1-1-3.1-4.2-5.2-8.4-5.2Z" />
      <path d="M12 21v-8.8" />
    </svg>
  );
}

export function IconHouse({ color, size = 22 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11.2 12 4l8 7.2" />
      <path d="M6 9.8V19a1 1 0 0 0 1 1h3v-5h4v5h3a1 1 0 0 0 1-1V9.8" />
    </svg>
  );
}

export function IconArrowRight({ size = 14, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

// Three-dot "More" affordance used on Conversation Library cards.
export function IconMore({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <circle cx="5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="19" cy="12" r="1.8" />
    </svg>
  );
}

export function IconArchive({ color, size = 18 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="4" rx="1.2" />
      <path d="M5 8v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8" />
      <path d="M10 13h4" />
    </svg>
  );
}

export function IconPlay({ color, size = 16 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M7 5v14l12-7L7 5Z" />
    </svg>
  );
}

// ─── Left icon nav rail ──────────────────────────────────────────────────────

export const ICON_DIR = '/images/nc-figma-icons';

export type NavItem = { id: string; icon: string; active?: boolean };

export const NAV_ITEMS: NavItem[] = [
  { id: 'fashion',  icon: `${ICON_DIR}/nav-hanger-flat.svg` },
  { id: 'mascot',   icon: `${ICON_DIR}/nav-mascot-flat.svg`, active: true },
  { id: 'house',    icon: `${ICON_DIR}/nav-house-flat.svg` },
  { id: 'heart',    icon: `${ICON_DIR}/nav-heart-flat.svg` },
  { id: 'settings', icon: `${ICON_DIR}/nav-settings-flat.svg` },
];
