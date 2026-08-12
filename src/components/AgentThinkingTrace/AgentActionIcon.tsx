import type { AgentActionType } from '../../types/experiencePass';

/** Small, single-tone icon set for AgentActionType — reinforces "the agent
 *  switched capabilities" next to the narration line, not a developer trace
 *  visualization. Deliberately plain line icons (stroke=currentColor)
 *  matching the app's existing icon language (see DotsIcon/HeartIcon in
 *  TravelL1.tsx) rather than emoji. */
export default function AgentActionIcon({ type, size = 18 }: { type: AgentActionType; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 18 18',
    fill: 'none' as const,
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  switch (type) {
    case 'search':
      return (
        <svg {...common} aria-hidden>
          <circle cx="7.5" cy="7.5" r="5" />
          <line x1="11.3" y1="11.3" x2="16" y2="16" />
        </svg>
      );

    case 'maps':
      return (
        <svg {...common} aria-hidden>
          <path d="M9 16s6-5.5 6-9.5A6 6 0 1 0 3 6.5C3 10.5 9 16 9 16Z" />
          <circle cx="9" cy="6.5" r="2" />
        </svg>
      );

    case 'retrieve':
      return (
        <svg {...common} aria-hidden>
          <rect x="3" y="3.5" width="12" height="3" rx="1" />
          <rect x="3" y="8" width="12" height="3" rx="1" />
          <rect x="3" y="12.5" width="8" height="3" rx="1" />
        </svg>
      );

    case 'compare':
      return (
        <svg {...common} aria-hidden>
          <circle cx="6.5" cy="9" r="4.5" />
          <circle cx="11.5" cy="9" r="4.5" />
        </svg>
      );

    case 'filter':
      return (
        <svg {...common} aria-hidden>
          <path d="M2.5 3h13l-4.8 5.6v5.1L9.3 15.5V8.6L2.5 3Z" />
        </svg>
      );

    case 'rank':
      return (
        <svg {...common} aria-hidden>
          <line x1="4" y1="15" x2="4" y2="9.5" />
          <line x1="9" y1="15" x2="9" y2="5.5" />
          <line x1="14" y1="15" x2="14" y2="2.5" />
        </svg>
      );

    case 'synthesize':
      return (
        <svg width={size} height={size} viewBox="0 0 18 18" fill="currentColor" aria-hidden>
          <path d="M9 1.5L10.6 6.9L16 8.5L10.6 10.1L9 15.5L7.4 10.1L2 8.5L7.4 6.9L9 1.5Z" />
        </svg>
      );

    case 'resolve':
      return (
        <svg {...common} aria-hidden>
          <path d="M3.5 9.5L7 13L14.5 4.5" />
        </svg>
      );
  }
}
