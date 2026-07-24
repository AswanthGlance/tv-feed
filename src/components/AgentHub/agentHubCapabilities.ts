/**
 * agentHubCapabilities — the capability row shown at the top of both
 * NewConversationScreen (FTUX) and ReturningUserScreen. Shared so the two
 * homepage variants can never drift apart on this section — per design,
 * the row is identical regardless of whether the user is new or returning.
 */

import {
  type IconComponent,
  IconHanger, IconAirplane, IconChefHat, IconGlobe, IconLotus, IconHouse,
} from './agentHubIcons';
import type { CapabilityLandingId } from '../L1/capabilityLandingStates';

export type Capability = {
  id: string;
  label: string;
  subtitle: string;
  icon: IconComponent;
  accentColor: string;
  placeholder: string;
  /** Which /l1-category/:id state Enter/click on this card opens. */
  landingId: CapabilityLandingId;
};

export const CAPABILITIES: Capability[] = [
  { id: 'fashion',  label: 'Fashion',    subtitle: 'Shop, style & discover looks',        icon: IconHanger,   accentColor: '#A78BFA', placeholder: 'What are you shopping for?',              landingId: 'fashion' },
  { id: 'travel',   label: 'Travel',     subtitle: 'Plan trips, stays & experiences',     icon: IconAirplane, accentColor: '#60A5FA', placeholder: 'Where would you like to go?',              landingId: 'travel' },
  { id: 'food',     label: 'Recipe',     subtitle: 'Cook, order & discover recipes',      icon: IconChefHat,  accentColor: '#FF9800', placeholder: 'What would you like to cook?',              landingId: 'food' },
  { id: 'sports',   label: 'Sports',     subtitle: 'Matches, tickets & highlights',       icon: IconGlobe,    accentColor: '#4CAF50', placeholder: 'What game are you interested in?',          landingId: 'sports' },
  { id: 'wellness', label: 'Wellness',   subtitle: 'Fitness, nutrition & healthy habits', icon: IconLotus,    accentColor: '#F06292', placeholder: "What's your wellness goal?",                landingId: 'wellness' },
  { id: 'home',     label: 'Home Decor', subtitle: 'Decor, inspiration & organization',  icon: IconHouse,    accentColor: '#2DD4BF', placeholder: 'What room would you like to redesign?',     landingId: 'homeDecor' },
];
