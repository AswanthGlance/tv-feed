/**
 * agentHubData — Option 3 Agent Hub content model.
 *
 * Per-card data: every content card owns its own contextual prompts, agent
 * message and metadata. Imagery is UNIQUE within each topic (content cards and
 * Explore grid never repeat an image side-by-side) — real L0 feed assets are
 * used where they fit, high-quality Unsplash images fill the rest.
 */

const IMG = '/images/feed/';
const WS = '/images/warm-start/';
// Unsplash helper — stable photo ids, sized for TV, unique sig per use
const U = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;

export type Prompt = { label: string; outcome?: string };
export type ContentCard = {
  id: string; title: string; sub: string; image: string; isCurrentL0?: boolean;
  message: string; note: string; prompts: Prompt[];
};
export type ExploreCat = { label: string; cue: string; image: string };
// Recent Activity = real chat threads / ongoing work
export type RecentItem = {
  kind: string;            // "Conversation" | "Saved Trip" | "Meal Plan" | ...
  title: string;           // actual thread title the user would recognise
  context?: string;        // short context line (e.g. "18 messages")
  time: string;            // "Yesterday" | "Friday" | ...
  action: 'Continue' | 'Open';
};
export type Topic = {
  id: string; label: string; icon: string; tint: string; agentName: string;
  currentLabel: string;
  cards: ContentCard[];
  explore: ExploreCat[];
  recent: RecentItem[];
};

// ─── Travel ──────────────────────────────────────────────────────────────────

const travel: Topic = {
  id: 'travel', label: 'Travel', icon: '✈', tint: '#4DB6AC', agentName: 'Travel Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 't-coorg', title: 'Coorg', sub: 'Coffee estates · 4 hrs from Bangalore', image: `${WS}coorg.jpg`, isCurrentL0: true,
      message: 'I can help you plan Coorg.', note: 'Weekend escape · monsoon season',
      prompts: [ { label: 'Build a two-day Coorg itinerary.' }, { label: 'Find stays near coffee estates.' }, { label: 'Plan this for the monsoon.' }, { label: 'Suggest local food experiences.' } ] },
    { id: 't-wayanad', title: 'Wayanad', sub: 'Forest stays · wildlife', image: `${IMG}feed_54-travel-kerala-backwaters-houseboat.jpg`,
      message: 'I can help you plan Wayanad.', note: 'Nature retreat · 6 hrs away',
      prompts: [ { label: 'Find treehouse and forest stays.' }, { label: 'Plan a wildlife safari morning.' }, { label: 'Build a 3-day nature itinerary.' }, { label: 'What should I pack for the forest?' } ] },
    { id: 't-pondi', title: 'Pondicherry', sub: 'French quarter · cafés', image: `${IMG}feed_58-travel-mumbai-marine-drive-night.jpg`,
      message: 'I can help you plan Pondicherry.', note: 'Coastal town · 6 hrs away',
      prompts: [ { label: 'Plan a French Quarter walking route.' }, { label: 'Suggest cafes near the beach.' }, { label: 'Create a relaxed weekend itinerary.' }, { label: 'Plan this without renting a car.' } ] },
    { id: 't-munnar', title: 'Munnar', sub: 'Tea gardens · valley views', image: `${IMG}feed_40-travel-wildlife-dawn-grassland.jpg`,
      message: 'I can help you plan Munnar.', note: 'Hill station · tea country',
      prompts: [ { label: 'Find the best tea-estate experiences.' }, { label: 'Build a scenic driving route.' }, { label: 'Suggest stays with valley views.' }, { label: 'What should I pack for the weather?' } ] },
    { id: 't-gokarna', title: 'Gokarna', sub: 'Hidden beaches · quieter than Goa', image: `${IMG}feed_29-travel-goa-coastal-road.jpg`,
      message: 'I can help you plan Gokarna.', note: 'Beach town · laid-back',
      prompts: [ { label: 'Find the quietest beaches.' }, { label: 'Plan a sunrise beach trek.' }, { label: 'Suggest budget beach shacks.' }, { label: 'Best time to avoid the crowds?' } ] },
    { id: 't-ooty', title: 'Ooty', sub: 'Scenic train · cool climate', image: `${IMG}feed_34-travel-nordic-winter-cabin.jpg`,
      message: 'I can help you plan Ooty.', note: 'Hill station · toy train',
      prompts: [ { label: 'Book the scenic mountain train.' }, { label: 'Plan a two-day drive from Bangalore.' }, { label: 'Find stays with garden views.' }, { label: 'Suggest a family-friendly route.' } ] },
  ],
  explore: [
    { label: 'Weekend Escapes', cue: 'Close-by getaways', image: U('photo-1533105079780-92b9be482077') },
    { label: 'Road Trips', cue: 'Scenic drives', image: U('photo-1469854523086-cc02fe5d8800') },
    { label: 'Hidden Gems', cue: 'Off the beaten path', image: U('photo-1470071459604-3b5ec3a7fe05') },
    { label: 'Beach', cue: 'Sand and sea', image: U('photo-1507525428034-b723cf961d3e') },
    { label: 'Mountains', cue: 'Cool and high', image: U('photo-1464822759023-fed622ff2c3b') },
    { label: 'International', cue: 'Further afield', image: U('photo-1502602898657-3e91760cbb34') },
    { label: 'Food Travel', cue: 'Eat your way through', image: U('photo-1414235077428-338989a2e8c0') },
    { label: 'Cultural Trips', cue: 'History and heritage', image: U('photo-1524492412937-b28074a5d7da') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Can you plan a 3-day Coorg trip under ₹20k?', context: '18 messages', time: 'Yesterday', action: 'Continue' },
    { kind: 'Conversation', title: 'Is Munnar better than Wayanad during monsoon?', time: 'Friday', action: 'Continue' },
    { kind: 'Saved Trip', title: 'Pondicherry Anniversary Weekend', context: '3 places saved', time: 'Last week', action: 'Open' },
  ],
};

// ─── Recipes ─────────────────────────────────────────────────────────────────

const recipes: Topic = {
  id: 'recipes', label: 'Recipes', icon: '🍽', tint: '#FF9800', agentName: 'Recipe Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'r-pizza', title: 'Butter Garlic Naan Pizza', sub: '25 min · Beginner · Vegetarian', image: `${IMG}feed_04-food-dinner-party-table.jpg`, isCurrentL0: true,
      message: 'I can help you with Butter Garlic Naan Pizza.', note: '6 ingredients · 25 min · serves 2',
      prompts: [ { label: 'Can you make this lighter without losing the garlic flavor?' }, { label: 'What dip would go best with this?' }, { label: 'Help me cook this with a regular pan.' }, { label: 'Scale this for six people.' } ] },
    { id: 'r-ramen', title: 'Ramen Bowl', sub: 'Warm & quick · 20 min', image: `${IMG}feed_42-food-japanese-ramen-counter.jpg`,
      message: 'I can help you with the Ramen Bowl.', note: 'Broth-based · 20 min · serves 1',
      prompts: [ { label: 'How can I make the broth richer?' }, { label: 'Turn this into a spicy miso ramen.' }, { label: 'Suggest toppings using what I have.' }, { label: 'Make this a 15-minute version.' } ] },
    { id: 'r-paneer', title: 'Paneer Tikka Wrap', sub: 'High protein · 15 min · Vegetarian', image: `${IMG}feed_59-food-healthy-bowl-kitchen.jpg`,
      message: 'I can help you with the Paneer Tikka Wrap.', note: 'High protein · 15 min · serves 2',
      prompts: [ { label: 'Make this higher in protein.' }, { label: 'Suggest a healthier wrap.' }, { label: 'Turn this into a lunch-box meal.' }, { label: 'Give me an air-fryer paneer method.' } ] },
    { id: 'r-pasta', title: 'One-Pot Pasta', sub: 'Minimal cleanup · 30 min', image: `${IMG}eatly-dawn.jpg`,
      message: 'I can help you with the One-Pot Pasta.', note: 'One pot · 30 min · serves 3',
      prompts: [ { label: 'Make this creamier without using cream.' }, { label: 'Add vegetables that work well here.' }, { label: 'Turn this into a meal-prep recipe.' }, { label: 'What cheese should I use?' } ] },
    { id: 'r-biryani', title: 'Chicken Biryani', sub: 'Weekend project · Non-veg', image: `${IMG}feed_47-food-monsoon-chai-stall.jpg`,
      message: 'I can help you with the Chicken Biryani.', note: 'Layered · 75 min · serves 4',
      prompts: [ { label: 'Create a vegetarian version.' }, { label: 'Make this less spicy.' }, { label: 'Explain the layering process.' }, { label: 'Suggest a raita and side dish.' } ] },
    { id: 'r-soup', title: 'Tomato Soup', sub: 'Cosy for the rain · 25 min · Vegetarian', image: `${IMG}feed_09-home-kitchen-morning.jpg`,
      message: 'I can help you with the Tomato Soup.', note: 'Comfort · 25 min · serves 2',
      prompts: [ { label: 'Make this restaurant-style.' }, { label: 'Turn this into a high-protein soup.' }, { label: 'What bread pairs well with this?' }, { label: 'Can I roast the tomatoes first?' } ] },
  ],
  explore: [
    { label: 'Dinner Tonight', cue: 'Ready in under 40 min', image: U('photo-1467003909585-2f8a72700288') },
    { label: 'Quick Meals', cue: '15–20 minute recipes', image: U('photo-1569718212165-3a8278d5f624') },
    { label: 'Breakfast', cue: 'Start the day right', image: U('photo-1533089860892-a7c6f0a88666') },
    { label: 'Healthy', cue: 'Lighter everyday meals', image: U('photo-1512621776951-a57141f2eefd') },
    { label: 'Desserts', cue: 'Sweet finishes', image: U('photo-1488477181946-6428a0291777') },
    { label: 'Italian', cue: 'Pasta, pizza & more', image: U('photo-1513104890138-7c749659a591') },
    { label: 'Indian', cue: 'Regional favorites', image: U('photo-1585937421612-70a008356fbe') },
    { label: 'High Protein', cue: 'Fuel your training', image: U('photo-1546069901-ba9599a7e63c') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Can I air-fry Paneer Tikka Wrap?', time: 'Yesterday', action: 'Continue' },
    { kind: 'Conversation', title: 'I only have tomatoes and cheese. What can I cook?', time: 'Monday', action: 'Continue' },
    { kind: 'Meal Plan', title: 'High Protein Weekday Meals', context: '5 recipes', time: 'In progress', action: 'Continue' },
  ],
};

// ─── Shopping ────────────────────────────────────────────────────────────────

const shopping: Topic = {
  id: 'shopping', label: 'Shopping', icon: '🛍', tint: '#4FC3F7', agentName: 'Shopping Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 's-headphones', title: 'Sony WH-1000XM5', sub: '↓ ₹8,000 · ₹24,990', image: U('photo-1505740420928-5e560c06d30e'), isCurrentL0: true,
      message: 'I can help you with the Sony WH-1000XM5.', note: 'Price dropped ₹8,000 · lowest in 30 days',
      prompts: [ { label: 'Compare this with Bose QC Ultra.' }, { label: 'Is this good for long flights?' }, { label: 'Track the price.' }, { label: 'Find a lighter option.' } ] },
    { id: 's-coffee', title: 'Coffee Machine', sub: 'Espresso + pod · top rated', image: U('photo-1517668808822-9ebb02f2a0e6'),
      message: 'I can help you with the Coffee Machine.', note: 'Matches your morning ritual',
      prompts: [ { label: 'Compare pod and espresso machines.' }, { label: 'Will this fit a small kitchen?' }, { label: 'Estimate the monthly coffee cost.' }, { label: 'Suggest beans for this machine.' } ] },
    { id: 's-shoes', title: 'Running Shoes', sub: 'For your triathlon block', image: U('photo-1542291026-7eec264c27ff'),
      message: 'I can help you with the Running Shoes.', note: 'Cushioned · road & trail',
      prompts: [ { label: 'Is this suitable for daily runs?' }, { label: 'Find a wider-fit alternative.' }, { label: 'Compare cushioning.' }, { label: 'Recommend based on my running surface.' } ] },
    { id: 's-backpack', title: 'Travel Backpack', sub: 'Cabin size · for Coorg', image: U('photo-1553062407-98eeb64c6a62'),
      message: 'I can help you with the Travel Backpack.', note: 'Carry-on · weatherproof',
      prompts: [ { label: 'Is this cabin-size compliant?' }, { label: 'Find a waterproof alternative.' }, { label: 'Compare capacity options.' }, { label: 'Best value under ₹5,000?' } ] },
    { id: 's-tv', title: 'OLED TV', sub: '↓ 12% this week', image: U('photo-1593359677879-a4bb92f829d1'),
      message: 'I can help you with the OLED TV.', note: 'Price watch active · ↓ 12%',
      prompts: [ { label: 'Compare OLED vs QLED.' }, { label: 'Will this fit my living room?' }, { label: 'Is this good for sports?' }, { label: 'Track the price further.' } ] },
    { id: 's-lamp', title: 'Table Lamp', sub: 'Warm reading light', image: U('photo-1507473885765-e6ed057f782c'),
      message: 'I can help you with the Table Lamp.', note: 'Warm glow · under ₹2,000',
      prompts: [ { label: 'Find a warmer bulb temperature.' }, { label: 'Suggest a dimmable version.' }, { label: 'Match this to my living room.' }, { label: 'Find a cheaper alternative.' } ] },
  ],
  explore: [
    { label: 'Electronics', cue: 'Tech and gadgets', image: U('photo-1498049794561-7780e7231661') },
    { label: 'Kitchen', cue: 'Cook and brew', image: U('photo-1556911220-bff31c812dba') },
    { label: 'Home', cue: 'For your space', image: U('photo-1524758631624-e2822e304c36') },
    { label: 'Fashion', cue: 'Wardrobe picks', image: U('photo-1441984904996-e0b6ba687e04') },
    { label: 'Gaming', cue: 'Play more', image: U('photo-1550745165-9bc0b252726f') },
    { label: 'Beauty', cue: 'Grooming & care', image: U('photo-1596462502278-27bfdc403348') },
    { label: 'Deals', cue: "Today's best offers", image: U('photo-1607083206869-4c7672e72a8a') },
    { label: 'Price Drops', cue: 'Recently reduced', image: U('photo-1607082348824-0a96f2a4b9da') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Compare Sony XM5 vs Bose QC Ultra', time: 'Yesterday', action: 'Continue' },
    { kind: 'Conversation', title: 'Find me a coffee machine below ₹25k', time: 'Friday', action: 'Continue' },
    { kind: 'Wishlist', title: 'Sony XM5', context: 'Price dropped ₹2,000', time: 'Today', action: 'Open' },
  ],
};

// ─── Entertainment ─────────────────────────────────────────────────────────

const entertainment: Topic = {
  id: 'entertainment', label: 'Entertainment', icon: '🎬', tint: '#C24DFF', agentName: 'Entertainment Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'e-continue', title: 'Continue Watching', sub: 'Mirzapur — S3 E5 · 38 min left', image: `${IMG}feed_60-entertainment-vinyl-music-room.jpg`, isCurrentL0: true,
      message: 'Want to pick Mirzapur back up?', note: 'Series · 38 min left in the episode',
      prompts: [ { label: 'Recap the previous episode.' }, { label: 'How much is left in the season?' }, { label: 'Find similar crime dramas.' }, { label: 'Continue watching.' } ] },
    { id: 'e-newrelease', title: 'New Release', sub: 'The Boys — S4 · 2 new episodes', image: `${IMG}feed_13-entertainment-classical-dance.jpg`,
      message: 'Curious about The Boys, Season 4?', note: 'Series · 2 new episodes this week',
      prompts: [ { label: 'Recap the story so far.' }, { label: 'Is this suitable for family viewing?' }, { label: 'Find similar shows.' }, { label: 'Add this to my watchlist.' } ] },
    { id: 'e-sport', title: 'Sports', sub: 'India vs Afghanistan · Live 7:30 PM', image: `${IMG}feed_25-sports-cricket-stadium-floodlights.jpg`,
      message: "Following tonight's India vs Afghanistan match?", note: 'Live · T20 · starts 7:30 PM',
      prompts: [ { label: 'Show the current score.' }, { label: 'Explain what changed in the match.' }, { label: 'Show key player stats.' }, { label: 'Remind me before the next game.' } ] },
    { id: 'e-podcast', title: 'Podcast', sub: 'Huberman Lab · Ep 142', image: U('photo-1478737270239-2f02b77fc618'),
      message: 'Want to play Huberman Lab, Episode 142?', note: 'Podcast · 1h 52m',
      prompts: [ { label: 'Summarize this episode.' }, { label: 'Play from where I left off.' }, { label: 'Find episodes on sleep.' }, { label: 'Add to my queue.' } ] },
    { id: 'e-movie', title: 'Movie', sub: 'A slow-burn thriller · 92% match', image: U('photo-1489599849927-2ee91cede3ba'),
      message: 'Thinking about a thriller tonight?', note: 'Movie · 92% match for you',
      prompts: [ { label: 'Explain the premise without spoilers.' }, { label: 'Find similar slow-burn thrillers.' }, { label: 'Is this suitable for family viewing?' }, { label: 'Show cast and ratings.' } ] },
    { id: 'e-music', title: 'Music', sub: 'Vinyl Evening Mix · indie', image: U('photo-1470225620780-dba8ba36b745'),
      message: 'Want to spin the Vinyl Evening Mix?', note: 'Playlist · indie + this week',
      prompts: [ { label: 'Play something calmer.' }, { label: 'Find similar artists.' }, { label: 'Make this a dinner playlist.' }, { label: 'Add this to my library.' } ] },
  ],
  explore: [
    { label: 'Movies', cue: 'Tonight’s picks', image: U('photo-1489599849927-2ee91cede3ba') },
    { label: 'Series', cue: 'Binge-worthy', image: U('photo-1522869635100-9f4c5e86aa37') },
    { label: 'Sports', cue: 'Live and upcoming', image: U('photo-1461896836934-ffe607ba8211') },
    { label: 'Music', cue: 'Sets and mixes', image: U('photo-1470225620780-dba8ba36b745') },
    { label: 'Podcasts', cue: 'Listen and learn', image: U('photo-1478737270239-2f02b77fc618') },
    { label: 'Continue Watching', cue: 'Pick up where you left', image: U('photo-1574375927938-d5a98e8ffe85') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Something light for movie night?', time: 'Sunday', action: 'Continue' },
    { kind: 'Continue Watching', title: 'Mirzapur S3 · Episode 5', context: '38 min left', time: 'Last night', action: 'Continue' },
    { kind: 'Saved Title', title: 'House of the Dragon S2', context: 'To watch', time: 'Yesterday', action: 'Open' },
  ],
};

// ─── Fashion ───────────────────────────────────────────────────────────────

const fashion: Topic = {
  id: 'fashion', label: 'Fashion', icon: '👗', tint: '#F48FB1', agentName: 'Fashion Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'f-weekend', title: 'Weekend Layers', sub: 'For cool, damp days', image: `${IMG}feed_46-fashion-luxury-flatlay.jpg`, isCurrentL0: true,
      message: 'I can help you style Weekend Layers.', note: 'Smart-casual · rain-ready',
      prompts: [ { label: 'Suggest a jacket for this look.' }, { label: 'Make this suitable for warmer weather.' }, { label: 'What shoes complete this outfit?' }, { label: 'Help me pack this for a weekend trip.' } ] },
    { id: 'f-occasion', title: 'Occasion Wear', sub: 'For the wedding', image: `${IMG}feed_18-beauty-haldi-ritual.jpg`,
      message: 'I can help you with Occasion Wear.', note: 'Formal · event-ready',
      prompts: [ { label: 'Make this appropriate for an evening event.' }, { label: 'Suggest jewellery and accessories.' }, { label: 'Give me a more understated version.' }, { label: 'Find a similar look at a lower budget.' } ] },
    { id: 'f-rain', title: 'Rain Ready', sub: 'Water-resistant picks', image: `${IMG}feed_31-fashion-streetwear-editorial.jpg`,
      message: 'I can help you with a Rain Ready look.', note: 'Monsoon · practical',
      prompts: [ { label: 'Make this waterproof without looking bulky.' }, { label: 'Suggest rain-friendly footwear.' }, { label: 'What bag works in wet weather?' }, { label: 'Show a brighter version of this outfit.' } ] },
    { id: 'f-smart', title: 'Smart Casual', sub: 'Dinner out tonight', image: U('photo-1490481651871-ab68de25d43d'),
      message: 'I can help you with a Smart Casual look.', note: 'Versatile · day-to-evening',
      prompts: [ { label: 'Make this suitable for the office.' }, { label: 'Suggest a more relaxed version.' }, { label: 'What jacket works with this?' }, { label: 'Create a day-to-evening variation.' } ] },
    { id: 'f-office', title: 'Office Wear', sub: 'Monday-ready · 5 looks', image: U('photo-1487222477894-8943e31ef7b2'),
      message: 'I can help you with Office Wear.', note: 'Workwear · polished',
      prompts: [ { label: 'Build a five-day work capsule.' }, { label: 'Make this more relaxed for Fridays.' }, { label: 'Suggest comfortable formal shoes.' }, { label: 'Dress this for a cold office.' } ] },
    { id: 'f-vacation', title: 'Vacation Looks', sub: 'Pack-light capsule', image: U('photo-1445205170230-053b83016050'),
      message: 'I can help you with Vacation Looks.', note: 'Travel · capsule wardrobe',
      prompts: [ { label: 'Build a 3-day travel capsule.' }, { label: 'Make this beach-friendly.' }, { label: 'What shoes pack the smallest?' }, { label: 'Create a dressier evening option.' } ] },
  ],
  explore: [
    { label: 'Weekend Layers', cue: 'Relaxed and warm', image: U('photo-1483985988355-763728e1935b') },
    { label: 'Office Wear', cue: 'Polished and ready', image: U('photo-1487222477894-8943e31ef7b2') },
    { label: 'Rain Ready', cue: 'Monsoon-proof', image: U('photo-1515372039744-b8f02a3ae446') },
    { label: 'Occasion', cue: 'Dress for the moment', image: U('photo-1469334031218-e382a71b716b') },
    { label: 'Travel Looks', cue: 'Pack light', image: U('photo-1445205170230-053b83016050') },
    { label: 'Accessories', cue: 'Finish the look', image: U('photo-1523293182086-7651a899d37f') },
    { label: 'Seasonal', cue: 'Right now', image: U('photo-1490481651871-ab68de25d43d') },
    { label: 'Saved Looks', cue: 'Your favourites', image: U('photo-1441984904996-e0b6ba687e04') },
  ],
  recent: [
    { kind: 'Conversation', title: 'What jacket works with this black dress?', time: 'Yesterday', action: 'Continue' },
    { kind: 'Saved Look', title: 'Weekend Layering', context: '4 alternatives saved', time: 'This week', action: 'Continue' },
    { kind: 'Conversation', title: 'What to wear for a rainy office day?', time: 'This morning', action: 'Continue' },
  ],
};

// ─── Wellness ────────────────────────────────────────────────────────────────

const wellness: Topic = {
  id: 'wellness', label: 'Wellness', icon: '🌿', tint: '#7FD1A0', agentName: 'Wellness Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'w-stretch', title: 'Morning Stretch', sub: '10 min · gentle start', image: `${IMG}feed_32-wellness-sunrise-yoga-lake.jpg`, isCurrentL0: true,
      message: 'Want to start with a morning stretch?', note: 'Movement · 10 min',
      prompts: [ { label: 'Make this gentler on my back.' }, { label: 'Turn this into a 5-minute version.' }, { label: 'Add breathing to this routine.' }, { label: 'Build a daily morning habit.' } ] },
    { id: 'w-sleep', title: 'Wind-Down Routine', sub: 'Better sleep tonight', image: `${IMG}feed_07-wellness-morning-ritual.jpg`,
      message: 'Want help winding down tonight?', note: 'Sleep · evening routine',
      prompts: [ { label: 'Build a 20-minute wind-down.' }, { label: 'Suggest a sleep-friendly playlist.' }, { label: 'How do I fall asleep faster?' }, { label: 'Set a consistent bedtime.' } ] },
    { id: 'w-breath', title: 'Breathwork', sub: '5 min · reset focus', image: `${IMG}feed_08-wellness-outdoor-run.jpg`,
      message: 'Want a quick breathwork reset?', note: 'Mindfulness · 5 min',
      prompts: [ { label: 'Guide me through box breathing.' }, { label: 'Make this calming, not energising.' }, { label: 'Add this before focus sessions.' }, { label: 'Shorten this to 2 minutes.' } ] },
    { id: 'w-yoga', title: 'Sunrise Yoga', sub: 'By the lake', image: `${IMG}feed_52-wellness-surf-morning.jpg`,
      message: 'Want to flow through sunrise yoga?', note: 'Movement · outdoor',
      prompts: [ { label: 'Make this beginner-friendly.' }, { label: 'Focus on flexibility.' }, { label: 'Build a weekly yoga plan.' }, { label: 'Add a short cooldown.' } ] },
  ],
  explore: [
    { label: 'Sleep', cue: 'Rest better', image: U('photo-1541781774459-bb2af2f05b55') },
    { label: 'Mindfulness', cue: 'Calm the mind', image: U('photo-1506126613408-eca07ce68773') },
    { label: 'Movement', cue: 'Get moving', image: U('photo-1518611012118-696072aa579a') },
    { label: 'Focus', cue: 'Deep work', image: U('photo-1499209974431-9dddcece7f88') },
    { label: 'Stress Relief', cue: 'Unwind', image: U('photo-1544367567-0f2fcb009e0b') },
    { label: 'Nutrition', cue: 'Eat well', image: U('photo-1490645935967-10de6ba17061') },
  ],
  recent: [
    { kind: 'Conversation', title: 'How do I sleep better on work nights?', time: 'Tuesday', action: 'Continue' },
    { kind: 'Routine', title: 'Better Sleep · 4-day streak', context: 'Evening wind-down', time: 'Last night', action: 'Continue' },
    { kind: 'Saved Session', title: '5-minute breathwork reset', time: 'This week', action: 'Open' },
  ],
};

// ─── Pets ────────────────────────────────────────────────────────────────────

const pets: Topic = {
  id: 'pets', label: 'Pets', icon: '🐾', tint: '#F0C36A', agentName: 'Pet Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'p-vet', title: 'Vet Visit', sub: 'Bruno · in 3 days', image: U('photo-1583337130417-3346a1be7dee'), isCurrentL0: true,
      message: "Want help preparing for Bruno's vet visit?", note: 'Golden Retriever · checkup in 3 days',
      prompts: [ { label: 'What should I ask the vet?' }, { label: 'Prepare a health summary.' }, { label: 'Set a reminder the day before.' }, { label: 'What vaccinations are due?' } ] },
    { id: 'p-grooming', title: 'Grooming Due', sub: 'Overdue by 2 days', image: U('photo-1591946614720-90a587da4a36'),
      message: 'Want help with grooming for Bruno?', note: 'Overdue · monsoon coat care',
      prompts: [ { label: 'Find a mobile groomer nearby.' }, { label: 'How often should I groom in monsoon?' }, { label: 'Suggest at-home grooming steps.' }, { label: 'Best brush for a Golden Retriever?' } ] },
    { id: 'p-food', title: 'Food Running Low', sub: 'Reorder in time', image: U('photo-1589924691995-400dc9ecf8a1'),
      message: 'Want to reorder food for Bruno?', note: 'Low stock · usual brand',
      prompts: [ { label: 'Reorder the usual food.' }, { label: 'Suggest a healthier alternative.' }, { label: 'How much should he eat daily?' }, { label: 'Set an auto-reorder.' } ] },
    { id: 'p-training', title: 'Training: Recall', sub: '5-min daily drill', image: U('photo-1587300003388-59208cc962cb'),
      message: 'Want to work on recall training?', note: 'Training · 5 min a day',
      prompts: [ { label: 'Give me a 5-minute recall drill.' }, { label: 'How do I train indoors on rainy days?' }, { label: 'What treats work best?' }, { label: 'Build a weekly training plan.' } ] },
  ],
  explore: [
    { label: 'Care', cue: 'Health & habits', image: U('photo-1543466835-00a7907e9de1') },
    { label: 'Feeding', cue: 'Diet and nutrition', image: U('photo-1589924691995-400dc9ecf8a1') },
    { label: 'Grooming', cue: 'Coat and cleaning', image: U('photo-1591946614720-90a587da4a36') },
    { label: 'Training', cue: 'Skills and behaviour', image: U('photo-1587300003388-59208cc962cb') },
    { label: 'Play', cue: 'Fun and exercise', image: U('photo-1518155317743-a8ff43ea6a5f') },
    { label: 'Products', cue: 'Vet-recommended', image: U('photo-1601758228041-f3b2795255f1') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Is this plant safe for dogs?', time: 'Monday', action: 'Continue' },
    { kind: 'Reminder', title: "Bruno's vet visit", context: 'Health checkup', time: 'In 3 days', action: 'Open' },
    { kind: 'Saved Advice', title: 'Monsoon paw care', time: 'This week', action: 'Open' },
  ],
};

// ─── Home Decor ──────────────────────────────────────────────────────────────

const homeDecor: Topic = {
  id: 'home-decor', label: 'Home Decor', icon: '🏡', tint: '#A5D6A7', agentName: 'Home Decor Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'h-lighting', title: 'Warm Lighting', sub: 'Layered lamps · cosy glow', image: `${IMG}feed_24-home-cozy-monsoon-living-room.jpg`, isCurrentL0: true,
      message: 'I can help you with Warm Lighting.', note: 'Living room · warm tones',
      prompts: [ { label: 'Where should these lights be placed?' }, { label: 'Suggest a warmer bulb temperature.' }, { label: 'Add layered lighting to this room.' }, { label: 'Make this lighting suitable for movie night.' } ] },
    { id: 'h-balcony', title: 'Balcony Garden', sub: 'Small green space', image: `${IMG}feed_44-home-modern-balcony-garden.jpg`,
      message: 'I can help you with the Balcony Garden.', note: 'Balcony · low maintenance',
      prompts: [ { label: 'Choose plants for low sunlight.' }, { label: 'Create a low-maintenance version.' }, { label: 'Add seating without making it crowded.' }, { label: 'Build a shopping list for this setup.' } ] },
    { id: 'h-living', title: 'Small-Space Living Room', sub: 'Make the most of it', image: `${IMG}feed_28-home-japandi-minimal-living.jpg`,
      message: 'I can help you with the Small-Space Living Room.', note: 'Living room · compact',
      prompts: [ { label: 'Improve the furniture layout.' }, { label: 'Add storage without clutter.' }, { label: 'Make the room feel larger.' }, { label: 'Suggest a compact sofa.' } ] },
    { id: 'h-bedroom', title: 'Bedroom Refresh', sub: 'Calm, sleep-friendly', image: U('photo-1616594039964-ae9021a400a0'),
      message: 'I can help you with the Bedroom Refresh.', note: 'Bedroom · calm palette',
      prompts: [ { label: 'Change only the textiles.' }, { label: 'Improve the bedside lighting.' }, { label: 'Create a calm sleep-friendly palette.' }, { label: 'Add more storage.' } ] },
    { id: 'h-kitchen', title: 'Kitchen Storage', sub: 'Declutter the counters', image: `${IMG}feed_09-home-kitchen-morning.jpg`,
      message: 'I can help you with Kitchen Storage.', note: 'Kitchen · organisation',
      prompts: [ { label: 'Free up counter space.' }, { label: 'Organise a small pantry.' }, { label: 'Suggest modular storage.' }, { label: 'Build a shopping list.' } ] },
    { id: 'h-workspace', title: 'Minimal Workspace', sub: 'Focused and clean', image: `${IMG}feed_49-career-creator-desk-night.jpg`,
      message: 'I can help you with a Minimal Workspace.', note: 'Home office · japandi',
      prompts: [ { label: 'Reduce desk clutter.' }, { label: 'Improve the task lighting.' }, { label: 'Add calm, focused decor.' }, { label: 'Suggest cable management.' } ] },
  ],
  explore: [
    { label: 'Living Room', cue: 'The heart of the home', image: U('photo-1583847268964-b28dc8f51f92') },
    { label: 'Bedroom', cue: 'Rest and calm', image: U('photo-1616594039964-ae9021a400a0') },
    { label: 'Kitchen', cue: 'Cook in style', image: U('photo-1556909212-d5b604d0c90d') },
    { label: 'Lighting', cue: 'Set the mood', image: U('photo-1507473885765-e6ed057f782c') },
    { label: 'Balcony', cue: 'Outdoor corner', image: U('photo-1600585154340-be6161a56a0c') },
    { label: 'Furniture', cue: 'Pieces that fit', image: U('photo-1555041469-a586c61ea9bc') },
    { label: 'Small Spaces', cue: 'Maximise every inch', image: U('photo-1524758631624-e2822e304c36') },
    { label: 'Color Ideas', cue: 'Palettes that work', image: U('photo-1513161455079-7dc1de15ef3e') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Warm lighting for my living room', time: 'Yesterday', action: 'Continue' },
    { kind: 'Generated Design', title: 'Minimal Balcony Garden', context: 'AI design · 6 items', time: '3 days ago', action: 'Continue' },
    { kind: 'Shopping List', title: 'Balcony garden essentials', context: '9 items', time: 'This week', action: 'Open' },
  ],
};

// ─── News ────────────────────────────────────────────────────────────────────

const news: Topic = {
  id: 'news', label: 'News', icon: '📰', tint: '#78B1E0', agentName: 'News Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'n-brief', title: "Today's Brief", sub: 'Bangalore · 5 stories', image: `${IMG}feed_58-travel-mumbai-marine-drive-night.jpg`, isCurrentL0: true,
      message: "Want me to walk you through today's brief?", note: 'Bangalore · morning brief',
      prompts: [ { label: 'Summarize today in 60 seconds.' }, { label: 'What matters most to me?' }, { label: 'Read the sports stories only.' }, { label: 'Follow up on local news.' } ] },
    { id: 'n-rbi', title: 'RBI Holds Repo Rate', sub: 'Steady at 6.5%', image: U('photo-1526304640581-d334cdbbf45e'),
      message: 'Want the RBI decision explained?', note: 'Business · policy update',
      prompts: [ { label: 'Why did rates stay flat?' }, { label: 'How does this affect my loans?' }, { label: 'Explain this simply.' }, { label: 'Compare coverage across sources.' } ] },
    { id: 'n-monsoon', title: 'Monsoon Early in Kerala', sub: '3 days ahead', image: `${IMG}feed_54-travel-kerala-backwaters-houseboat.jpg`,
      message: 'Want the monsoon update?', note: 'Weather · Kerala',
      prompts: [ { label: 'What does this mean for Bangalore?' }, { label: 'Will it affect weekend travel?' }, { label: 'Give me the 7-day forecast.' }, { label: 'Follow monsoon updates.' } ] },
    { id: 'n-cricket', title: 'India Win T20 Series', sub: '3–1 vs Australia', image: `${IMG}feed_25-sports-cricket-stadium-floodlights.jpg`,
      message: 'Want the T20 series wrap?', note: 'Sports · cricket',
      prompts: [ { label: 'Summarize the deciding match.' }, { label: 'Show top player performances.' }, { label: 'When is the next series?' }, { label: 'Find the highlights.' } ] },
  ],
  explore: [
    { label: 'Today', cue: 'The latest', image: U('photo-1504711434969-e33886168f5c') },
    { label: 'World', cue: 'Global headlines', image: U('photo-1495020689067-958852a7765e') },
    { label: 'India', cue: 'National news', image: U('photo-1585829365295-ab7cd400c167') },
    { label: 'Technology', cue: 'Tech & AI', image: U('photo-1518770660439-4636190af475') },
    { label: 'Business', cue: 'Markets & economy', image: U('photo-1611974789855-9c2a0a7236a3') },
    { label: 'Explained', cue: 'Go deeper', image: U('photo-1524995997946-a1c2e315a42f') },
  ],
  recent: [
    { kind: 'Conversation', title: 'Why did rates stay flat?', time: 'Yesterday', action: 'Continue' },
    { kind: 'Followed Topic', title: 'AI regulation in India', context: '1 new update', time: 'Today', action: 'Open' },
    { kind: 'Saved Story', title: 'Repo rate explainer', time: 'Friday', action: 'Open' },
  ],
};

// ─── Sports ──────────────────────────────────────────────────────────────────

const sports: Topic = {
  id: 'sports', label: 'Sports', icon: '🏏', tint: '#7FD1A0', agentName: 'Sports Agent', currentLabel: 'Currently on L0',
  cards: [
    { id: 'sp-match', title: 'India vs Afghanistan', sub: 'Live 7:30 PM · T20', image: `${IMG}feed_25-sports-cricket-stadium-floodlights.jpg`, isCurrentL0: true,
      message: "Following tonight's match?", note: 'Live · T20 · Chinnaswamy',
      prompts: [ { label: 'Show the current score.' }, { label: "What's the playing XI?" }, { label: 'Show key player stats.' }, { label: 'Remind me before it starts.' } ] },
    { id: 'sp-ride', title: 'The Nandi Hills Ride', sub: 'Your triathlon · Sunday', image: `${IMG}feed_45-sports-basketball-sunset-court.jpg`,
      message: 'Want to plan the Nandi Hills ride?', note: 'Cycling · your training',
      prompts: [ { label: 'Plan the Sunday route.' }, { label: 'What time should I start?' }, { label: 'Fit this into my triathlon plan.' }, { label: 'Check the weather for Sunday.' } ] },
    { id: 'sp-highlights', title: 'T20 Highlights', sub: 'India win 3–1', image: `${IMG}feed_11-sports-kabaddi-action.jpg`,
      message: 'Want the T20 highlights?', note: 'Cricket · replay',
      prompts: [ { label: 'Show the key moments.' }, { label: 'Who was player of the series?' }, { label: 'Recap the deciding match.' }, { label: 'Find full match replay.' } ] },
    { id: 'sp-football', title: 'Football Weekend', sub: 'Top fixtures', image: `${IMG}feed_65-sports-football-fan-living-room.jpg`,
      message: 'Want the weekend fixtures?', note: 'Football · this weekend',
      prompts: [ { label: 'Show my teams’ fixtures.' }, { label: 'When does the big match start?' }, { label: 'Set reminders for all games.' }, { label: 'Find where to watch.' } ] },
  ],
  explore: [
    { label: 'Live', cue: 'On right now', image: U('photo-1461896836934-ffe607ba8211') },
    { label: 'Upcoming', cue: "What's next", image: U('photo-1540747913346-19e32dc3e97e') },
    { label: 'Highlights', cue: 'Key moments', image: U('photo-1508098682722-e99c43a406b2') },
    { label: 'Cricket', cue: 'Matches & series', image: U('photo-1531415074968-036ba1b575da') },
    { label: 'Football', cue: 'Leagues & fixtures', image: U('photo-1522778119026-d647f0596c20') },
    { label: 'F1', cue: 'Race weekends', image: U('photo-1552674605-db6ffd4facb5') },
  ],
  recent: [
    { kind: 'Continue Plan', title: 'Triathlon · Sunday ride', context: 'Nandi Hills route', time: 'This week', action: 'Continue' },
    { kind: 'Reminder', title: 'India vs Afghanistan', context: 'Reminder set', time: 'Tonight 7:30 PM', action: 'Open' },
    { kind: 'Saved Highlight', title: 'T20 series decider', time: 'Yesterday', action: 'Open' },
  ],
};

// ─── AI Gallery ──────────────────────────────────────────────────────────────

const gallery: Topic = {
  id: 'gallery', label: 'AI Gallery', icon: '✦', tint: '#B9A6F0', agentName: 'Gallery Agent', currentLabel: 'Latest generation',
  cards: [
    { id: 'g-coorg', title: 'Coorg Estate in the Mist', sub: 'Generated 2h ago', image: `${WS}coorg.jpg`, isCurrentL0: true,
      message: 'Want to riff on “Coorg Estate in the Mist”?', note: 'Landscape · 2h ago',
      prompts: [ { label: 'Generate a similar version.' }, { label: 'Change the background.' }, { label: 'Create a landscape crop.' }, { label: 'Make this suitable for TV.' } ] },
    { id: 'g-wallpaper', title: 'Abstract Wallpaper', sub: '4K · generated yesterday', image: U('photo-1541701494587-cb58502866ab'),
      message: 'Want to work on this wallpaper?', note: 'Wallpaper · 4K',
      prompts: [ { label: 'Make a matching dark version.' }, { label: 'Create a phone crop.' }, { label: 'Try a warmer palette.' }, { label: 'Set as ambient screensaver.' } ] },
    { id: 'g-portrait', title: 'Studio Portrait', sub: 'Soft studio light', image: U('photo-1531123897727-8f129e1688ce'),
      message: 'Want to edit this portrait?', note: 'Portrait · studio',
      prompts: [ { label: 'Soften the lighting.' }, { label: 'Change the background.' }, { label: 'Create a black-and-white version.' }, { label: 'Upscale to high resolution.' } ] },
    { id: 'g-landscape', title: 'Golden Hour Landscape', sub: 'Wide · warm tones', image: U('photo-1470071459604-3b5ec3a7fe05'),
      message: 'Want to riff on this landscape?', note: 'Landscape · golden hour',
      prompts: [ { label: 'Generate a similar version.' }, { label: 'Make this a wide TV wallpaper.' }, { label: 'Try a moodier sky.' }, { label: 'Add this to a collection.' } ] },
  ],
  explore: [
    { label: 'Recent Generations', cue: 'Latest first', image: U('photo-1618005182384-a83a8bd57fbe') },
    { label: 'Wallpapers', cue: 'For your screens', image: U('photo-1541701494587-cb58502866ab') },
    { label: 'Portraits', cue: 'People & studio', image: U('photo-1531123897727-8f129e1688ce') },
    { label: 'Landscapes', cue: 'Scenes & nature', image: U('photo-1470071459604-3b5ec3a7fe05') },
    { label: 'Collections', cue: '3 albums', image: U('photo-1550859492-d5da9d8e45f3') },
    { label: 'Continue Editing', cue: 'Pick up a draft', image: U('photo-1508614589041-895b88991e3e') },
  ],
  recent: [
    { kind: 'Continue Editing', title: 'Reading nook — Japandi', context: 'Draft', time: 'Monday', action: 'Continue' },
    { kind: 'Collection', title: 'Weekend Wallpapers', context: '8 images', time: 'This week', action: 'Open' },
    { kind: 'Saved Creation', title: 'Coorg estate in the mist', time: '2h ago', action: 'Open' },
  ],
};

export const TOPICS: Topic[] = [
  travel, recipes, shopping, entertainment, fashion, wellness, pets, homeDecor, news, sports, gallery,
];
export const GALLERY_TOPIC_ID = 'gallery';

// ─── Global destinations (Search / Wishlist / Recent / Settings) ──────────────

export type GlobalItem = { title: string; sub: string; image?: string };
export type Global = { id: string; label: string; icon: string; heading: string; items: GlobalItem[] };

export function buildGlobals(city: string, weather: string): Global[] {
  return [
    { id: 'search', label: 'Search', icon: '⌕', heading: 'Search everything', items: [
      { title: '“That recipe from yesterday”', sub: 'Recipes · history' },
      { title: '“The tea estate place”', sub: 'Travel · Chikmagalur' },
      { title: '“The jacket I saved”', sub: 'Fashion · wishlist' },
      { title: '“My last AI image”', sub: 'AI Gallery' },
      { title: `Search ${city} · what's on today`, sub: 'Open-ended' },
    ] },
    { id: 'wishlist', label: 'Wishlist', icon: '♡', heading: 'Saved across topics', items: [
      { title: 'Sony WH-1000XM5', sub: 'Shopping · ↓ ₹8,000', image: U('photo-1505740420928-5e560c06d30e') },
      { title: 'Ama Plantation, Coorg', sub: 'Travel · saved since Feb', image: `${WS}coorg.jpg` },
      { title: 'Soft beige jacket', sub: 'Fashion · back in stock', image: U('photo-1591047139829-d91aecb6caea') },
      { title: 'Chicken Biryani', sub: 'Recipes · weekend cook', image: `${IMG}feed_47-food-monsoon-chai-stall.jpg` },
      { title: 'House of the Dragon', sub: 'Entertainment · to watch', image: `${IMG}feed_13-entertainment-classical-dance.jpg` },
    ] },
    { id: 'recent', label: 'Recent', icon: '⟲', heading: 'Recently on L0', items: [
      { title: 'A Coffee Estate at First Light', sub: 'Today · Travel', image: `${WS}coorg.jpg` },
      { title: 'Butter Garlic Naan Pizza', sub: 'Today · Recipes', image: `${IMG}feed_04-food-dinner-party-table.jpg` },
      { title: 'The Nandi Hills Ride', sub: 'Yesterday · Sports', image: `${IMG}feed_45-sports-basketball-sunset-court.jpg` },
      { title: 'India vs Afghanistan', sub: 'Yesterday · Sports', image: `${IMG}feed_25-sports-cricket-stadium-floodlights.jpg` },
      { title: 'The Morning Ritual', sub: 'This week · Wellness', image: `${IMG}feed_07-wellness-morning-ritual.jpg` },
    ] },
    { id: 'settings', label: 'Settings', icon: '⚙', heading: 'Ambient context', items: [
      { title: `Location · ${city}`, sub: 'Confirmed' },
      { title: `Weather · ${weather}`, sub: 'Live context' },
      { title: 'Selfie · not added', sub: 'Set up your looks' },
      { title: 'Profile · Akshay', sub: 'Warm · 6 services linked' },
      { title: 'Privacy · On-device', sub: 'Agent permissions' },
    ] },
  ];
}

export function resolveTopicIdx(category?: string, subs?: string[]): number {
  if (!category) return 1;
  const c = category.toLowerCase();
  const s = (subs || []).map(x => x.toLowerCase());
  const has = (...keys: string[]) => keys.some(k => c.includes(k) || s.some(sub => sub.includes(k)));
  let id: string | null = null;
  if (has('travel', 'trip', 'escape', 'destination')) id = 'travel';
  else if (has('food', 'recipe', 'cook', 'cuisine', 'dining')) id = 'recipes';
  else if (has('shop', 'product', 'deal', 'price', 'luxury')) id = 'shopping';
  else if (has('entertain', 'movie', 'show', 'music', 'vinyl')) id = 'entertainment';
  else if (has('fashion', 'style', 'apparel', 'beauty')) id = 'fashion';
  else if (has('wellness', 'yoga', 'sleep', 'meditat', 'health')) id = 'wellness';
  else if (has('pet', 'dog', 'cat')) id = 'pets';
  else if (has('home', 'decor', 'interior', 'living')) id = 'home-decor';
  else if (has('news', 'brief', 'headline')) id = 'news';
  else if (has('sport', 'cricket', 'match', 'cycling', 'fitness')) id = 'sports';
  const idx = id ? TOPICS.findIndex(t => t.id === id) : -1;
  return idx >= 0 ? idx : 1;
}
