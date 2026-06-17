/**
 * coldProfile1Data.ts — 1-signal + reasoning + CTA for cold_profile_1.
 *
 * Source: Glance_TV_Warm_Start_Profiles_v6.docx — Cold Start table (Table 0).
 * Images: cs-* cold-start image set.
 *
 * Signal rule: one strongest world/contextual signal per card (single sentence).
 * Reasoning rule: max 160 characters, no dash separators, no manual line breaks.
 * CTA: verbatim from Cold Start column in document.
 */

import type { WarmCardCrisperEntry } from './warmCardCrisperData';

export const COLD_PROFILE_1_DATA: Record<string, WarmCardCrisperEntry> = {

  // Card 1 — Home · Morning
  'cs-balcony-escape': {
    signal:       "Lalbagh's flower show is 8 weeks out and that's when nursery prices climb.",
    signalHls:    ["Lalbagh's flower show", 'nursery prices climb'],
    reasoning:    "I'll pull a starter set from the pre-show sales: five monsoon plants plus warm fairy lights, all under ₹3,500. Get there before 10.",
    reasoningHls: ['five monsoon plants', '₹3,500'],
    cta:          'Pull up a starter set?',
  },

  // Card 2 — Culture · Workshops
  'cs-gond-art': {
    signal:       "Bhajju Shyam's retrospective just opened at BIC, the most-visited art space in the city this month.",
    signalHls:    ["Bhajju Shyam's retrospective", 'BIC'],
    reasoning:    "Three studios near you added Saturday Gond drop-ins for beginners at ₹1,800, materials included. I'd book the 10am slot.",
    reasoningHls: ['Saturday Gond drop-ins', '10am slot'],
    cta:          'Book a Saturday seat?',
  },

  // Card 3 — Fashion · Festive
  'cs-gold-stack': {
    signal:       "Gold dropped to ₹71,400 per 10g this week, softest since March, and jewellers say it climbs before Onam.",
    signalHls:    ['₹71,400 per 10g', 'softest since March'],
    reasoning:    "Tanishq Mia, CaratLane, and Kalyan Muhurat all dropped layered capsules this fortnight. I'll shortlist a chain, cuff and two-ring stack under 8g.",
    reasoningHls: ['Tanishq Mia', 'CaratLane'],
    cta:          'Shortlist a few pieces for you?',
  },

  // Card 4 — Sports · Live
  'cs-monsoon-football': {
    signal:       "70% rain forecast for Bangalore tomorrow and turf bookings across Koramangala are already spiking.",
    signalHls:    ['70% rain forecast', 'turf bookings'],
    reasoning:    "Bangalore has 60-plus artificial turfs running through monsoon. The 6 to 8am block is cheapest and I'll find the closest open slot before the rush.",
    reasoningHls: ['60-plus artificial turfs', '6 to 8am block'],
    cta:          'Hold a 6:30 slot nearby?',
  },

  // Card 5 — Food · Recipe
  'cs-mysore-bonda': {
    signal:       "Mysore bonda is the most-saved breakfast card on Glance from Bangalore this monsoon.",
    signalHls:    ['most-saved breakfast card'],
    reasoning:    "Five ingredients, one pan, 25 minutes start to plate. The curd-rest does the work: 90 minutes of fermentation gives you the soft inside.",
    reasoningHls: ['five ingredients', '90 minutes of fermentation'],
    cta:          'Send the recipe to your phone?',
  },

  // Card 6 — Travel · Day trip
  'cs-shivanasamudra': {
    signal:       "KRS dam released 14,200 cusecs into the Cauvery yesterday and Shivanasamudra is at its loudest in three monsoons.",
    signalHls:    ['14,200 cusecs', 'loudest in three monsoons'],
    reasoning:    "It's a 3-hour drive from Bangalore via Kanakapura Road. Leave by 6 and you're back before the evening downpour. I'll add a Talakadu lunch stop.",
    reasoningHls: ['3-hour drive', 'Talakadu lunch stop'],
    cta:          'Plan the day-trip for you?',
  },

  // Card 7 — Heritage · Photo walk
  'cs-vidhana-soudha': {
    signal:       "Overnight rain left Vidhana Soudha's plinth as a black mirror and sunrise tomorrow is at 5:48.",
    signalHls:    ['black mirror', 'sunrise tomorrow is at 5:48'],
    reasoning:    "You've got 30 minutes between sunrise and the first traffic wave. That's your window. I'll map the route from Sheshadri Road.",
    reasoningHls: ['30 minutes', 'Sheshadri Road'],
    cta:          'Map the sunrise route?',
  },

  // Card 8 — Restaurants · Heritage
  'cs-sunnys': {
    signal:       "Sunny's on Lavelle Road has run the same menu since 1990 and still books a week ahead every weekend.",
    signalHls:    ["Sunny's on Lavelle Road", 'same menu since 1990'],
    reasoning:    "Weekends are fully booked so Tuesday and Wednesday are your window. I'd put you on the 9am sitting, the quietest hour before the brunch crowd.",
    reasoningHls: ['Tuesday and Wednesday', '9am sitting'],
    cta:          'Want me to hold a table for tomorrow?',
  },

  // Card 9 — Coffee · Technique
  'cs-pour-over': {
    signal:       "Pour-over is the most-asked home-brewing technique on Glance from Bangalore this monsoon.",
    signalHls:    ['most-asked home-brewing technique'],
    reasoning:    "Three variables decide your cup: 92-94 degree water, medium-coarse grind, 2:1 bloom-pour. Subko's runs a 45-minute walkthrough on Saturday mornings.",
    reasoningHls: ["Subko's", '45-minute walkthrough'],
    cta:          'Book the 9am Saturday?',
  },

  // Card 10 — Pet-friendly · Cafe
  'cs-therpup': {
    signal:       "TherPUP in Whitefield is the most-bookmarked pet cafe on Glance from Bangalore.",
    signalHls:    ['TherPUP in Whitefield', 'most-bookmarked pet cafe'],
    reasoning:    "TherPUP runs ₹500-an-hour visits with eight resident dogs. The 10am slot averages 4 guests, the loosest just after their morning walk.",
    reasoningHls: ['₹500-an-hour', '10am slot averages 4 guests'],
    cta:          'Hold a morning slot for you?',
  },

  // Card 11 — Wellness · Routine
  'cs-vinyasa-cubbon': {
    signal:       "Cubbon's AQI dropped to 22 at 6:30am after overnight rain, the cleanest hour the city gets all day.",
    signalHls:    ['AQI dropped to 22', 'cleanest hour'],
    reasoning:    "The Bandstand lawn stays quiet until 8 before the joggers fill up. A 20-minute Vinyasa flow is the simplest format for an outdoor mat.",
    reasoningHls: ['Bandstand lawn', '20-minute Vinyasa flow'],
    cta:          'Cue up the 20-minute flow?',
  },

};
