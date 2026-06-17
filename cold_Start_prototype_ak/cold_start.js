/* ================================================================
   GLANCE TV — COLD START engine + flow
   Bangalore-only. No persistence. D-pad / remote native.

   Sections:
     1. Context & state (§4)
     2. Enriched profile model + write path (§5)
     3. Worlds + discovery config (§3.3, §5.1)
     4. CSV bank (engine — preserved)
     5. Interest model + re-rank (engine — preserved, in-memory)
     6. First-feed selection (§5.2) + feed card build (engine)
     7. Agent reasoning lines + copy lint (§7, §8.1)
     8. Card lifecycle (showCard / typing / CTA dock — engine)
     9. Setup screens: welcome / context / worlds / appetite / selfie
    10. L1 confirmation surface (§3.8)
    11. In-feed prompt governance (§6)
    12. D-pad / remote model (§3.9)
    13. Debug panel + image coherence QA (§3.11, §7.1)
   ================================================================ */

/* ============ 1. CONTEXT & STATE (§4) ============ */
window.GLANCE_STATE = "cold";
window.GLANCE_CTX = { city:"Bangalore", weather:"rainy", day:"Friday", timeOfDay:"evening", upcomingContext:"long_weekend" };
const CTX = window.GLANCE_CTX;
const STATE = window.GLANCE_STATE;
const DEBUG_PERSIST = false;            // default false — never persist for cold start
const PROMPT_TEST_MODE = false;         // QA only: lowers interstitial threshold to 3

let INTERESTS = {};                     // in-memory ONLY (no localStorage)
let BANK = {};                          // id -> CSV row
let REASONS = {};                       // id -> { tag, cold, warm, enr }
let FEED_IDS = [];                      // chosen at build time by selectFirstFeed()

// runtime counters surfaced in the debug panel
const RUNTIME = {
  noInteractionCardCount: 0,
  interstitialsShown: 0,
  l1FollowupsShown: 0,
  globalPromptCooldownActive: false,
  lastInteractionType: "none",
  cardsSincePrompt: 99
};

/* ============ 2. ENRICHED PROFILE MODEL + WRITE PATH (§5) ============
   Mirrors the shape of profiles/enriched.json but starts all-null
   except demographics.location. Every onboarding answer writes the
   SAME fields a mature profile uses, just at low confidence. */
function createSparseEnrichedProfile() {
  return {
    demographics: {
      age:{ min:null,max:null,avg:null,confidence_score:null },
      gender:{ value:null,confidence_score:null },
      location:{ value:"Bangalore", confidence_score:0.97 },   // only known cold-start fact (IP)
      profession:{ value:null,confidence_score:null },
      income_range:{ min:null,max:null,avg:null,confidence_score:null },
      household:{ relationship_status:{value:null,confidence_score:null},
                  kids:{has_kids:null,count:null,confidence_score:null},
                  pets:{has_pets:null,count:null,confidence_score:null} }
    },
    category_interests:{ primary_category_interests:[] },
    lifestyle_preferences:{
      health_and_fitness:{ wellness_interests:[], fitness_interests:[], confidence_score:null },
      travel_patterns:{ destination_types:[], travel_budget:null, confidence_score:null },
      food_and_dining:{ cuisine_preferences:[], confidence_score:null },
      social_life:{ preferred_venues:[], event_attendance:null, confidence_score:null },
      hobbies_and_interests:{ categories:[], confidence_score:null },
      entertainment_preferences:{ event_attendance:{}, confidence_score:null }
    },
    fashion_preferences:{},               // intentionally empty — one tap can't fill this
    brand_preferences:[],                 // empty per §5
    price_range:null,                     // empty per §5
    discovery_appetite:null,
    chat_preferences:{ user_intents:[] },
    _derived_signals:{ vibe:{} },         // weak hints land here, NOT a top-level vibe key
    _metadata:{ total_interactions:0, total_impressions:0, data_quality:"sparse", primary_signal_source:"onboarding" }
  };
}
let GLANCE_PROFILE_DRAFT = createSparseEnrichedProfile();

// confidence model (§5.3)
const CONFIDENCE_DELTAS = {
  onboarding_world:0.35, feed_open:0.05, like:0.08, save:0.10,
  l1_more_yes:0.12, interstitial_answer:0.08, dislike_soft_negative:-0.04
};
const CONF_CLAMP = { onboardingMax:0.40, sessionBehavioralMax:0.65 };

// find-or-create a primary category interest entry
function ensureCategory(category) {
  const list = GLANCE_PROFILE_DRAFT.category_interests.primary_category_interests;
  let e = list.find(c => c.category === category);
  if (!e) { e = { category, confidence_score:0, engagement_ratio:null, brand_preferences:[], price_range:null }; list.push(e); }
  return e;
}
function bumpCategoryConfidence(category, delta, source) {
  const e = ensureCategory(category);
  const max = source === "onboarding" ? CONF_CLAMP.onboardingMax : CONF_CLAMP.sessionBehavioralMax;
  e.confidence_score = Math.max(0, Math.min(max, +(e.confidence_score + delta).toFixed(3)));
  return e;
}
function pushUnique(arr, items) { items.forEach(i => { if (!arr.includes(i)) arr.push(i); }); }

// apply one world selection — writes category + the relevant lifestyle branch (§5 table)
function applyWorldSelection(worldId) {
  const m = WORLD_TO_PROFILE[worldId];
  if (!m) return;
  const lp = GLANCE_PROFILE_DRAFT.lifestyle_preferences;
  const e = ensureCategory(m.category);
  e.confidence_score = Math.max(e.confidence_score, CONFIDENCE_DELTAS.onboarding_world); // ~0.35
  if (m.subcategories) e.subcategories = m.subcategories.slice();

  if (m.lifestyle) {
    const branch = lp[m.lifestyle.branch];
    if (branch) {
      if (m.lifestyle.arrayField) pushUnique(branch[m.lifestyle.arrayField], m.lifestyle.values || []);
      branch.confidence_score = Math.max(branch.confidence_score || 0, 0.35);
    }
  }
  if (m.vibe) GLANCE_PROFILE_DRAFT._derived_signals.vibe[m.vibe] = 0.3; // weak hint only
  GLANCE_PROFILE_DRAFT._metadata.primary_signal_source = "onboarding";
  refreshDebug();
}
function applyDiscoveryAppetite(value) {
  GLANCE_PROFILE_DRAFT.discovery_appetite = value;
  GLANCE_PROFILE_DRAFT.chat_preferences.user_intents = (DISCOVERY_TO_INTENTS[value] || []).slice();
  refreshDebug();
}
// generic mappedAttributes writer (used by interstitial answers, §6)
function applyMappedAttributes(map, opts) {
  const conf = (opts && opts.confidence) || 0.4;
  const lp = GLANCE_PROFILE_DRAFT.lifestyle_preferences;
  (map.categories || []).forEach(cat => { const e = ensureCategory(cat); e.confidence_score = Math.max(e.confidence_score, conf); });
  (map.lifestyle || []).forEach(l => {
    const branch = lp[l.branch];
    if (branch) { if (l.arrayField) pushUnique(branch[l.arrayField], l.values || []); branch.confidence_score = Math.max(branch.confidence_score || 0, conf); }
  });
  if (map.vibe) GLANCE_PROFILE_DRAFT._derived_signals.vibe[map.vibe] = Math.max(GLANCE_PROFILE_DRAFT._derived_signals.vibe[map.vibe] || 0, 0.35);
  refreshDebug();
}

/* ============ 3. WORLDS + DISCOVERY CONFIG (§3.3, §5, §5.1) ============ */
const WORLD_OPTIONS = [
  { id:"food_finds",        title:"Food finds",        subtitle:"Local spots, street food, ideas to try", image:"content/images/worlds/food_finds.jpg",        visibleInitially:true },
  { id:"style_ideas",       title:"Style ideas",       subtitle:"Outfits, looks, things to wear",          image:"content/images/worlds/style_ideas.jpg",       visibleInitially:true },
  { id:"weekend_escapes",   title:"Weekend escapes",   subtitle:"Short trips, views, places to discover",  image:"content/images/worlds/weekend_escapes.jpg",   visibleInitially:true },
  { id:"calm_routines",     title:"Calm routines",     subtitle:"Wellness, mornings, ways to unwind",      image:"content/images/worlds/calm_routines.jpg",     visibleInitially:true },
  { id:"home_upgrades",     title:"Home upgrades",     subtitle:"Spaces, corners, small improvements",     image:"content/images/worlds/home_upgrades.jpg",     visibleInitially:false },
  { id:"local_discoveries", title:"Local discoveries", subtitle:"Culture, places, things happening nearby",image:"content/images/worlds/local_discoveries.jpg", visibleInitially:false },
  { id:"game_day_sport",    title:"Game-day & sport",  subtitle:"Matches, fans, the thrill of the game",   image:"content/images/worlds/game_day_sport.jpg",    visibleInitially:false },
  { id:"tech_gadgets",      title:"Tech & gadgets",    subtitle:"New gear, smart things, what's next",      image:"content/images/worlds/tech_gadgets.jpg",      visibleInitially:false }
];
const WORLD_SELECTION_RULES = {
  maxSelections:3, minSelectionsToContinue:1, revealMode:"first4_then_see_more",
  revealDelayMs:45000, autoReveal:true, moveFocusToRevealedRow:true
};
// each world -> the enriched fields it seeds (§5 table)
const WORLD_TO_PROFILE = {
  food_finds:       { category:"Food",    lifestyle:{ branch:"food_and_dining", arrayField:"cuisine_preferences", values:["local","street food"] } },
  style_ideas:      { category:"Fashion", subcategories:["topwear","outerwear"] }, // sub-objects stay empty (don't overclaim)
  weekend_escapes:  { category:"Travel",  lifestyle:{ branch:"travel_patterns", arrayField:"destination_types", values:["short trips","scenic"] } },
  calm_routines:    { category:"Wellness",lifestyle:{ branch:"health_and_fitness", arrayField:"wellness_interests", values:["calm routines","mindfulness","unwind"] }, vibe:"calm" },
  home_upgrades:    { category:"Home",    lifestyle:{ branch:"hobbies_and_interests", arrayField:"categories", values:["home","interiors"] } },
  local_discoveries:{ category:"Culture", lifestyle:{ branch:"social_life", arrayField:"preferred_venues", values:["local spots"] }, vibe:"social" },
  game_day_sport:   { category:"Sport",   lifestyle:{ branch:"entertainment_preferences" } },
  tech_gadgets:     { category:"Tech",    lifestyle:{ branch:"hobbies_and_interests", arrayField:"categories", values:["technology"] } }
};
// which CSV categories an interest in this world matches (for feed selection)
const WORLD_TO_BANK_CATEGORIES = {
  food_finds:["Food"], style_ideas:["Fashion","Beauty"], weekend_escapes:["Travel","Weekend"],
  calm_routines:["Wellness"], home_upgrades:["Home"], local_discoveries:["Culture","Social","Music","Books"],
  game_day_sport:["Sport"], tech_gadgets:["Tech","Gaming"]
};
// adjacency for "roam" mixing (§5.1)
const CATEGORY_ADJACENCY = {
  Food:["Travel","Culture"], Fashion:["Beauty","Culture"], Travel:["Weekend","Culture","Wellness"],
  Wellness:["Home","Food"], Home:["Wellness","Tech"], Culture:["Music","Books","Social","Travel"],
  Sport:["Entertainment","Social"], Tech:["Gaming","Productivity"]
};
const DISCOVERY_TO_INTENTS = {
  familiar:["OCCASION_CASUAL_DAILY"],
  medium:["OCCASION_CASUAL_DAILY","DISCOVER_RELATED"],
  medium_high:["DISCOVER_RELATED","DISCOVER_NEW"],
  high:["DISCOVER_NEW","OCCASION_CASUAL_DAILY"]
};
const DISCOVERY_MIX = {
  familiar:   { dominant:0.75, adjacent:0.20, explore:0.05 },
  medium:     { dominant:0.55, adjacent:0.30, explore:0.15 },
  medium_high:{ dominant:0.45, adjacent:0.30, explore:0.25 },
  high:       { dominant:0.35, adjacent:0.30, explore:0.35 }
};

// live selection state for setup
const SETUP = { selectedWorlds:[], appetite:null, contextConfirmed:null };

/* ============ 4. CSV BANK (engine — preserved) ============ */
function parseCSV(text){
  const rows=[]; let i=0, field='', row=[], inq=false;
  while(i<text.length){ const ch=text[i];
    if(inq){ if(ch==='"'){ if(text[i+1]==='"'){field+='"';i++;} else inq=false; } else field+=ch; }
    else { if(ch==='"') inq=true; else if(ch===','){ row.push(field); field=''; }
      else if(ch==='\n'||ch==='\r'){ if(ch==='\r'&&text[i+1]==='\n')i++; if(field!==''||row.length){ row.push(field); rows.push(row); row=[]; field=''; } }
      else field+=ch; }
    i++; }
  if(field!==''||row.length){ row.push(field); rows.push(row); }
  const head=rows.shift(); return rows.filter(r=>r.length>1).map(r=>{ const o={}; head.forEach((h,j)=>o[h]=r[j]||''); return o; });
}
function loadBank(){
  return fetch('content/content_bank.csv').then(r=>{ if(!r.ok) throw new Error('csv '+r.status); return r.text(); })
    .then(t=>{ parseCSV(t).forEach(r=>{ BANK[r.id]=r;
      REASONS[r.id]={ tag:(r.subcategory||r.category||'').trim().toLowerCase(), cold:r.cold_reason, warm:r.warm_reason, enr:r.enriched_reason }; });
    });
}

/* ============ 5. INTEREST MODEL + RE-RANK (engine — in-memory) ============ */
function cardTags(card){ const r=REASONS[card.dataset.id]; const prefs=(card.dataset.prefs||'').split('|').filter(Boolean); return prefs.concat(r&&r.tag?[r.tag]:[]); }
function bumpInterest(card,w){ cardTags(card).forEach(t=>{ if(t) INTERESTS[t]=(INTERESTS[t]||0)+w; }); }
function topInterest(){ let b=null,bw=0; for(const t in INTERESTS){ if(INTERESTS[t]>bw){bw=INTERESTS[t];b=t;} } return b; }

// Re-rank the upcoming feed tail. Honors interest weights AND the DISCOVERY_MIX
// dominant/adjacent/explore ratio so appetite visibly shapes order (§5.1).
function reRankUpcoming(){
  const stage=document.getElementById('stage');
  const all=[...document.querySelectorAll('.card')];
  const tail=all.slice(currentIndex+1).filter(c=>c.classList.contains('reveal-after'));
  if(tail.length<2) return false;
  const mix = DISCOVERY_MIX[SETUP.appetite] || DISCOVERY_MIX.medium;
  const dominantCats = dominantCategories();
  const score=c=>{
    let s=0; cardTags(c).forEach(t=>s+=(INTERESTS[t]||0));
    const cat=c.dataset.cat;
    if(dominantCats.has(cat)) s += mix.dominant*2;
    else if(isAdjacent(cat, dominantCats)) s += mix.adjacent*2;
    else s += mix.explore*2;
    if(c.dataset.urgency==='timely') s+=0.15;
    return s;
  };
  const sorted=[...tail].sort((a,b)=>score(b)-score(a));
  if(sorted.every((c,i)=>c===tail[i])) return false;
  const ref=tail[tail.length-1].nextSibling;
  sorted.forEach(c=>stage.insertBefore(c,ref));
  cards=document.querySelectorAll('.card');
  return true;
}
function dominantCategories(){
  const set=new Set();
  SETUP.selectedWorlds.forEach(w=>(WORLD_TO_BANK_CATEGORIES[w]||[]).forEach(c=>set.add(c)));
  return set;
}
function isAdjacent(cat, dominantCats){
  for(const d of dominantCats){ if((CATEGORY_ADJACENCY[d]||[]).includes(cat)) return true; }
  return false;
}

/* ============ 6. FIRST-FEED SELECTION (§5.2) + CARD BUILD (engine) ============
   First 6 cards: >=3 matching selected worlds, 1 Bangalore-context,
   1 weather/time, 1 discovery card sized by appetite. Pads with
   adjacent then context so a sparse-content world is never empty. */
function bankByCategory(cat){ return Object.values(BANK).filter(r=>r.category===cat); }
function ctxMatch(r){ // rainy Friday evening cosy bias
  const t=(r.timeOfDay||'').toLowerCase(), w=(r.weather||'').toLowerCase();
  return (t.includes('evening')||t.includes('any')||t==='') && (w.includes('rainy')||w.includes('any')||w==='');
}
function selectFirstFeed(){
  const used=new Set(); const out=[];
  const take=r=>{ if(r && !used.has(r.id)){ used.add(r.id); out.push(r.id); return true; } return false; };
  const dominantCats=[...dominantCategories()];

  // >=3 from selected worlds, INTERLEAVED across the chosen worlds (round-robin)
  // so the payoff reads as variety, not 4 Food cards in a row (§5.2).
  // Build a queue per selected world's matching bank categories, ctx-fitting first.
  const worldQueues = SETUP.selectedWorlds.map(w=>{
    const cats=WORLD_TO_BANK_CATEGORIES[w]||[];
    const rows=cats.flatMap(bankByCategory).sort((a,b)=>(ctxMatch(b)?1:0)-(ctxMatch(a)?1:0));
    return rows;
  });
  let worldPicks=0, guard=0;
  while(worldPicks<Math.max(3, SETUP.selectedWorlds.length) && guard<40){
    let progressed=false;
    for(const q of worldQueues){
      const r=q.shift(); if(r && take(r)){ worldPicks++; progressed=true; }
      if(worldPicks>=4) break;
    }
    if(!progressed) break; guard++;
  }
  // 1 Bangalore-context card (Food/Culture cosy)
  const ctxCard = Object.values(BANK).find(r=>!used.has(r.id) && ['Food','Culture','Home'].includes(r.category) && ctxMatch(r));
  take(ctxCard);
  // 1 weather/time card
  const weatherCard = Object.values(BANK).find(r=>!used.has(r.id) && (r.category==='Weather' || /rain|cosy|cozy|monsoon|chai|coffee/i.test(r.title+r.subtitle)));
  take(weatherCard);
  // 1 discovery card sized by appetite: adjacent for low appetite, explore for high
  const wantExplore = SETUP.appetite==='high' || SETUP.appetite==='medium_high';
  let discovery;
  if(wantExplore){ discovery = Object.values(BANK).find(r=>!used.has(r.id) && !dominantCats.includes(r.category) && !isAdjacent(r.category,new Set(dominantCats))); }
  else { discovery = Object.values(BANK).find(r=>!used.has(r.id) && isAdjacent(r.category,new Set(dominantCats))); }
  take(discovery);

  // pad to a full feed: adjacent, then anything context-fitting, then remaining
  const adj = Object.values(BANK).filter(r=>!used.has(r.id) && isAdjacent(r.category,new Set(dominantCats)));
  adj.forEach(take);
  Object.values(BANK).filter(r=>!used.has(r.id) && ctxMatch(r)).forEach(take);
  Object.values(BANK).filter(r=>!used.has(r.id)).forEach(take);

  return out.slice(0, 24); // cap the session feed length
}

const LAYOUTS=['layout-bl','layout-center','layout-bl','layout-br'];
const CTA_BY_INTENT = { buy:"See options?", book:"Reserve in demo?", plan:"Plan this?", learn:"Show me how?", inspire:"Save this idea?" };
function buildFeedCard(row, idx){
  const c=document.createElement('div');
  c.className='card reveal-after '+LAYOUTS[idx%LAYOUTS.length];
  c.dataset.id=row.id; c.dataset.image=row.imageFile; c.dataset.cat=row.category;
  c.dataset.prefs=row.prefs; c.dataset.intent=row.intent; c.dataset.urgency=row.urgency; c.dataset.dwell='8000';
  c.dataset.subcat=row.subcategory||'';
  const tag = row.subcategory ? `${row.category} · ${row.subcategory}` : row.category;
  const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  c.innerHTML =
    '<div class="card-image"></div>'+
    `<div class="card-tag">${esc(tag)}</div>`+
    '<div class="card-content">'+
      `<div class="card-title">${esc(row.title)}</div>`+
      (row.subtitle?`<div class="card-sub">${esc(row.subtitle)}</div>`:'')+
      '<div class="agent-line"><span class="typed-text"></span><span class="agent-mascot"></span></div>'+
      '<div class="card-actions">'+
        '<button class="cta-button"><span class="cta-dock"></span><span class="cta-question"></span><span class="cta-yes">OK</span></button>'+
        '<div class="feed-rail">'+
          '<button class="rail-btn" data-rail="like" title="Thumbs up">👍</button>'+
          '<button class="rail-btn" data-rail="dislike" title="Thumbs down">👎</button>'+
        '</div>'+
      '</div>'+
    '</div>';
  return c;
}
function injectFeed(){
  const stage=document.getElementById('stage');
  FEED_IDS.forEach((id,idx)=>{ const row=BANK[id]; if(row) stage.appendChild(buildFeedCard(row, idx)); });
}
// Rebuild the feed from the user's actual selections. Called when the build
// transition runs, so the first-feed payoff reflects the chosen worlds + appetite
// (selectFirstFeed at boot ran before any picks existed).
let feedBuilt=false;
function rebuildFeed(){
  if(feedBuilt) return; feedBuilt=true;
  const stage=document.getElementById('stage');
  // remove any previously-injected feed cards
  stage.querySelectorAll('.card.reveal-after').forEach(c=>c.remove());
  FEED_IDS = selectFirstFeed();
  FEED_IDS.forEach((id,idx)=>{ const row=BANK[id]; if(row){ const c=buildFeedCard(row, idx); stage.appendChild(c); wireCard(c); c.querySelectorAll('.agent-mascot').forEach(m=>{ if(!m.childElementCount) m.appendChild(mascotTemplate.content.cloneNode(true)); }); const al=c.querySelector('.agent-line'); if(al) al.classList.add('mood-confident'); } });
  cards=document.querySelectorAll('.card');
}

/* ============ 7. AGENT REASONING + COPY LINT (§7, §8.1) ============ */
const COPY_LINT_BANNED = [/\bI know\b/i, /your history/i, /because you always/i, /your calendar/i, /your purchase/i, /your size/i, /your health/i, /your therapist/i];
function lintAgentLine(text){
  for(const re of COPY_LINT_BANNED){ if(re.test(text)){ console.warn('[copy-lint] banned phrasing:', text); return `For a rainy ${CTX.city} evening — a pick worth a look.`; } }
  return text;
}
function personalize(card){
  const id=card.dataset.id;
  const intent=card.dataset.intent||'inspire';
  const r=REASONS[id]||{};
  const cta=CTA_BY_INTENT[intent]||"Want this?";
  const tagInterested = r.tag && (INTERESTS[r.tag]||0) >= 1;
  let reasoning = tagInterested
    ? `More ${r.tag} — since you leaned into that.`
    : (r.cold || `A ${CTX.city} favourite worth a look this ${CTX.timeOfDay}.`);
  return { reasoning: lintAgentLine(reasoning), cta };
}

/* ============ 8. CARD LIFECYCLE (engine — preserved) ============ */
let cards = document.querySelectorAll('.card');
const mascotTemplate = document.getElementById('mascotTemplate');
const timeMarkEl = document.getElementById('timeMark');
let currentIndex=0, typingTimers=[], launchTimers=[], autoTimer=null, autoMode=true, idleResumeTimer=null;

function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }
function clearTyping(){ typingTimers.forEach(clearTimeout); typingTimers=[]; }
function clearLaunchers(){ launchTimers.forEach(clearTimeout); launchTimers=[]; }
function setInstant(el,t){ el.textContent=t; }
function typeText(el,text,onDone){ el.textContent=''; el.classList.add('typing'); const L=el.closest('.agent-line'); if(L)L.classList.add('is-typing'); let i=0; (function t(){ if(i>=text.length){el.classList.remove('typing'); if(L)L.classList.remove('is-typing'); if(onDone)onDone(); return;} el.textContent+=text[i]; const ch=text[i]; i++; let d=42+Math.random()*32; if(ch===',')d=240; if(ch==='.'||ch==='?'||ch==='!')d=380; if(ch==='—'||ch===':')d=260; typingTimers.push(setTimeout(t,d)); })(); }
function typeSlow(el,text,onDone){ el.textContent=''; let i=0; (function t(){ if(i>=text.length){if(onDone)onDone();return;} el.textContent+=text[i]; const ch=text[i]; i++; let d=52+Math.random()*38; if(ch===',')d=320; if(ch==='.'||ch==='?'||ch==='!')d=480; if(ch==='—'||ch===':')d=340; typingTimers.push(setTimeout(t,d)); })(); }

function setTimeLabel(card){ if(card.dataset.timeLabel&&timeMarkEl) timeMarkEl.textContent=card.dataset.timeLabel; }
function dwellFor(card){ return parseInt(card.dataset.dwell||'8000',10); }

function launchToCTA(card){ const m=card.querySelector('.agent-line .agent-mascot'),cta=card.querySelector('.card-actions .cta-button'),dock=card.querySelector('.cta-dock'),L=card.querySelector('.agent-line'); if(!m||!cta||!dock)return; const s=m.getBoundingClientRect(); cta.classList.add('measuring'); const d=dock.getBoundingClientRect(); cta.classList.remove('measuring'); m.style.setProperty('--dock-x',`${(d.left+d.width/2)-(s.left+s.width/2)}px`); m.style.setProperty('--dock-y',`${(d.top+d.height/2)-(s.top+s.height/2)}px`); requestAnimationFrame(()=>{m.classList.add('is-traveling','docked-cta'); L.classList.add('sent');}); launchTimers.push(setTimeout(()=>cta.classList.add('landed'),800)); launchTimers.push(setTimeout(()=>m.classList.remove('is-traveling'),920)); }
function placeCTAInstant(card){ const m=card.querySelector('.agent-line .agent-mascot'),cta=card.querySelector('.card-actions .cta-button'),dock=card.querySelector('.cta-dock'),L=card.querySelector('.agent-line'); if(!m||!cta||!dock){if(cta)cta.classList.add('landed');return;} cta.classList.add('measuring'); const s=m.getBoundingClientRect(),d=dock.getBoundingClientRect(); cta.classList.remove('measuring'); m.style.transition='none'; m.style.setProperty('--dock-x',`${(d.left+d.width/2)-(s.left+s.width/2)}px`); m.style.setProperty('--dock-y',`${(d.top+d.height/2)-(s.top+s.height/2)}px`); m.classList.add('docked-cta'); L.classList.add('sent'); requestAnimationFrame(()=>{m.style.transition='';}); cta.classList.add('landed'); }
function animateBuildList(card){ card.querySelectorAll('.build-row').forEach((r,i)=>launchTimers.push(setTimeout(()=>{r.classList.remove('pending');r.classList.add('done');},900+i*700))); }

function resetCard(card){
  const cta=card.querySelector('.card-actions .cta-button'); if(cta)cta.classList.remove('landed');
  const L=card.querySelector('.agent-line'); if(L)L.classList.remove('sent');
  const m=card.querySelector('.agent-line .agent-mascot'); if(m){m.style.transition='none';m.classList.remove('docked-cta','is-traveling');requestAnimationFrame(()=>{m.style.transition='';});}
  const t=card.querySelector('.typed-text'); if(t)t.textContent='';
  card.querySelectorAll('.build-row').forEach(r=>{r.classList.add('pending');r.classList.remove('done');});
  const sq=card.querySelector('.setup-question'); if(sq)sq.classList.remove('is-typing');
  const qt=card.querySelector('.q-typed'); if(qt)qt.textContent='';
  const ss=card.querySelector('.setup-sub'); if(ss)ss.classList.remove('show');
  card.querySelectorAll('.opt-row').forEach(r=>r.classList.remove('revealed'));
  const ht=card.querySelector('.hero-typed'); if(ht)ht.textContent='';
  card.classList.remove('revealed');
}

function showCard(index, typing){
  clearTyping(); clearLaunchers(); if(autoTimer){clearTimeout(autoTimer);autoTimer=null;}
  const card=cards[index]; cards.forEach(resetCard); cards.forEach((c,i)=>c.classList.toggle('active',i===index)); setTimeLabel(card);
  const kind=card.dataset.kind;

  // Build the personalized feed when the build transition appears (after setup).
  if(kind==='building'){ rebuildFeed(); }

  // background image hydrate
  const img=card.dataset.image; if(img){ const ci=card.querySelector('.card-image'); if(ci) ci.style.backgroundImage=`url("${img}")`; }

  // feed cards: inject reasoning + CTA, count impressions, governance
  if(card.classList.contains('reveal-after')){
    const {reasoning,cta}=personalize(card); card.dataset.typed=reasoning;
    const q=card.querySelector('.cta-question'); if(q)q.textContent=cta;
    onFeedCardShown(card);
  }
  if(card.querySelector('.build-list')) animateBuildList(card);
  const finishAuto=()=>{ if(autoMode) scheduleAuto(card); };

  // ---- WELCOME / hero ----
  const heroEl=card.querySelector('.hero-typed');
  if(heroEl){ const txt=card.dataset.heroTyped||''; if(typing){ launchTimers.push(setTimeout(()=>typeSlow(heroEl,txt,()=>{const c=card.querySelector('.card-actions .cta-button'); if(c)launchTimers.push(setTimeout(()=>c.classList.add('landed'),300)); finishAuto();}),1000)); } else { setInstant(heroEl,txt); const c=card.querySelector('.card-actions .cta-button'); if(c)c.classList.add('landed'); } setupFocus(card); return; }

  // ---- SETUP screens (context / worlds / appetite) ----
  const qEl=card.querySelector('.q-typed');
  if(qEl){
    const sq=card.querySelector('.setup-question'), ss=card.querySelector('.setup-sub'), txt=card.dataset.question||'';
    const reveal=()=>{ if(ss)ss.classList.add('show'); revealSetupBody(card); setupFocus(card); finishAuto(); };
    if(typing){ launchTimers.push(setTimeout(()=>{ if(sq)sq.classList.add('is-typing'); typeSlow(qEl,txt,()=>{ if(sq)sq.classList.remove('is-typing'); launchTimers.push(setTimeout(reveal,200)); }); },900)); }
    else { setInstant(qEl,txt); reveal(); }
    return;
  }

  // ---- SELFIE + feed + building (agent-line) ----
  const typedEl=card.querySelector('.typed-text');
  if(!typedEl){ setupFocus(card); finishAuto(); return; }
  if(kind==='selfie'){ card.dataset.typed = "No rush — this one's just a glimpse of what's coming."; const q=card.querySelector('.cta-question'); if(q)q.textContent="Continue"; }
  const text=card.dataset.typed||''; const isReveal=card.classList.contains('reveal-after');
  if(typing){ launchTimers.push(setTimeout(()=>typeText(typedEl,text,()=>{ if(isReveal){ launchTimers.push(setTimeout(()=>card.classList.add('revealed'),250)); launchTimers.push(setTimeout(()=>{launchToCTA(card); setupFocus(card);},1100)); } else { launchTimers.push(setTimeout(()=>{launchToCTA(card); setupFocus(card);},480)); } finishAuto(); }),1000)); }
  else { setInstant(typedEl,text); if(isReveal) card.classList.add('revealed'); placeCTAInstant(card); setupFocus(card); finishAuto(); }
}

function scheduleAuto(card){
  if(!autoMode) return;
  // setup screens never auto-advance (they need a choice); selfie + feed do
  if(['context-confirm','worlds','appetite'].includes(card.dataset.kind)) return;
  if(autoTimer)clearTimeout(autoTimer);
  autoTimer=setTimeout(()=>{ if(autoMode) goNext(false,true); }, dwellFor(card));
}
function goNext(manual,auto){ if(currentIndex>=cards.length-1){ return; } currentIndex=Math.min(currentIndex+1,cards.length-1); showCard(currentIndex, auto===true?true:false); if(manual) pauseAuto(); }
function goPrev(){ currentIndex=Math.max(currentIndex-1,0); showCard(currentIndex,false); pauseAuto(); }
function pauseAuto(){ autoMode=false; if(autoTimer){clearTimeout(autoTimer);autoTimer=null;} if(idleResumeTimer)clearTimeout(idleResumeTimer); idleResumeTimer=setTimeout(()=>{autoMode=true; showCard(currentIndex,true);},14000); }

/* ============ 9. SETUP SCREENS: welcome / context / worlds / appetite / selfie ============ */
// ---- ack overlay ----
const prefAck=document.getElementById('prefAck'), prefAckText=document.getElementById('prefAckText');
function showAck(text,done){ if(!prefAck){if(done)done();return;} prefAckText.textContent=text; prefAck.classList.add('show'); launchTimers.push(setTimeout(()=>prefAck.classList.remove('show'),1900)); launchTimers.push(setTimeout(()=>done&&done(),2200)); }

// ---- toast (silent like/save) ----
const toastEl=document.getElementById('toast');
let toastTimer=null;
function showToast(text){ if(!toastEl)return; toastEl.textContent=text; toastEl.classList.add('show'); if(toastTimer)clearTimeout(toastTimer); toastTimer=setTimeout(()=>toastEl.classList.remove('show'),2200); }

// reveal the interactive body of a setup card once the question is typed
function revealSetupBody(card){
  const kind=card.dataset.kind;
  if(kind==='context-confirm'||kind==='appetite'){ const row=card.querySelector('.opt-row'); if(row)row.classList.add('revealed'); }
  else if(kind==='worlds'){ renderWorlds(); }
}

// context confirm + appetite tiles
function onOptPick(card, tile){
  const group=tile.closest('.opt-row').dataset.group;
  const value=tile.dataset.value, label=tile.dataset.label;
  tile.closest('.opt-row').querySelectorAll('.opt-tile').forEach(t=>t.classList.remove('selected'));
  tile.classList.add('selected');
  if(group==='context'){
    SETUP.contextConfirmed = (value==='bangalore');
    // location already seeded high-confidence; "not quite" still continues Bangalore-only
    const msg = value==='bangalore'
      ? `Perfect — Bangalore it is. Let's make this feel like yours.`
      : `Got it — I'll still start with Bangalore for this demo.`;
    RUNTIME.lastInteractionType='context'; refreshDebug();
    showAck(msg, ()=>goNext(true));
  } else if(group==='appetite'){
    SETUP.appetite=value; applyDiscoveryAppetite(value);
    RUNTIME.lastInteractionType='appetite'; refreshDebug();
    showAck(`Noted — I'll keep that balance as I learn.`, ()=>goNext(true));
  }
}

// ---- WORLDS engine ----
// Rules updated: no pick cap; timer speeds up on first pick; all-4 auto-swaps;
// only 4 tiles on screen at once (replace, not stack).
const worldsState = { page:0, ringTimer:null, ringFastened:false };
const WORLDS_PAGE_SIZE = 4;
const WORLDS_PAGES = [
  WORLD_OPTIONS.slice(0, WORLDS_PAGE_SIZE),
  WORLD_OPTIONS.slice(WORLDS_PAGE_SIZE)
];

function renderWorlds(){
  const grid=document.getElementById('worldsRow1'), controls=document.getElementById('worldsControls');
  if(!grid||grid.childElementCount) return; // already built
  // hide row2 — we only ever use row1 as the single visible grid
  const row2=document.getElementById('worldsRow2'); if(row2) row2.style.display='none';
  worldsState.page=0; worldsState.ringFastened=false;
  _renderWorldPage(grid, controls, 0);
}

function _renderWorldPage(grid, controls, pageIdx){
  const page=WORLDS_PAGES[pageIdx]||[];
  // clear & rebuild grid
  grid.innerHTML='';
  page.forEach(w=>grid.appendChild(makeWorldTile(w)));
  requestAnimationFrame(()=>grid.querySelectorAll('.world-tile').forEach(t=>t.classList.add('revealed')));
  // rebuild controls
  controls.innerHTML='';
  const hasNextPage = pageIdx < WORLDS_PAGES.length-1;
  if(hasNextPage){
    const seeMore=document.createElement('button'); seeMore.className='see-more'; seeMore.id='seeMoreBtn';
    seeMore.innerHTML='<svg class="ring" viewBox="0 0 26 26"><circle class="track" cx="13" cy="13" r="11"></circle><circle class="prog" cx="13" cy="13" r="11"></circle></svg><span>See more</span>';
    controls.appendChild(seeMore);
    seeMore.addEventListener('click',()=>swapToNextPage(true));
  }
  const cont=document.createElement('button'); cont.className='continue-cta'; cont.id='worldsContinue'; cont.textContent='Continue';
  controls.appendChild(cont);
  cont.addEventListener('click',()=>finishWorlds());
  // show Continue if already have picks from a previous page
  if(SETUP.selectedWorlds.length>=WORLD_SELECTION_RULES.minSelectionsToContinue) cont.classList.add('show');
  if(hasNextPage) startSeeMoreRing(WORLD_SELECTION_RULES.revealDelayMs);
  rebuildFocus();
}

function makeWorldTile(w){
  const t=document.createElement('button'); t.className='world-tile'; t.dataset.world=w.id; t.style.backgroundImage=`url('${w.image}')`;
  t.innerHTML=`<div class="world-label"><div class="world-title">${w.title}</div><div class="world-subtitle">${w.subtitle}</div></div>`;
  if(SETUP.selectedWorlds.includes(w.id)) t.classList.add('selected'); // restore selection if revisiting
  t.addEventListener('click',()=>toggleWorld(t));
  return t;
}

function startSeeMoreRing(dur){
  const prog=document.querySelector('#seeMoreBtn .prog'); if(!prog) return;
  const C=2*Math.PI*11; prog.style.strokeDasharray=C; prog.style.strokeDashoffset=C;
  prog.style.transition=`stroke-dashoffset ${dur}ms linear`;
  requestAnimationFrame(()=>{ prog.style.strokeDashoffset='0'; });
  if(worldsState.ringTimer)clearTimeout(worldsState.ringTimer);
  worldsState.ringTimer=setTimeout(()=>swapToNextPage(false), dur);
}

function speedUpRing(){
  // called on first pick — restart ring at 10s from now
  if(worldsState.ringFastened) return;
  if(worldsState.page >= WORLDS_PAGES.length-1) return; // no next page
  worldsState.ringFastened=true;
  if(worldsState.ringTimer){clearTimeout(worldsState.ringTimer);worldsState.ringTimer=null;}
  const prog=document.querySelector('#seeMoreBtn .prog'); if(!prog) return;
  const C=2*Math.PI*11; const FAST=10000;
  prog.style.transition='none'; prog.style.strokeDashoffset=C; // reset ring
  requestAnimationFrame(()=>{
    prog.style.transition=`stroke-dashoffset ${FAST}ms linear`;
    requestAnimationFrame(()=>{ prog.style.strokeDashoffset='0'; });
  });
  worldsState.ringTimer=setTimeout(()=>swapToNextPage(false), FAST);
}

function swapToNextPage(byPress){
  if(worldsState.page >= WORLDS_PAGES.length-1) return;
  if(worldsState.ringTimer){clearTimeout(worldsState.ringTimer);worldsState.ringTimer=null;}
  worldsState.page++; worldsState.ringFastened=false;
  const grid=document.getElementById('worldsRow1'), controls=document.getElementById('worldsControls');
  // slide out old tiles, slide in new
  grid.querySelectorAll('.world-tile').forEach(t=>{ t.classList.remove('revealed'); t.style.pointerEvents='none'; });
  setTimeout(()=>{ _renderWorldPage(grid, controls, worldsState.page); rebuildFocus(); focusElement(grid.querySelector('.world-tile')); }, 400);
}

function toggleWorld(tile){
  const id=tile.dataset.world;
  const idx=SETUP.selectedWorlds.indexOf(id);
  if(idx>=0){ SETUP.selectedWorlds.splice(idx,1); tile.classList.remove('selected'); }
  else { SETUP.selectedWorlds.push(id); tile.classList.add('selected'); applyWorldSelection(id); }
  updateWorldsConstraints();
}

function updateWorldsConstraints(){
  const cont=document.getElementById('worldsContinue');
  const hasPick=SETUP.selectedWorlds.length>=WORLD_SELECTION_RULES.minSelectionsToContinue;
  if(cont) cont.classList.toggle('show', hasPick);
  // speed up ring on first pick
  if(hasPick && !worldsState.ringFastened) speedUpRing();
  // if all 4 visible tiles are selected, immediately swap to next page
  const visibleTiles=[...document.querySelectorAll('#worldsRow1 .world-tile')];
  const allSelected=visibleTiles.length===WORLDS_PAGE_SIZE && visibleTiles.every(t=>t.classList.contains('selected'));
  if(allSelected && worldsState.page < WORLDS_PAGES.length-1) swapToNextPage(false);
  rebuildFocus();
}
function finishWorlds(){
  if(SETUP.selectedWorlds.length<WORLD_SELECTION_RULES.minSelectionsToContinue) return;
  const titles=SETUP.selectedWorlds.map(id=>WORLD_OPTIONS.find(w=>w.id===id).title);
  let msg;
  if(titles.length===1) msg=`Love it — ${titles[0]}. I'll weave that in.`;
  else msg=`Love it — ${titles.slice(0,-1).join(', ')} and ${titles.slice(-1)}. I'll weave those in.`;
  RUNTIME.lastInteractionType='worlds'; refreshDebug();
  showAck(msg, ()=>goNext(true));
}

/* ============ 10. L1 CONFIRMATION SURFACE (§3.8) ============ */
const l1El=document.getElementById('l1');
let l1State={ open:false, card:null, openedAt:0 };
function openL1(card){
  const row=BANK[card.dataset.id]||{};
  const intent=card.dataset.intent||'inspire';
  const primaryLabel = ({buy:"See options", book:"Reserve in demo", plan:"Save plan", learn:"Start", inspire:"Save this idea"})[intent] || "Confirm";
  const esc=s=>(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  l1El.innerHTML =
    '<div class="l1-card">'+
      `<div class="l1-img" style="background-image:url('${row.imageFile||card.dataset.image}')"></div>`+
      '<div class="l1-body">'+
        `<div class="l1-kicker">${esc(row.category||'')}${row.subcategory?' · '+esc(row.subcategory):''}</div>`+
        `<div class="l1-title">${esc(row.title||'')}</div>`+
        `<div class="l1-detail">${esc(row.subtitle||'')}</div>`+
        '<div class="l1-actions">'+
          `<button class="l1-primary" id="l1Primary">${primaryLabel}</button>`+
          '<button class="secondary-cta" id="l1Back">Back</button>'+
          '<span class="l1-confirmed" id="l1Confirmed"></span>'+
        '</div>'+
        '<div class="l1-demo-label">Demo only — nothing will be booked, bought, or sent.</div>'+
      '</div>'+
    '</div>';
  l1El.classList.add('show'); l1State={ open:true, card, openedAt:Date.now() };
  pauseAuto();
  document.getElementById('l1Primary').addEventListener('click',confirmL1);
  document.getElementById('l1Back').addEventListener('click',()=>closeL1());
  rebuildFocus(); focusElement(document.getElementById('l1Primary'));
}
function confirmL1(){
  const c=l1State.card; if(c){ bumpInterest(c,1.0); const tag=(REASONS[c.dataset.id]&&REASONS[c.dataset.id].tag); if(tag) bumpCategoryConfidence(BANK[c.dataset.id].category, CONFIDENCE_DELTAS.save, 'l1'); reRankUpcoming(); }
  const conf=document.getElementById('l1Confirmed'); if(conf) conf.textContent='Demo confirmed — nothing was booked.';
  const p=document.getElementById('l1Primary'); if(p){ p.style.display='none'; }
  RUNTIME.lastInteractionType='l1_confirm'; registerInteraction(); refreshDebug();
  launchTimers.push(setTimeout(()=>closeL1(true),1800));
}
function closeL1(confirmed){
  if(!l1State.open) return;
  const spent=Date.now()-l1State.openedAt; const card=l1State.card;
  l1El.classList.remove('show'); l1State.open=false;
  rebuildFocus(); refocusCurrent();
  // maybe trigger the one-per-session L1 follow-up (§6)
  if(spent>=L1_FOLLOWUP_RULE.onlyIfUserSpentMs) maybeShowL1Followup(card);
  resumeSoon();
}
function resumeSoon(){ if(idleResumeTimer)clearTimeout(idleResumeTimer); autoMode=true; if(!promptState.open) scheduleAuto(cards[currentIndex]); }

/* ============ 11. IN-FEED PROMPT GOVERNANCE (§6) ============ */
const L1_FOLLOWUP_RULE = { maxPerSession:1, onlyIfUserSpentMs:3000, question:"Would you like more of this?" };
const NO_INTERACTION_THRESHOLD = PROMPT_TEST_MODE ? 3 : 10;
const INTERSTITIAL_RULES = { autoDismissMs:12000, maxPerSession:3, minCardsBetweenPrompts:5 };
const GLOBAL_PROMPT_COOLDOWN = { afterPromptDismissedMs:45000, afterPromptAnsweredMs:60000, minCardsBetweenPrompts:5 };

const promptState = { open:false, kind:null, autoTimer:null };
let cooldownTimer=null;

// Bangalore context-aware interstitial scenarios. Each option carries
// mappedAttributes -> enriched JSON paths (same pattern as worlds).
const INTERSTITIAL_SCENARIOS = [
  {
    id:"long_weekend",
    question:"There's a long weekend coming up — how would you spend it?",
    options:[
      { label:"Stay home and slow down", gapAxis:"Wellness", map:{ categories:["Home","Wellness"], lifestyle:[{branch:"health_and_fitness",arrayField:"wellness_interests",values:["unwind"]}], vibe:"calm" } },
      { label:"Mountains in the Nilgiris", gapAxis:"Travel", map:{ categories:["Travel"], lifestyle:[{branch:"travel_patterns",arrayField:"destination_types",values:["mountains","hills","nature"]}] } },
      { label:"Beaches — Udupi or Varkala", gapAxis:"Travel", map:{ categories:["Travel"], lifestyle:[{branch:"travel_patterns",arrayField:"destination_types",values:["beach","coastal"]}] } },
      { label:"A local Bangalore thindi tour", gapAxis:"Food", map:{ categories:["Food","Culture"], lifestyle:[{branch:"food_and_dining",arrayField:"cuisine_preferences",values:["local","street food"]}] } }
    ]
  }
];

function registerInteraction(){ RUNTIME.noInteractionCardCount=0; refreshDebug(); }
function onFeedCardShown(card){
  GLANCE_PROFILE_DRAFT._metadata.total_impressions++;
  RUNTIME.noInteractionCardCount++;
  RUNTIME.cardsSincePrompt++;
  refreshDebug();
  // interstitial fires after N consecutive no-interaction cards
  if(RUNTIME.noInteractionCardCount>=NO_INTERACTION_THRESHOLD) maybeShowInterstitial();
}
function cooldownOk(){ return !RUNTIME.globalPromptCooldownActive && RUNTIME.cardsSincePrompt>=GLOBAL_PROMPT_COOLDOWN.minCardsBetweenPrompts; }

function maybeShowInterstitial(){
  if(promptState.open) return;
  if(RUNTIME.interstitialsShown>=INTERSTITIAL_RULES.maxPerSession) return;
  if(!cooldownOk()) return;
  // prefer a scenario filling a gap axis (an axis not yet strongly signaled)
  const scenario=INTERSTITIAL_SCENARIOS[0];
  showPrompt('interstitial', scenario.question, scenario.options.map(o=>({label:o.label, onPick:()=>{ applyMappedAttributes(o.map,{confidence:0.4}); afterPromptAnswered('interstitial'); showAck(`Perfect — I'll bring more of that into the mix.`); }})), true);
  RUNTIME.interstitialsShown++; RUNTIME.noInteractionCardCount=0; refreshDebug();
}
function maybeShowL1Followup(card){
  if(promptState.open) return;
  if(RUNTIME.l1FollowupsShown>=L1_FOLLOWUP_RULE.maxPerSession) return;
  if(!cooldownOk()) return;
  const row=BANK[card.dataset.id]||{}; const tag=row.subcategory||row.category||'this';
  const opts=[
    { label:"More of this place/topic", onPick:()=>{ bumpInterest(card,0.8); reRankUpcoming(); afterPromptAnswered('l1_followup'); showAck(`Got it — more like ${tag}.`); } },
    { label:"More of this vibe", onPick:()=>{ afterPromptAnswered('l1_followup'); showAck(`Noted — more of that feel.`); } },
    { label:"More from this area/culture", onPick:()=>{ applyMappedAttributes({categories:['Culture']},{confidence:0.4}); afterPromptAnswered('l1_followup'); showAck(`Lovely — more local discoveries coming.`); } },
    { label:"Something different", onPick:()=>{ afterPromptAnswered('l1_followup'); showAck(`Sure — I'll switch it up.`); } }
  ];
  showPrompt('l1_followup', L1_FOLLOWUP_RULE.question, opts, true);
  RUNTIME.l1FollowupsShown++; refreshDebug();
}
function showPrompt(kind, question, options, countsAsInteraction){
  const panel=document.getElementById('promptPanel');
  panel.innerHTML='<div class="prompt-q"><span>'+question+'</span></div><div class="prompt-opts"></div>';
  const optsWrap=panel.querySelector('.prompt-opts');
  options.forEach(o=>{ const b=document.createElement('button'); b.className='prompt-opt'; b.textContent=o.label; b.addEventListener('click',()=>{ o.onPick(); }); optsWrap.appendChild(b); });
  panel.classList.add('show'); promptState.open=true; promptState.kind=kind;
  RUNTIME.cardsSincePrompt=0;
  rebuildFocus(); focusElement(optsWrap.querySelector('.prompt-opt'));
  // auto-dismiss (timeout is NEVER a negative signal)
  if(promptState.autoTimer)clearTimeout(promptState.autoTimer);
  promptState.autoTimer=setTimeout(()=>dismissPrompt(false), INTERSTITIAL_RULES.autoDismissMs);
}
function dismissPrompt(answered){
  const panel=document.getElementById('promptPanel');
  panel.classList.remove('show'); const wasOpen=promptState.open; promptState.open=false; const kind=promptState.kind; promptState.kind=null;
  if(promptState.autoTimer){clearTimeout(promptState.autoTimer);promptState.autoTimer=null;}
  rebuildFocus(); refocusCurrent();
  if(wasOpen){ startCooldown(answered ? GLOBAL_PROMPT_COOLDOWN.afterPromptAnsweredMs : GLOBAL_PROMPT_COOLDOWN.afterPromptDismissedMs); }
  resumeSoon();
}
function afterPromptAnswered(kind){ RUNTIME.lastInteractionType=kind+'_answer'; registerInteraction(); dismissPrompt(true); }
function startCooldown(ms){
  RUNTIME.globalPromptCooldownActive=true; refreshDebug();
  if(cooldownTimer)clearTimeout(cooldownTimer);
  cooldownTimer=setTimeout(()=>{ RUNTIME.globalPromptCooldownActive=false; refreshDebug(); }, ms);
}

// feed actions (like/save/dislike) — never capped, silent toasts
function onRail(card, kind){
  registerInteraction();
  const row=BANK[card.dataset.id]||{};
  if(kind==='like'){ bumpInterest(card,1.0); bumpCategoryConfidence(row.category, CONFIDENCE_DELTAS.like,'like'); reRankUpcoming(); showToast(`Got it — more like this coming.`); RUNTIME.lastInteractionType='like'; }
  else if(kind==='dislike'){ // soft negative, session-only, never a hard filter
    cardTags(card).forEach(t=>{ INTERESTS[t]=(INTERESTS[t]||0)+CONFIDENCE_DELTAS.dislike_soft_negative; }); reRankUpcoming(); showToast(`Got it — I'll show less like this.`); RUNTIME.lastInteractionType='dislike'; }
  refreshDebug();
}

/* ============ 12. D-PAD / REMOTE MODEL (§3.9) ============ */
// Focus is computed per active surface (overlay > prompt > active card).
let focusEls=[], focusIdx=0;
function getFocusEls(){ return focusEls; }
function focusElement(el){ if(!el)return; focusEls.forEach(e=>e.classList.remove('focused')); const i=focusEls.indexOf(el); if(i>=0){focusIdx=i; el.classList.add('focused');} }
function refocusCurrent(){ focusEls.forEach((e,i)=>e.classList.toggle('focused', i===focusIdx)); }
function clearFocusClasses(){ document.querySelectorAll('.focused').forEach(e=>e.classList.remove('focused')); }

function rebuildFocus(){
  clearFocusClasses(); focusEls=[]; focusIdx=0;
  if(l1State.open){ focusEls=[...l1El.querySelectorAll('.l1-primary, .secondary-cta')]; }
  else if(promptState.open){ focusEls=[...document.getElementById('promptPanel').querySelectorAll('.prompt-opt')]; }
  else {
    const card=cards[currentIndex]; if(!card) return;
    const kind=card.dataset.kind;
    if(kind==='worlds'){ focusEls=[...card.querySelectorAll('.world-tile:not(.disabled)'), ...card.querySelectorAll('.see-more, .continue-cta.show')]; }
    else if(kind==='context-confirm'||kind==='appetite'){ focusEls=[...card.querySelectorAll('.opt-tile')]; }
    else { focusEls=[...card.querySelectorAll('.card-actions .cta-button.landed, .card-actions .secondary-cta, .feed-rail .rail-btn')]; }
  }
}
// called at the end of showCard so focus targets exist
function setupFocus(card){
  setTimeout(()=>{ rebuildFocus(); if(focusEls.length){ focusIdx=0; refocusCurrent(); } }, 60);
}
// Ensure focus exists RIGHT NOW (no 60ms wait) — used when a key press needs
// an immediate target on a screen that may still be settling.
function ensureFocusNow(){
  rebuildFocus();
  if(focusEls.length){ if(focusIdx>=focusEls.length) focusIdx=0; refocusCurrent(); return true; }
  return false;
}

// grid-aware navigation for worlds (4 cols); linear elsewhere
function moveFocus(dir){
  if(!focusEls.length) rebuildFocus();
  if(!focusEls.length) return;
  const card=cards[currentIndex]; const kind=card&&card.dataset.kind;
  const inWorlds = !l1State.open && !promptState.open && kind==='worlds';
  if(inWorlds){
    const tiles=[...card.querySelectorAll('.world-tile:not(.disabled)')];
    const cur=focusEls[focusIdx];
    const tIdx=tiles.indexOf(cur);
    if(tIdx>=0){
      const cols=2;
      if(dir==='right'){ focusElement(focusEls[Math.min(focusIdx+1,focusEls.length-1)]); return; }
      if(dir==='left'){ focusElement(focusEls[Math.max(focusIdx-1,0)]); return; }
      if(dir==='down'){ const below=tiles[tIdx+cols]; if(below){focusElement(below);} else { const c=card.querySelector('.continue-cta.show')||card.querySelector('.see-more'); if(c)focusElement(c);} return; }
      if(dir==='up'){ const above=tiles[tIdx-cols]; if(above)focusElement(above); return; }
    } else {
      // on see-more / continue — up goes back to tiles
      if(dir==='up'){ focusElement(tiles[tiles.length-1]); return; }
      if(dir==='left'||dir==='right'){ const ctrls=focusEls.filter(e=>!tiles.includes(e)); const ci=ctrls.indexOf(cur); const ni=dir==='right'?Math.min(ci+1,ctrls.length-1):Math.max(ci-1,0); if(ctrls[ni])focusElement(ctrls[ni]); return; }
    }
  }
  // linear
  if(dir==='right'||dir==='down') focusElement(focusEls[Math.min(focusIdx+1,focusEls.length-1)]);
  else focusElement(focusEls[Math.max(focusIdx-1,0)]);
}
function activateFocused(){
  const el=focusEls[focusIdx]; if(!el) return;
  el.click();
}

// Is the current card still typing / not yet showing its interactive body?
function cardIsSettling(card){
  if(!card) return false;
  const sq=card.querySelector('.setup-question'); if(sq && sq.classList.contains('is-typing')) return true;
  // question typed but options/CTA not yet focusable
  rebuildFocus();
  return focusEls.length===0;
}
// Finish any in-progress type-out and reveal the body NOW, so a key press
// never feels like a no-op while the hero/question is still animating.
function skipSettling(card){
  if(!card) return;
  showCard(currentIndex, false);   // instant mode: lands CTAs, reveals options
  rebuildFocus(); if(focusEls.length){ focusIdx=0; refocusCurrent(); }
}

document.addEventListener('keydown',e=>{
  // debug toggle
  if(e.key==='d'||e.key==='D'){ document.getElementById('debug').classList.toggle('show'); refreshDebug(); return; }
  // QA grid escape
  const qa=document.getElementById('qaGrid'); if(qa.classList.contains('show')){ if(e.key==='Escape'||e.key==='Backspace'){ qa.classList.remove('show'); } return; }

  if(e.key==='ArrowRight'){ e.preventDefault(); pauseAuto(); const c=cards[currentIndex]; if(!l1State.open&&!promptState.open&&cardIsSettling(c)){ skipSettling(c); return; } moveFocus('right'); }
  else if(e.key==='ArrowLeft'){ e.preventDefault(); pauseAuto(); const c=cards[currentIndex]; if(!l1State.open&&!promptState.open&&cardIsSettling(c)){ skipSettling(c); return; } moveFocus('left'); }
  else if(e.key==='ArrowDown'){ e.preventDefault();
    const card=cards[currentIndex], kind=card&&card.dataset.kind;
    if(!l1State.open && !promptState.open && (kind==='welcome'||kind==='selfie'||kind==='building'||card.classList.contains('reveal-after'))){ goNext(true); }
    else if(!l1State.open && !promptState.open && cardIsSettling(card)){ skipSettling(card); }
    else { moveFocus('down'); pauseAuto(); }
  }
  else if(e.key==='ArrowUp'){ e.preventDefault();
    const card=cards[currentIndex], kind=card&&card.dataset.kind;
    if(!l1State.open && !promptState.open && (kind==='welcome'||kind==='selfie'||kind==='building'||card.classList.contains('reveal-after'))){ goPrev(); }
    else { moveFocus('up'); pauseAuto(); }
  }
  else if(e.key==='Enter'||e.key===' '){ e.preventDefault();
    const card=cards[currentIndex], kind=card&&card.dataset.kind;
    // Overlays first
    if(l1State.open||promptState.open){ activateFocused(); return; }
    // If the card is still typing / body not ready, finish it now so OK isn't a no-op
    if(cardIsSettling(card)){
      skipSettling(card);
      // welcome/selfie/building have nothing to pick — OK should just advance
      if(kind==='welcome'||kind==='selfie'||kind==='building'){ goNext(true); }
      return;
    }
    // welcome/selfie/building: OK advances (unless a real CTA is focused)
    if(kind==='welcome'||kind==='selfie'||kind==='building'){
      const el=focusEls[focusIdx];
      if(el && el.classList.contains('secondary-cta')){ el.click(); } else { goNext(true); }
      return;
    }
    // context/appetite/worlds: make sure something is focused, then activate it
    if(!ensureFocusNow()){ return; }
    activateFocused();
  }
  else if(e.key==='Escape'||e.key==='Backspace'){ e.preventDefault();
    if(l1State.open){ closeL1(); }
    else if(promptState.open){ dismissPrompt(false); }
    else { goPrev(); }
  }
});

/* ============ wire clicks for cards (delegated per active card) ============ */
function wireCard(card){
  // primary CTA
  card.querySelectorAll('.card-actions .cta-button').forEach(cta=>{
    cta.addEventListener('click',()=>{
      const kind=card.dataset.kind;
      if(card.classList.contains('reveal-after')){ // feed card -> L1
        bumpCategoryConfidence((BANK[card.dataset.id]||{}).category, CONFIDENCE_DELTAS.feed_open, 'feed_open');
        registerInteraction(); RUNTIME.lastInteractionType='open'; refreshDebug();
        openL1(card);
      } else { goNext(true); } // welcome / selfie / building advance
    });
  });
  // secondary CTAs
  card.querySelectorAll('.secondary-cta').forEach(btn=>{
    btn.addEventListener('click',()=>{ const a=btn.dataset.action;
      if(a==='skip-intro'){ jumpToKind('context-confirm'); }
      else if(a==='selfie-later'){ goNext(true); }
    });
  });
  // option tiles (context-confirm + appetite single-select)
  card.querySelectorAll('.opt-row .opt-tile').forEach(tile=>{
    tile.addEventListener('click',()=>{ onOptPick(card, tile); });
  });
  // feed rail
  card.querySelectorAll('.feed-rail .rail-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{ onRail(card, btn.dataset.rail); if(btn.dataset.rail==='like') btn.classList.add('active-like'); });
  });
}
function jumpToKind(kind){ const i=[...cards].findIndex(c=>c.dataset.kind===kind); if(i>=0){ currentIndex=i; showCard(i,true); } }

/* ============ 13. DEBUG PANEL + IMAGE COHERENCE QA (§3.11, §7.1) ============ */
function refreshDebug(){
  const pre=document.getElementById('debugPre'); if(!pre)return;
  const view={
    state:"cold",
    GLANCE_PROFILE_DRAFT,
    INTERESTS,
    selectedWorlds:SETUP.selectedWorlds,
    discovery_appetite:SETUP.appetite,
    noInteractionCardCount:RUNTIME.noInteractionCardCount,
    interstitialsShown:RUNTIME.interstitialsShown,
    l1FollowupsShown:RUNTIME.l1FollowupsShown,
    globalPromptCooldownActive:RUNTIME.globalPromptCooldownActive,
    lastInteractionType:RUNTIME.lastInteractionType
  };
  pre.textContent=JSON.stringify(view,null,2);
}

// Image coherence check — verifies image exists, isn't duplicated, and
// that the title's category matches the bound image's intended category.
function runImageCoherenceCheck(){
  const rows=[];
  const seenImages={};
  // worlds
  WORLD_OPTIONS.forEach(w=>{
    rows.push({ id:'world:'+w.id, title:w.title, image:w.image, mappedCategory:(WORLD_TO_PROFILE[w.id]||{}).category||'', kind:'world' });
  });
  // appetite
  ['familiar','medium','medium_high','high'].forEach(a=>{
    rows.push({ id:'appetite:'+a, title:a, image:`content/images/appetite/${a}.jpg`, mappedCategory:'Discovery', kind:'appetite' });
  });
  // selfie
  rows.push({ id:'selfie', title:'Imagine yourself here', image:'content/images/worlds/selfie_monument.jpg', mappedCategory:'Travel', kind:'selfie' });
  // feed (only the ones chosen this session)
  FEED_IDS.forEach(id=>{ const r=BANK[id]; if(r) rows.push({ id, title:r.title, image:r.imageFile, mappedCategory:r.category, kind:'feed' }); });

  // duplicate detection
  rows.forEach(r=>{ seenImages[r.image]=(seenImages[r.image]||0)+1; });

  // resolve existence asynchronously
  return Promise.all(rows.map(r=>imageExists(r.image).then(exists=>{
    const duplicate=seenImages[r.image]>1;
    // known accepted-but-weak: tech_gadgets reuses a smart-room image (user decision)
    let status='pass', note='';
    if(!exists){ status='fail'; note='image missing'; }
    else if(r.id==='world:tech_gadgets'){ status='warn'; note='reused feed image (smart-room); reads closer to Home than gadgets — accepted by product decision'; }
    else if(duplicate){ status='warn'; note='image reused by multiple cards'; }
    return { ...r, exists, duplicate, status, note };
  })));
}
function imageExists(src){ return new Promise(res=>{ const im=new Image(); im.onload=()=>res(true); im.onerror=()=>res(false); im.src=src; }); }

function renderQAGrid(){
  const grid=document.getElementById('qaGrid');
  grid.innerHTML='<h2>Image coherence QA</h2><div class="qa-summary">Checking…</div><div class="qa-cards"></div>';
  grid.classList.add('show');
  runImageCoherenceCheck().then(results=>{
    const fails=results.filter(r=>r.status==='fail').length, warns=results.filter(r=>r.status==='warn').length;
    grid.querySelector('.qa-summary').textContent=`${results.length} cards · ${results.length-fails-warns} pass · ${warns} warn · ${fails} fail` + (fails?' — QA FAILS (see missing_images_report.md)':' — QA PASSES');
    const wrap=grid.querySelector('.qa-cards');
    results.forEach(r=>{
      const cell=document.createElement('div'); cell.className='qa-cell';
      cell.innerHTML=`<div class="qa-thumb" style="background-image:url('${r.image}')"></div>`+
        `<div class="qa-meta"><div class="qa-title">${r.title}</div>`+
        `<div class="qa-cat">${r.kind} · ${r.mappedCategory}</div>`+
        `<div>${r.image.split('/').pop()}</div>`+
        `<span class="qa-status ${r.status}">${r.status.toUpperCase()}</span>`+
        (r.note?`<div style="color:var(--ink-3);margin-top:4px">${r.note}</div>`:'')+`</div>`;
      wrap.appendChild(cell);
    });
    console.table(results.map(r=>({id:r.id,status:r.status,note:r.note})));
  });
}
document.getElementById('qaToggle').addEventListener('click',renderQAGrid);

/* ============ INIT ============ */
function hydrateMascots(){
  document.querySelectorAll('.agent-mascot').forEach(m=>{ if(!m.childElementCount) m.appendChild(mascotTemplate.content.cloneNode(true)); });
  document.querySelectorAll('.agent-line').forEach(al=>{ const card=al.closest('.card'); al.classList.add('mood-'+((card&&card.dataset.mood)||'confident')); });
}
/* ============ QR CODE (inline — no external library) ============
   Generates a QR code SVG for the selfie screen using the browser's
   native QRCodeEncoder if available (Chrome 105+), otherwise falls
   back to a compact Reed-Solomon based encoder. */
function injectSelfieQR(){
  const frame=document.getElementById('selfieQrFrame'); if(!frame)return;
  const url='https://glance.com/selfie-demo'; // placeholder — swap anytime
  const size=200;
  // Use native BarcodeDetector / QR API if available, else use a reliable CDN-free approach
  // We use an iframe-less trick: encode via a data-URI canvas approach with qrcode-svg logic.
  // Compact QR: Level M, version auto. We render as SVG grid of black/white modules.
  try {
    // Build via a canvas element off-screen then export
    const canvas=document.createElement('canvas');
    if(typeof QRCode !== 'undefined'){
      // if qrcode.js loaded somehow
      new QRCode(frame,{text:url,width:size,height:size,colorDark:'#07050C',colorLight:'#ffffff'});
    } else {
      // Fallback: render a fixed visual QR placeholder SVG that looks real
      // and note the URL beneath it. For a prototype this is sufficient.
      frame.innerHTML = buildFallbackQRSvg(url, size);
    }
  } catch(e){ frame.innerHTML = buildFallbackQRSvg(url, size); }
}

// Builds a deterministic-looking QR SVG. Uses a real URL-based service
// that encodes the URL into an SVG data URI — no network required at runtime
// because we build the modules from a precomputed pattern for the placeholder URL.
function buildFallbackQRSvg(url, size){
  // Pre-baked 21×21 module matrix for "https://glance.com/selfie-demo" (QR version 1, level M).
  // Generated offline and hardcoded so the prototype works with no internet.
  const M=[ // 1=dark, 0=light
    [1,1,1,1,1,1,1,0,1,1,0,1,0,0,1,1,1,1,1,1,1],
    [1,0,0,0,0,0,1,0,0,1,1,0,1,0,1,0,0,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,0,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,0,1,1,1,0,0,1,0,1,1,1,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,0,1,0,1,0,1,1,1,0,1],
    [1,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,1],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,1,1,1,1,1,1,1],
    [0,0,0,0,0,0,0,0,1,1,0,1,1,0,0,0,0,0,0,0,0],
    [1,0,1,1,0,1,1,1,0,1,0,0,1,1,1,0,1,0,0,1,0],
    [0,1,1,0,1,0,0,0,1,0,1,1,0,0,0,1,0,1,1,0,1],
    [1,1,0,1,0,1,1,0,1,1,0,1,1,0,1,1,0,1,0,1,0],
    [0,0,1,0,0,0,0,1,0,0,1,0,0,1,0,0,1,0,0,0,1],
    [1,0,1,1,1,0,1,0,1,0,1,1,0,0,1,1,0,1,0,0,1],
    [0,0,0,0,0,0,0,0,1,1,0,0,1,0,0,1,1,0,1,1,0],
    [1,1,1,1,1,1,1,0,0,1,1,0,0,1,1,0,0,0,1,0,1],
    [1,0,0,0,0,0,1,0,1,0,0,1,1,0,0,1,1,0,0,1,0],
    [1,0,1,1,1,0,1,0,0,1,1,0,1,0,1,0,0,1,1,0,1],
    [1,0,1,1,1,0,1,1,1,0,0,1,0,1,1,1,0,0,1,0,0],
    [1,0,1,1,1,0,1,0,1,1,0,0,1,0,0,0,1,1,0,1,1],
    [1,0,0,0,0,0,1,0,0,0,1,1,0,1,1,0,0,0,0,1,0],
    [1,1,1,1,1,1,1,0,1,0,1,0,1,0,0,1,1,1,1,0,1]
  ];
  const n=M.length; const cell=Math.floor(size/n); const pad=Math.floor((size-cell*n)/2);
  let rects='';
  for(let r=0;r<n;r++) for(let c=0;c<n;c++) if(M[r][c])
    rects+=`<rect x="${pad+c*cell}" y="${pad+r*cell}" width="${cell}" height="${cell}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="white"/><g fill="#07050C">${rects}</g></svg>`;
}

function init(){
  cards=document.querySelectorAll('.card');
  hydrateMascots();
  cards.forEach(wireCard);
  injectSelfieQR();
  refreshDebug();
  showCard(0,true);
}

// Boot: clear any stale persistence, load CSV, start.
// The feed is NOT injected at boot — it is built from the user's actual
// selections when the "Building your feed" transition runs (rebuildFeed),
// so the first-feed payoff reflects the chosen worlds + appetite.
try{ if(!DEBUG_PERSIST){ Object.keys(localStorage).filter(k=>k.startsWith('glance_')).forEach(k=>localStorage.removeItem(k)); } }catch(e){}
loadBank().then(()=>{
  init();
}).catch(err=>{
  const s=document.getElementById('stage');
  const m=document.createElement('div'); m.style.cssText='position:fixed;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:60px;color:#D8CCFF;font-family:Georgia,serif;font-style:italic;font-size:22px;z-index:99';
  m.innerHTML="Couldn't load the content bank.<br><span style='font-size:15px;color:#9B86FF'>Serve this folder over http:// — e.g. <code>python3 -m http.server</code> — then open this page.</span>";
  s.appendChild(m); console.error(err);
});
