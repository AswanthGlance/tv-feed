export type DeepCard = { h: string; b: string };
export type DeepContent = { kicker: string; lede: string; cards: DeepCard[] };

// Hand-authored overrides for specific titles
const OVERRIDES: Record<string, DeepContent> = {
  'A Table Set for Friends': {
    kicker: 'RECIPE',
    lede: 'A North Indian spread built for a slow, shared evening — serves four.',
    cards: [
      { h: 'The menu', b: 'Dal makhani, paneer butter masala, blistered garlic naan, and a bright herbed bruschetta to start.' },
      { h: 'Dal makhani', b: 'Soak black urad overnight, then simmer it low for two hours with tomato and ginger. Finish with butter and a swirl of cream.' },
      { h: 'Paneer butter masala', b: 'Blend a smooth tomato-cashew gravy, season with kasuri methi and a pinch of sugar, then fold in fresh paneer.' },
      { h: 'Bring it together', b: 'Start the dal first and the naan last. Carry everything to the table at once and let the night unfold slowly.' },
    ],
  },
  'A Seat at the Ramen Counter': {
    kicker: 'RECIPE',
    lede: 'A bowl of tonkotsu-style ramen you can build across a slow weekend.',
    cards: [
      { h: 'The broth', b: 'Simmer pork bones for a deep, milky stock. The longer and gentler it goes, the silkier it gets.' },
      { h: 'The base', b: 'A salty-savoury blend of soy and mirin, finished with a spoon of aromatic garlic oil.' },
      { h: 'The toppings', b: 'Chashu pork, a jammy soft-boiled egg, spring onion, nori and a tangle of fresh noodles.' },
      { h: 'Assemble fast', b: 'Base first, then hot broth, then noodles and toppings. Eat right away, while the steam still rises.' },
    ],
  },
  'Rooftops at Blue Hour': {
    kicker: 'PLACE GUIDE',
    lede: 'Jaipur, the Pink City — best seen as the light turns blue.',
    cards: [
      { h: 'Why go', b: 'Honey-coloured palaces, busy bazaars and rooftop cafes that glow over the old city at dusk.' },
      { h: 'Best time', b: 'November to February for cool, clear evenings. Climb to the rooftop about an hour before sunset.' },
      { h: 'What to do', b: 'Amber Fort by day, the City Palace and Hawa Mahal, then block-print textiles at Bapu Bazaar.' },
      { h: 'Picture yourself here', b: 'Add a selfie and Glance can place you on this rooftop — a postcard from a trip you have not taken yet.' },
    ],
  },
};

// Per-category fallback templates
const TEMPLATES: Record<string, (title: string) => DeepContent> = {
  food: (_title) => ({
    kicker: 'RECIPE',
    lede: 'A simple cook-along, start to finish.',
    cards: [
      { h: 'What to gather', b: 'A short, forgiving ingredient list — a few pantry staples and something fresh.' },
      { h: 'Make it', b: 'Build the base low and slow, layer the aromatics, and taste as you go.' },
      { h: 'Serve it well', b: 'Plate it warm, add a final flourish, and keep something light alongside.' },
    ],
  }),
  travel: (title) => ({
    kicker: 'PLACE GUIDE',
    lede: `A closer look at ${title}.`,
    cards: [
      { h: 'Why go', b: 'A place worth slowing down for — scenery, atmosphere and a pace all its own.' },
      { h: 'Best time to visit', b: 'Aim for the shoulder season for soft light, fewer crowds and kinder weather.' },
      { h: 'What to do', b: 'Wander first, eat local, and leave room for the views to surprise you.' },
      { h: 'Picture yourself here', b: 'Add a selfie and Glance can quietly place you in this scene.' },
    ],
  }),
  luxury: () => ({
    kicker: 'ESCAPE GUIDE',
    lede: 'Picture yourself here.',
    cards: [
      { h: 'The experience', b: 'Space, quiet and a view that does most of the work.' },
      { h: 'When to go', b: 'Off-peak evenings feel the most private and the most golden.' },
      { h: 'Plan it', b: 'Save it to your wishlist and Glance can help you map the trip later.' },
    ],
  }),
  fashion: () => ({
    kicker: 'STYLE EDIT',
    lede: 'How to wear it, and where to start.',
    cards: [
      { h: 'The look', b: 'A confident, easy silhouette that works far beyond one occasion.' },
      { h: 'Make it yours', b: 'Swap a colour or a texture to match what already lives in your wardrobe.' },
      { h: 'Shop the pieces', b: 'A few well-chosen staples go further than a cart full of trends.' },
    ],
  }),
  wellness: () => ({
    kicker: 'ROUTINE',
    lede: 'A few quiet minutes for yourself.',
    cards: [
      { h: 'Set up', b: 'Find a calm corner, loosen up, and let your breath settle first.' },
      { h: 'The flow', b: 'Move gently through it — slow is strong, and form beats speed.' },
      { h: 'Wind down', b: 'Close with a long exhale and a moment of stillness.' },
    ],
  }),
  beauty: () => ({
    kicker: 'RITUAL',
    lede: 'A calm, repeatable routine.',
    cards: [
      { h: 'Prep', b: 'Start clean and patient — good skin is mostly consistency.' },
      { h: 'The steps', b: 'Layer light to rich, giving each step a moment to settle.' },
      { h: 'Finish and protect', b: 'Lock it in, and never skip protection by day.' },
    ],
  }),
  home: () => ({
    kicker: 'HOME EDIT',
    lede: 'Recreate this feeling at home.',
    cards: [
      { h: 'The mood', b: 'Warm light, natural texture and a little space to breathe.' },
      { h: 'Key pieces', b: 'One grounding anchor, a soft layer, and something living and green.' },
      { h: 'Finishing touches', b: 'Edit gently — the calm comes from what you leave out.' },
    ],
  }),
  sports: () => ({
    kicker: 'THE MOMENT',
    lede: 'Catch up, then dive deeper.',
    cards: [
      { h: 'The story', b: 'The turning point, the tension, and what it meant for the night.' },
      { h: 'Watch', b: 'Replays and highlights, ready whenever you are.' },
      { h: 'Stay in the loop', b: 'Follow along and Glance will surface the next big moment.' },
    ],
  }),
  entertainment: () => ({
    kicker: 'THE SCENE',
    lede: 'More to watch and hear.',
    cards: [
      { h: 'The vibe', b: 'Lights, sound and a feeling you can lean right into.' },
      { h: 'Press play', b: 'A set, a mix or a moment — pick your tempo for the evening.' },
      { h: 'Discover more', b: 'Save it and Glance will line up something in the same key.' },
    ],
  }),
  hobbies: () => ({
    kicker: 'TRY IT',
    lede: 'A gentle place to begin.',
    cards: [
      { h: 'What you need', b: 'Less than you think — a small kit and a little curiosity.' },
      { h: 'First steps', b: 'Start tiny, expect a few wobbles, and enjoy the slow progress.' },
      { h: 'Go further', b: 'Once it clicks, Glance can point you to the next level up.' },
    ],
  }),
};

export function getDeepContent(title: string, category: string): DeepContent {
  if (OVERRIDES[title]) return OVERRIDES[title];
  const tmpl = TEMPLATES[category];
  if (tmpl) return tmpl(title);
  // Fallback
  return {
    kicker: 'EXPLORE',
    lede: `A closer look at ${title}.`,
    cards: [
      { h: 'What this is', b: 'A moment worth sitting with a little longer.' },
      { h: 'Go deeper', b: 'Glance can surface more like this as your feed learns your taste.' },
    ],
  };
}
