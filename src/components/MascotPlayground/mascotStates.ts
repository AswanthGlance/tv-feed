/* ─────────────────────────────────────────────────────────────────────────────
   Mascot State Machine Data

   Defines every state, its 4 variants, the Disney principles at play,
   the emotion label, and the intended Samsung TV use case.

   These map to Rive states in G_Moscot_States.
   Until the .riv file is extended, the playground drives the existing
   3 states (idle / looking / loading) and simulates the rest via CSS.
   ───────────────────────────────────────────────────────────────────────────── */

export type StateCategory =
  | 'core-ai'
  | 'emotional'
  | 'samsung-tv'
  | 'delight';

export type Variant = {
  id: string;       // e.g. 'idle-a'
  label: string;    // e.g. 'A: Breathing + Blink'
  description: string;
  disneyPrinciples: string[];
  cssSuffix: string; // CSS animation class suffix applied during preview
};

export type MascotState = {
  id: string;
  label: string;
  category: StateCategory;
  emotion: string;
  useCase: string;
  riveState: string | null; // null = simulated via CSS only
  riveInput?: { type: 'boolean'; name: string; value: boolean } |
              { type: 'trigger'; name: string } |
              { type: 'play'; stateName: string };
  color: string;         // accent for the category chip
  variants: [Variant, Variant, Variant, Variant];
};

// ─── Category palette ────────────────────────────────────────────────────────
export const CATEGORY_META: Record<StateCategory, { label: string; color: string }> = {
  'core-ai':   { label: 'Core AI',    color: '#7C3AED' },
  'emotional': { label: 'Emotional',  color: '#0EA5E9' },
  'samsung-tv':{ label: 'Samsung TV', color: '#1C5CB8' },
  'delight':   { label: 'Delight',    color: '#10B981' },
};

// ─── All states ──────────────────────────────────────────────────────────────
export const MASCOT_STATES: MascotState[] = [

  // ── Core AI ────────────────────────────────────────────────────────────────
  {
    id: 'wake-up',
    label: 'Wake Up',
    category: 'core-ai',
    emotion: 'Alertness',
    useCase: 'TV powers on, assistant initialises',
    riveState: null,
    color: '#7C3AED',
    variants: [
      { id: 'wake-up-a', label: 'A: Rise from scale 0', description: 'Scale from 0.4 → 1.0 with spring overshoot. Eyes open on settle.', disneyPrinciples: ['Anticipation', 'Slow In / Slow Out', 'Overshoot & Settle'], cssSuffix: 'wake-a' },
      { id: 'wake-up-b', label: 'B: Glow bloom then reveal', description: 'Glow expands first, body fades in after. Light precedes form.', disneyPrinciples: ['Staging', 'Slow In / Slow Out'], cssSuffix: 'wake-b' },
      { id: 'wake-up-c', label: 'C: Gentle bob into frame', description: 'Body slides up from -10px, settles with a single bob.', disneyPrinciples: ['Follow Through', 'Overshoot & Settle'], cssSuffix: 'wake-c' },
      { id: 'wake-up-d', label: 'D: Spin then open', description: 'Rotates 180° from below, lands upright, glow pulses once.', disneyPrinciples: ['Appeal', 'Anticipation'], cssSuffix: 'wake-d' },
    ],
  },

  {
    id: 'idle',
    label: 'Idle',
    category: 'core-ai',
    emotion: 'Calm Presence',
    useCase: 'Waiting for command, ambient display',
    riveState: 'Idel _Eyeblink',
    riveInput: { type: 'boolean', name: 'Looking', value: false },
    color: '#7C3AED',
    variants: [
      { id: 'idle-a', label: 'A: Breathing + Blink', description: 'Default tall glowing eyes. Organic 3.6s breathing. Random blink — eyes scaleY → 0 and reopen. Subtle eye height micro-pulse.', disneyPrinciples: ['Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'idle-a' },
      { id: 'idle-b', label: 'B: Breathing + Sway', description: 'Eyes shift laterally with the ±2° body sway. Feels naturally aware. Blink on 3.5s mark.', disneyPrinciples: ['Follow Through', 'Overlapping Action'], cssSuffix: 'idle-b' },
      { id: 'idle-c', label: 'C: Breathing + Eye Dart', description: 'Eyes dart ±5px with a subtle scaleY squint on movement. Suggests attentive scanning. No brows or mouth.', disneyPrinciples: ['Appeal', 'Overlapping Action'], cssSuffix: 'idle-c' },
      { id: 'idle-d', label: 'D: Half-Height Eyes', description: 'Eyes at 72% height — relaxed, content. Slow 7s sway cycle. Blink through the reduced height back to the same.', disneyPrinciples: ['Follow Through', 'Slow In / Slow Out'], cssSuffix: 'idle-d' },
    ],
  },

  // ── New Core AI States (animated) ──────────────────────────────────────────
  {
    id: 'listening',
    label: 'Listening',
    category: 'core-ai',
    emotion: 'Attentiveness',
    useCase: 'Voice input active, user is speaking',
    riveState: 'Looking Around',
    riveInput: { type: 'boolean', name: 'Looking', value: true },
    color: '#7C3AED',
    variants: [
      { id: 'listen-a', label: 'A: Tall Eyes + Glow Pulse', description: 'Eyes grow to 122% height. Glow brightens in a slow triple-pulse. Tiny upward lift on entry. Blink on hold.', disneyPrinciples: ['Anticipation', 'Appeal', 'Slow In / Slow Out'], cssSuffix: 'listen-a' },
      { id: 'listen-b', label: 'B: Bounce + Wide Eyes + Hold', description: 'Anticipation squash → bounce up → eyes wide (128%). Glow pulses while holding attention.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through'], cssSuffix: 'listen-b' },
      { id: 'listen-c', label: 'C: Forward Lean + Wider Eyes', description: 'Body tips +3°. Eyes widen (120%) and slightly broaden. Breathing continues during lean. Blink at 2.2s.', disneyPrinciples: ['Appeal', 'Staging', 'Slow In / Slow Out'], cssSuffix: 'listen-c' },
      { id: 'listen-d', label: 'D: Attentive Sway', description: '±2.5° sway with eyes following. Eyes 118% throughout. Breathing overlay. Returns cleanly to REST.', disneyPrinciples: ['Follow Through', 'Overlapping Action', 'Appeal'], cssSuffix: 'listen-d' },
    ],
  },

  {
    id: 'speaking',
    label: 'Speaking',
    category: 'core-ai',
    emotion: 'Engagement',
    useCase: 'Reading out recommendation, voice response',
    riveState: null,
    color: '#7C3AED',
    variants: [
      { id: 'speak-a', label: 'A: Body Pulse', description: 'Rhythmic squash-and-stretch at speech cadence (0.55s). Glow pulses with each beat. Five pulses then idle breath.', disneyPrinciples: ['Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'speak-a' },
      { id: 'speak-b', label: 'B: Pulse + Blink', description: 'Speech pulses with natural blinks woven in at 1.6s and 3.1s. More conversational.', disneyPrinciples: ['Overlapping Action', 'Squash & Stretch'], cssSuffix: 'speak-b' },
      { id: 'speak-c', label: 'C: Pulse + Eye Movement', description: 'Each speech beat shifts gaze (right → centre → left). Eyes reinforce the conversational rhythm.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'speak-c' },
      { id: 'speak-d', label: 'D: Sway + Pulse', description: 'Slow ±2° sway with glow pulses on every speech beat. Warmest and most natural variant.', disneyPrinciples: ['Follow Through', 'Overlapping Action'], cssSuffix: 'speak-d' },
    ],
  },

  {
    id: 'searching',
    label: 'Searching',
    category: 'core-ai',
    emotion: 'Focus',
    useCase: 'Scanning content library for results',
    riveState: null,
    color: '#7C3AED',
    variants: [
      { id: 'search-a', label: 'A: Wide L–R Scan', description: 'Eyes sweep ±14px with body follow (±3°). Two pass sweeps. Glow acknowledgement pulse after each pass.', disneyPrinciples: ['Overlapping Action', 'Staging'], cssSuffix: 'search-a' },
      { id: 'search-b', label: 'B: Up–Right–Down–Left', description: 'Eyes trace: up → right → down-left → centre. Body follows with slight y-shift. Glow acknowledgement.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'search-b' },
      { id: 'search-c', label: 'C: Body Rotation + Glow Sweep', description: 'Body rotates ±8°, eyes lag behind then catch up. Two glow sweeps accompany the rotation.', disneyPrinciples: ['Follow Through', 'Overlapping Action', 'Staging'], cssSuffix: 'search-c' },
      { id: 'search-d', label: 'D: Scan + Blink + Return', description: 'Eyes scan right → blink → return centre → glow pulse → scan left → blink → return. Clean and precise.', disneyPrinciples: ['Overlapping Action', 'Appeal', 'Slow In / Slow Out'], cssSuffix: 'search-d' },
    ],
  },

  {
    id: 'processing',
    label: 'Processing',
    category: 'core-ai',
    emotion: 'Patience',
    useCase: 'Loading data, generating content, buffering',
    riveState: 'Loading',
    riveInput: { type: 'play', stateName: 'Loading' },
    color: '#7C3AED',
    variants: [
      { id: 'proc-a', label: 'A: Glow Pulse', description: 'Eyes settle to 90% height. Slow triple glow pulse (scale 0.94–1.14). Blink mid-cycle. Calm and steady.', disneyPrinciples: ['Slow In / Slow Out', 'Staging'], cssSuffix: 'proc-a' },
      { id: 'proc-b', label: 'B: Slow Breathing', description: 'Very deep 2.5s breath cycle. Eyes at 92%. Stable posture. Radiates patient calm.', disneyPrinciples: ['Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'proc-b' },
      { id: 'proc-c', label: 'C: Eye Micro-Pulse', description: 'Eyes contract briefly (78%) then spring back (1.0) ×3. Each contraction fires a glow pulse.', disneyPrinciples: ['Squash & Stretch', 'Appeal'], cssSuffix: 'proc-c' },
      { id: 'proc-d', label: 'D: Body Heartbeat', description: 'Body squash-and-stretch heartbeat ×4 with matching glow bursts. Most energetic processing variant.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'proc-d' },
    ],
  },

  {
    id: 'waiting',
    label: 'Waiting',
    category: 'core-ai',
    emotion: 'Readiness',
    useCase: 'Post-response, ready for next input',
    riveState: 'Idel _Eyeblink',
    riveInput: { type: 'boolean', name: 'Looking', value: false },
    color: '#7C3AED',
    variants: [
      { id: 'wait-a', label: 'A: Calm Breathing', description: 'Eyes slightly taller (108%). Glow slightly elevated. Two full breath cycles. More present than Idle.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal'], cssSuffix: 'wait-a' },
      { id: 'wait-b', label: 'B: Long Blink', description: 'Eyes 106%. Breathing. Slow sincere blink (eyes close fully 0.22s, reopen 0.32s). Patient waiting.', disneyPrinciples: ['Appeal', 'Slow In / Slow Out'], cssSuffix: 'wait-b' },
      { id: 'wait-c', label: 'C: Tiny Glance', description: 'Breathing + a tiny glance left (−5px, −1° wrap) at 2.5s. Subtle alertness signal. Returns to neutral.', disneyPrinciples: ['Appeal', 'Overlapping Action'], cssSuffix: 'wait-c' },
      { id: 'wait-d', label: 'D: Gentle Sway', description: 'Eyes 105%. Very slow ±2° sway with breathing overlay. Comfortable but attentive. 9s cycle.', disneyPrinciples: ['Follow Through', 'Slow In / Slow Out'], cssSuffix: 'wait-d' },
    ],
  },

  {
    id: 'sleep',
    label: 'Sleep',
    category: 'core-ai',
    emotion: 'Rest',
    useCase: 'TV idle timeout, screensaver mode, low-power',
    riveState: null,
    color: '#7C3AED',
    variants: [
      { id: 'sleep-a', label: 'A: Slow Breathing, Eyes Closed', description: 'Eyes close (0.55s), body sinks 5px, glow dims to 22%. Two very slow breaths. Wakes back at loop restart.', disneyPrinciples: ['Slow In / Slow Out', 'Staging'], cssSuffix: 'sleep-a' },
      { id: 'sleep-b', label: 'B: Long Blink into Sleep', description: 'Deliberate slow blink (0.55s close). Holds closed. Two sleep breaths. Gentle wake-back to REST.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal'], cssSuffix: 'sleep-b' },
      { id: 'sleep-c', label: 'C: Yawn then Sleep', description: 'Eyes squeeze, body stretches vertically, mouth opens briefly. Eyes close after yawn. Sleep breathing.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Appeal'], cssSuffix: 'sleep-c' },
      { id: 'sleep-d', label: 'D: Drift + Breathe', description: 'Eyes close, body drifts left (−3px, −1.5°) then right (+2px, +1°) across two slow breath cycles.', disneyPrinciples: ['Follow Through', 'Slow In / Slow Out'], cssSuffix: 'sleep-d' },
    ],
  },

  {
    id: 'thinking',
    label: 'Thinking',
    category: 'core-ai',
    emotion: 'Concentration',
    useCase: 'Processing query, generating recommendation',
    riveState: 'Loading',
    riveInput: { type: 'play', stateName: 'Loading' },
    color: '#7C3AED',
    variants: [
      { id: 'think-a', label: 'A: Narrow Eyes + Inward Brows', description: 'Both eyes narrow to 55% height. Inward brow furrow. Head tilts -10°. Glow dims then slow-pulses. No mouth.', disneyPrinciples: ['Appeal', 'Staging', 'Slow In / Slow Out'], cssSuffix: 'think-a' },
      { id: 'think-b', label: 'B: Asymmetric + One Brow', description: 'Left eye at 50%, right at 72%. Only right brow raises — the "hmm?" look. No mouth.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'think-b' },
      { id: 'think-c', label: 'C: Narrow Eyes + Scan', description: 'Both eyes narrow to 62%. Eyes scan L → R → L. No brows or mouth. Pure eye-language.', disneyPrinciples: ['Overlapping Action', 'Follow Through'], cssSuffix: 'think-c' },
      { id: 'think-d', label: 'D: Bounce → Narrow + Hold', description: 'Micro anticipation bounce, then settle into narrow eyes + inward brows. Slow glow pulse loop.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Appeal'], cssSuffix: 'think-d' },
    ],
  },

  {
    id: 'goodbye',
    label: 'Goodbye',
    category: 'core-ai',
    emotion: 'Warmth',
    useCase: 'Session end, TV powers off',
    riveState: null,
    color: '#7C3AED',
    variants: [
      { id: 'bye-a', label: 'A: Wave + Shrink', description: 'Tiny wave oscillation, then scales to 0. Warm farewell.', disneyPrinciples: ['Appeal', 'Anticipation'], cssSuffix: 'bye-a' },
      { id: 'bye-b', label: 'B: Glow Bloom Exit', description: 'Glow expands to 2× then fades with body.', disneyPrinciples: ['Staging', 'Slow In / Slow Out'], cssSuffix: 'bye-b' },
      { id: 'bye-c', label: 'C: Float Up', description: 'Floats up +16px while fading. Light leaving the room.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'bye-c' },
      { id: 'bye-d', label: 'D: Blink Out', description: 'Quick scale pop then instant fade. Like a star winking out.', disneyPrinciples: ['Anticipation', 'Appeal'], cssSuffix: 'bye-d' },
    ],
  },

  // ── Emotional ──────────────────────────────────────────────────────────────
  {
    id: 'happy',
    label: 'Happy',
    category: 'emotional',
    emotion: 'Joy',
    useCase: 'Positive interaction, thumbs-up received',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'happy-a', label: 'A: Tall Bright → Squint, No Mouth', description: 'Eyes go tall+bright at hop peak, then squint to 35% on land. Glow burst. No mouth, no brows. Pure eye joy.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through'], cssSuffix: 'happy-a' },
      { id: 'happy-b', label: 'B: Squint + Smile', description: 'Eyes squint first (32%), then smile fades in. Soft raised brows. Single hop. Eyes drive the story.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'happy-b' },
      { id: 'happy-c', label: 'C: Tall Eyes → Squint at Float Peak', description: 'Eyes start tall (1.45 scaleY), glow blooms, body floats. Eyes settle to squint (0.3) + soft smile + cheek blush.', disneyPrinciples: ['Appeal', 'Squash & Stretch', 'Overshoot & Settle'], cssSuffix: 'happy-c' },
      { id: 'happy-d', label: 'D: Glow Bloom + Squint, No Mouth', description: 'Glow expands to 1.85× first. Eyes squint (0.28). Body floats up and settles. No mouth, no brows. Gentle joy.', disneyPrinciples: ['Squash & Stretch', 'Staging', 'Follow Through'], cssSuffix: 'happy-d' },
    ],
  },

  {
    id: 'celebrate',
    label: 'Celebrate',
    category: 'emotional',
    emotion: 'Elation',
    useCase: 'Milestone, purchase complete, achievement',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'celeb-a', label: 'A: Triple Hop', description: 'Three hops with increasing height. Full celebration arc.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through'], cssSuffix: 'celeb-a' },
      { id: 'celeb-b', label: 'B: Hop + Spin', description: 'Hop into a 360° spin, land with glow bloom.', disneyPrinciples: ['Appeal', 'Squash & Stretch', 'Overshoot & Settle'], cssSuffix: 'celeb-b' },
      { id: 'celeb-c', label: 'C: Glow Bloom', description: 'Massive glow expansion with body scale pulse. Pure energy.', disneyPrinciples: ['Squash & Stretch', 'Staging'], cssSuffix: 'celeb-c' },
      { id: 'celeb-d', label: 'D: Joyful Bounce', description: 'Rapid bounces with follow-through squash on each landing.', disneyPrinciples: ['Squash & Stretch', 'Follow Through', 'Anticipation'], cssSuffix: 'celeb-d' },
    ],
  },

  {
    id: 'excited',
    label: 'Excited',
    category: 'emotional',
    emotion: 'Enthusiasm',
    useCase: 'New content unlock, trending item',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'excite-a', label: 'A: Rapid Shimmy', description: 'Fast left–right micro-sway. Contained enthusiasm.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'excite-a' },
      { id: 'excite-b', label: 'B: Scale Pop', description: 'Pop to 1.15 scale, settle with 3 micro-overshoots.', disneyPrinciples: ['Squash & Stretch', 'Overshoot & Settle'], cssSuffix: 'excite-b' },
      { id: 'excite-c', label: 'C: Vibration', description: 'High-freq ±2px X vibration for 400ms. Contained energy.', disneyPrinciples: ['Appeal'], cssSuffix: 'excite-c' },
      { id: 'excite-d', label: 'D: Glow Flash', description: 'Rapid glow pulse ×3, then returns to idle glow.', disneyPrinciples: ['Staging', 'Appeal'], cssSuffix: 'excite-d' },
    ],
  },

  {
    id: 'curious',
    label: 'Curious',
    category: 'emotional',
    emotion: 'Intrigue',
    useCase: 'User lingers on content, something interesting detected',
    riveState: 'Looking Around',
    riveInput: { type: 'boolean', name: 'Looking', value: true },
    color: '#0EA5E9',
    variants: [
      { id: 'curious-a', label: 'A: Head Tilt Right', description: '8° tilt right, slight lean toward content.', disneyPrinciples: ['Appeal', 'Anticipation'], cssSuffix: 'curious-a' },
      { id: 'curious-b', label: 'B: Eye Dart + Tilt', description: 'Eyes dart to point of interest, head follows.', disneyPrinciples: ['Overlapping Action', 'Follow Through'], cssSuffix: 'curious-b' },
      { id: 'curious-c', label: 'C: Slow Lean', description: 'Very slow forward lean over 1.2s. Deep interest.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal'], cssSuffix: 'curious-c' },
      { id: 'curious-d', label: 'D: Double Take', description: 'Glances away, snaps back. Caught off-guard by something.', disneyPrinciples: ['Anticipation', 'Follow Through'], cssSuffix: 'curious-d' },
    ],
  },

  {
    id: 'proud',
    label: 'Proud',
    category: 'emotional',
    emotion: 'Satisfaction',
    useCase: 'Great recommendation nailed, user expressed satisfaction',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'proud-a', label: 'A: Chest Out', description: 'Subtle scale-up + 2° backward tilt. Confident posture.', disneyPrinciples: ['Appeal', 'Staging'], cssSuffix: 'proud-a' },
      { id: 'proud-b', label: 'B: Warm Glow', description: 'Glow shifts warmer (gold tint) and brightens slowly.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal'], cssSuffix: 'proud-b' },
      { id: 'proud-c', label: 'C: Satisfied Nod', description: 'Single slow nod — 4° down and back up. Understated pride.', disneyPrinciples: ['Follow Through', 'Anticipation'], cssSuffix: 'proud-c' },
      { id: 'proud-d', label: 'D: Calm Expand', description: 'Breathes in and stays slightly larger. Quiet confidence.', disneyPrinciples: ['Squash & Stretch', 'Appeal'], cssSuffix: 'proud-d' },
    ],
  },

  {
    id: 'encouraging',
    label: 'Encouraging',
    category: 'emotional',
    emotion: 'Support',
    useCase: 'Prompting user to try something new',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'encour-a', label: 'A: Forward Lean + Glow', description: 'Leans toward user, warm glow brightens.', disneyPrinciples: ['Appeal', 'Staging'], cssSuffix: 'encour-a' },
      { id: 'encour-b', label: 'B: Gentle Bob', description: 'Slow up–down bob — "come on, give it a go."', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'encour-b' },
      { id: 'encour-c', label: 'C: Eyes Open Wide', description: 'Glow ring expands, eyes enlarge slightly.', disneyPrinciples: ['Squash & Stretch', 'Anticipation'], cssSuffix: 'encour-c' },
      { id: 'encour-d', label: 'D: Warm Pulse', description: 'Three slow warm-toned glow pulses.', disneyPrinciples: ['Slow In / Slow Out', 'Staging'], cssSuffix: 'encour-d' },
    ],
  },

  {
    id: 'shy',
    label: 'Shy',
    category: 'emotional',
    emotion: 'Bashfulness',
    useCase: 'First interaction, first time user',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'shy-a', label: 'A: Slight Shrink', description: 'Scale 1.0 → 0.94, leans slightly back.', disneyPrinciples: ['Anticipation', 'Squash & Stretch'], cssSuffix: 'shy-a' },
      { id: 'shy-b', label: 'B: Eyes Down', description: 'Gaze drifts toward lower-centre, glow dims slightly.', disneyPrinciples: ['Appeal', 'Staging'], cssSuffix: 'shy-b' },
      { id: 'shy-c', label: 'C: Peek & Hide', description: 'Scales down quickly, pauses, slowly peeks back up.', disneyPrinciples: ['Anticipation', 'Follow Through', 'Appeal'], cssSuffix: 'shy-c' },
      { id: 'shy-d', label: 'D: Sway Hide', description: 'Sways gently left while shrinking, returns right.', disneyPrinciples: ['Follow Through', 'Overlapping Action'], cssSuffix: 'shy-d' },
    ],
  },

  {
    id: 'confused',
    label: 'Confused',
    category: 'emotional',
    emotion: 'Uncertainty',
    useCase: 'Did not understand input, ambiguous request',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'confuse-a', label: 'A: Tilt Left', description: '10° left tilt, glow dims slightly. "Hmm…"', disneyPrinciples: ['Appeal', 'Staging'], cssSuffix: 'confuse-a' },
      { id: 'confuse-b', label: 'B: Tilt Right', description: '10° right tilt variant. Alternates between -a and -b.', disneyPrinciples: ['Appeal', 'Staging'], cssSuffix: 'confuse-b' },
      { id: 'confuse-c', label: 'C: Look Around', description: 'Eyes scan left, centre, right, centre. Searching for context.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'confuse-c' },
      { id: 'confuse-d', label: 'D: Gentle Wiggle', description: 'Small left–right body wiggle over 600ms. Endearing confusion.', disneyPrinciples: ['Squash & Stretch', 'Follow Through', 'Appeal'], cssSuffix: 'confuse-d' },
    ],
  },

  {
    id: 'sorry',
    label: 'Confused / Sorry',
    category: 'emotional',
    emotion: 'Uncertainty → Recovery',
    useCase: 'Did not understand, needs to try again',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'sorry-a', label: 'A: Left Small, Right Tall', description: 'Left eye 45%, right eye 105%. Tilt left. Concerned inward brows. Small nod. Full eye-asymmetry recovery.', disneyPrinciples: ['Appeal', 'Staging', 'Follow Through'], cssSuffix: 'sorry-a' },
      { id: 'sorry-b', label: 'B: Right Small, Left Tall + One Brow', description: 'Right eye 42%, left eye 108%. Only right brow raises ("what happened?"). Nod right then recovery.', disneyPrinciples: ['Appeal', 'Overlapping Action', 'Anticipation'], cssSuffix: 'sorry-b' },
      { id: 'sorry-c', label: 'C: Both Narrow + ? Mark', description: 'Both eyes narrow (52%). Inward brows. Question mark floats up. Wiggle. Eyes and glow recover.', disneyPrinciples: ['Squash & Stretch', 'Follow Through', 'Appeal'], cssSuffix: 'sorry-c' },
      { id: 'sorry-d', label: 'D: Heavy Eyes + Sincere Blink', description: 'Eyes at 68% (empathetic weight). Inward brows. Long sincere blink (close fully). Small nod. Full recovery.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal', 'Anticipation'], cssSuffix: 'sorry-d' },
    ],
  },

  {
    id: 'love',
    label: 'Love',
    category: 'emotional',
    emotion: 'Affection',
    useCase: 'Item saved to favourites, strong preference match',
    riveState: null,
    color: '#0EA5E9',
    variants: [
      { id: 'love-a', label: 'A: Heart Pulse', description: 'Glow turns rose, pulses twice at heartbeat rhythm.', disneyPrinciples: ['Squash & Stretch', 'Staging'], cssSuffix: 'love-a' },
      { id: 'love-b', label: 'B: Float Up', description: '+8px float, glow turns warm pink, soft scale up.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'love-b' },
      { id: 'love-c', label: 'C: Shy + Glow', description: 'Tilts slightly, glow blooms warm. Endearing warmth.', disneyPrinciples: ['Anticipation', 'Appeal'], cssSuffix: 'love-c' },
      { id: 'love-d', label: 'D: Slow Bloom', description: 'Glow expands to 1.6× over 1.5s with gentle scale rise.', disneyPrinciples: ['Slow In / Slow Out', 'Staging'], cssSuffix: 'love-d' },
    ],
  },

  // ── Samsung TV ─────────────────────────────────────────────────────────────
  {
    id: 'like',
    label: 'Like',
    category: 'samsung-tv',
    emotion: 'Affirmation',
    useCase: 'User taps Like on content card',
    riveState: null,
    color: '#1C5CB8',
    variants: [
      { id: 'like-a', label: 'A: Quick Hop + Glow', description: 'Single energetic hop, glow bursts warm gold briefly.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through'], cssSuffix: 'like-a' },
      { id: 'like-b', label: 'B: Spin of Joy', description: 'Fast 360° spin returning to idle. Effortlessly happy.', disneyPrinciples: ['Appeal', 'Squash & Stretch'], cssSuffix: 'like-b' },
      { id: 'like-c', label: 'C: Double Pulse', description: 'Scale 1.0 → 1.12 → 1.0 twice. Excited heartbeat.', disneyPrinciples: ['Squash & Stretch', 'Overlapping Action'], cssSuffix: 'like-c' },
      { id: 'like-d', label: 'D: Rise + Shimmer', description: 'Floats up 6px, shimmer runs through glow, settles.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'like-d' },
    ],
  },

  {
    id: 'dislike',
    label: 'Dislike',
    category: 'samsung-tv',
    emotion: 'Resolve',
    useCase: 'User taps Dislike — "I will find something better"',
    riveState: 'Loading',
    riveInput: { type: 'play', stateName: 'Loading' },
    color: '#1C5CB8',
    variants: [
      { id: 'dislike-a', label: 'A: Thoughtful Nod', description: 'Single nod → transitions into Thinking. Understood.', disneyPrinciples: ['Anticipation', 'Staging'], cssSuffix: 'dislike-a' },
      { id: 'dislike-b', label: 'B: Tilt + Scan', description: 'Head tilts, eyes scan — formulating a better pick.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'dislike-b' },
      { id: 'dislike-c', label: 'C: Brief Shrink', description: 'Micro-scale-down, brief pause, scale up with determination.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through'], cssSuffix: 'dislike-c' },
      { id: 'dislike-d', label: 'D: Look Away & Back', description: 'Glances away briefly, snaps back decisive. "On it."', disneyPrinciples: ['Staging', 'Follow Through'], cssSuffix: 'dislike-d' },
    ],
  },

  {
    id: 'reco-accepted',
    label: 'Reco Accepted',
    category: 'samsung-tv',
    emotion: 'Pride',
    useCase: 'User selects recommended content',
    riveState: null,
    color: '#1C5CB8',
    variants: [
      { id: 'reco-acc-a', label: 'A: Subtle Celebrate', description: 'Small hop, warm glow pulse. "Great choice!"', disneyPrinciples: ['Anticipation', 'Follow Through'], cssSuffix: 'reco-acc-a' },
      { id: 'reco-acc-b', label: 'B: Confident Swell', description: 'Scale 1.0 → 1.08 with slow settle. Satisfied.', disneyPrinciples: ['Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'reco-acc-b' },
      { id: 'reco-acc-c', label: 'C: Gold Shimmer', description: 'Glow briefly turns gold. Good taste acknowledged.', disneyPrinciples: ['Appeal', 'Staging'], cssSuffix: 'reco-acc-c' },
      { id: 'reco-acc-d', label: 'D: Proud Tilt Back', description: 'Leans back 3° with scale-up. Pleased with itself.', disneyPrinciples: ['Appeal', 'Follow Through'], cssSuffix: 'reco-acc-d' },
    ],
  },

  {
    id: 'reco-rejected',
    label: 'Reco Rejected',
    category: 'samsung-tv',
    emotion: 'Determination',
    useCase: 'User rejects recommendation — recalibrating',
    riveState: 'Loading',
    riveInput: { type: 'play', stateName: 'Loading' },
    color: '#1C5CB8',
    variants: [
      { id: 'reco-rej-a', label: 'A: Quick Nod + Think', description: 'Nod → thinking transition. No sadness, just focus.', disneyPrinciples: ['Staging', 'Anticipation'], cssSuffix: 'reco-rej-a' },
      { id: 'reco-rej-b', label: 'B: Tilt Recalibrate', description: 'Tilts like recalibrating scales. Internal adjustment.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'reco-rej-b' },
      { id: 'reco-rej-c', label: 'C: Brief Dim + Brighten', description: 'Glow dims 40%, recovers to 120%, settles. Recalibrated.', disneyPrinciples: ['Staging', 'Slow In / Slow Out'], cssSuffix: 'reco-rej-c' },
      { id: 'reco-rej-d', label: 'D: Look Left–Think', description: 'Eyes look off-screen left, pause, return determined.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'reco-rej-d' },
    ],
  },

  {
    id: 'qr-ready',
    label: 'QR Scan Ready',
    category: 'samsung-tv',
    emotion: 'Readiness',
    useCase: 'QR code displayed on screen for phone pairing',
    riveState: 'Looking Around',
    riveInput: { type: 'boolean', name: 'Looking', value: true },
    color: '#1C5CB8',
    variants: [
      { id: 'qr-a', label: 'A: Alert Perk', description: 'Scale up 4%, glow intensifies. "Scan me!"', disneyPrinciples: ['Anticipation', 'Appeal'], cssSuffix: 'qr-a' },
      { id: 'qr-b', label: 'B: Bounce Beckon', description: 'Two small hops, eyes lock on QR area.', disneyPrinciples: ['Anticipation', 'Squash & Stretch'], cssSuffix: 'qr-b' },
      { id: 'qr-c', label: 'C: Slow Orbit', description: 'Orbits the QR code frame slowly. Guides attention.', disneyPrinciples: ['Staging', 'Appeal'], cssSuffix: 'qr-c' },
      { id: 'qr-d', label: 'D: Shimmer Pulse', description: 'Blue scanning shimmer across glow. Tech feel.', disneyPrinciples: ['Staging', 'Slow In / Slow Out'], cssSuffix: 'qr-d' },
    ],
  },

  {
    id: 'purchase-complete',
    label: 'Purchase Complete',
    category: 'samsung-tv',
    emotion: 'Triumph',
    useCase: 'Successful in-app purchase or checkout',
    riveState: null,
    color: '#1C5CB8',
    variants: [
      { id: 'purch-a', label: 'A: Triple Hop + Gold', description: 'Three hops, glow turns gold for 1s. Congratulations!', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through'], cssSuffix: 'purch-a' },
      { id: 'purch-b', label: 'B: Spin + Glow Bloom', description: 'Full spin into a glow bloom. Triumphant energy.', disneyPrinciples: ['Appeal', 'Squash & Stretch', 'Staging'], cssSuffix: 'purch-b' },
      { id: 'purch-c', label: 'C: Rise + Celebrate', description: 'Floats up, pulses warm glow 3×. Grand celebration.', disneyPrinciples: ['Follow Through', 'Squash & Stretch'], cssSuffix: 'purch-c' },
      { id: 'purch-d', label: 'D: Confetti Glow', description: 'Rapid multi-color glow flashes before settling.', disneyPrinciples: ['Staging', 'Appeal'], cssSuffix: 'purch-d' },
    ],
  },

  {
    id: 'no-results',
    label: 'No Results',
    category: 'samsung-tv',
    emotion: 'Gentle Regret',
    useCase: 'Search returned nothing, content not available',
    riveState: null,
    color: '#1C5CB8',
    variants: [
      { id: 'nores-a', label: 'A: Slow Droop', description: 'Scale 0.95, -4px Y, glow dims. Quiet acknowledgement.', disneyPrinciples: ['Slow In / Slow Out', 'Staging'], cssSuffix: 'nores-a' },
      { id: 'nores-b', label: 'B: Confused Scan', description: 'Eyes scan for something not there. Looks empty-handed.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'nores-b' },
      { id: 'nores-c', label: 'C: Sorry Nod', description: 'Single downward nod. "Sorry, nothing there."', disneyPrinciples: ['Follow Through', 'Anticipation'], cssSuffix: 'nores-c' },
      { id: 'nores-d', label: 'D: Gentle Shrink + Recover', description: 'Brief shrink, slow recovery to idle. Resilience.', disneyPrinciples: ['Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'nores-d' },
    ],
  },

  {
    id: 'retry',
    label: 'Retry',
    category: 'samsung-tv',
    emotion: 'Persistence',
    useCase: 'Retry prompt, network error recovery',
    riveState: 'Loading',
    riveInput: { type: 'play', stateName: 'Loading' },
    color: '#1C5CB8',
    variants: [
      { id: 'retry-a', label: 'A: Determined Nod', description: 'Two firm nods. "Let\'s try again."', disneyPrinciples: ['Anticipation', 'Follow Through'], cssSuffix: 'retry-a' },
      { id: 'retry-b', label: 'B: Wind Up', description: 'Slight backward lean (anticipation) → forward.', disneyPrinciples: ['Anticipation', 'Squash & Stretch'], cssSuffix: 'retry-b' },
      { id: 'retry-c', label: 'C: Glow Recharge', description: 'Glow dims fully then rapidly charges back to full.', disneyPrinciples: ['Staging', 'Appeal'], cssSuffix: 'retry-c' },
      { id: 'retry-d', label: 'D: Spin Up', description: 'Quick rotation, scale up — powered up and ready.', disneyPrinciples: ['Appeal', 'Anticipation'], cssSuffix: 'retry-d' },
    ],
  },

  // ── Delight ────────────────────────────────────────────────────────────────
  {
    id: 'wave',
    label: 'Wave',
    category: 'delight',
    emotion: 'Greeting',
    useCase: 'First encounter, user returns after absence',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'wave-a', label: 'A: Side-to-Side Wave', description: 'Gentle ±12px X oscillation over 800ms. Classic wave.', disneyPrinciples: ['Anticipation', 'Follow Through', 'Overlapping Action'], cssSuffix: 'wave-a' },
      { id: 'wave-b', label: 'B: Big Wave', description: 'Larger ±20px X with scale bob. Enthusiastic.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'wave-b' },
      { id: 'wave-c', label: 'C: Tiny Hop Wave', description: 'Small hop + side wave combined. Very endearing.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Appeal'], cssSuffix: 'wave-c' },
      { id: 'wave-d', label: 'D: Slow Gentle Wave', description: 'Single slow, warm sway. Understated greeting.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal'], cssSuffix: 'wave-d' },
    ],
  },

  {
    id: 'wink',
    label: 'Wink',
    category: 'delight',
    emotion: 'Playfulness',
    useCase: 'Easter egg, hidden feature found',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'wink-a', label: 'A: Quick Right Wink', description: 'Right eye closes 80ms, opens with slight scale pop.', disneyPrinciples: ['Appeal', 'Squash & Stretch'], cssSuffix: 'wink-a' },
      { id: 'wink-b', label: 'B: Slow Knowing Wink', description: 'Deliberate, slow right wink. Conspiratorial.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal'], cssSuffix: 'wink-b' },
      { id: 'wink-c', label: 'C: Wink + Lean', description: 'Wink accompanied by slight right lean. Charming.', disneyPrinciples: ['Overlapping Action', 'Appeal', 'Follow Through'], cssSuffix: 'wink-c' },
      { id: 'wink-d', label: 'D: Double Wink', description: 'Left wink then right wink in quick succession.', disneyPrinciples: ['Appeal', 'Squash & Stretch'], cssSuffix: 'wink-d' },
    ],
  },

  {
    id: 'peek',
    label: 'Peek',
    category: 'delight',
    emotion: 'Curiosity',
    useCase: 'New content arriving, surprise reveal',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'peek-a', label: 'A: Peek from Below', description: 'Rises slowly from -20px to centre. Shy reveal.', disneyPrinciples: ['Anticipation', 'Slow In / Slow Out', 'Appeal'], cssSuffix: 'peek-a' },
      { id: 'peek-b', label: 'B: Peek from Side', description: 'Slides in from +20px X. Glances around, steps in.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'peek-b' },
      { id: 'peek-c', label: 'C: Scale Peek', description: 'Zooms in from scale 0.6 — like zooming in for a look.', disneyPrinciples: ['Squash & Stretch', 'Anticipation'], cssSuffix: 'peek-c' },
      { id: 'peek-d', label: 'D: Blink-in Peek', description: 'Fades in from 0 opacity then focuses eyes on content.', disneyPrinciples: ['Staging', 'Appeal'], cssSuffix: 'peek-d' },
    ],
  },

  {
    id: 'kiss',
    label: 'Kiss',
    category: 'delight',
    emotion: 'Adoration',
    useCase: 'Perfect match, content the user will love',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'kiss-a', label: 'A: Pucker + Float', description: 'Slight scale-up + forward lean, warm rose glow. "Mwah!"', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Appeal'], cssSuffix: 'kiss-a' },
      { id: 'kiss-b', label: 'B: Heart Glow', description: 'Glow pulses rose-pink twice. Affectionate.', disneyPrinciples: ['Staging', 'Squash & Stretch'], cssSuffix: 'kiss-b' },
      { id: 'kiss-c', label: 'C: Float + Spin', description: 'Floats up with rose tint, slow 180° rotation. Charmed.', disneyPrinciples: ['Follow Through', 'Appeal'], cssSuffix: 'kiss-c' },
      { id: 'kiss-d', label: 'D: Shy Kiss', description: 'Tilts, dims slightly (bashful), then brightens warm.', disneyPrinciples: ['Anticipation', 'Appeal', 'Slow In / Slow Out'], cssSuffix: 'kiss-d' },
    ],
  },

  {
    id: 'spin',
    label: 'Spin',
    category: 'delight',
    emotion: 'Playfulness',
    useCase: 'Random delight trigger, long idle',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'spin-a', label: 'A: Single Spin', description: '360° at medium speed (450ms). Clean and fun.', disneyPrinciples: ['Appeal', 'Squash & Stretch'], cssSuffix: 'spin-a' },
      { id: 'spin-b', label: 'B: Wobbly Spin', description: 'Spins with slight scale wobble. Physically charming.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'spin-b' },
      { id: 'spin-c', label: 'C: Double Spin', description: '720° at moderate speed. Rare exuberance.', disneyPrinciples: ['Appeal', 'Squash & Stretch'], cssSuffix: 'spin-c' },
      { id: 'spin-d', label: 'D: Anticipate + Spin', description: 'Coils back slightly before spinning. Telegraphed.', disneyPrinciples: ['Anticipation', 'Follow Through', 'Appeal'], cssSuffix: 'spin-d' },
    ],
  },

  {
    id: 'dance',
    label: 'Dance',
    category: 'delight',
    emotion: 'Joy',
    useCase: 'Music content playing, celebratory moment',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'dance-a', label: 'A: Sway Dance', description: 'Side-to-side sway on 0.5s rhythm. Laid-back groove.', disneyPrinciples: ['Follow Through', 'Overlapping Action'], cssSuffix: 'dance-a' },
      { id: 'dance-b', label: 'B: Bounce Dance', description: 'Rhythmic up–down bounces, ±8px. Beat-locked.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'dance-b' },
      { id: 'dance-c', label: 'C: Spin Dance', description: 'Short alternating 45° spins left and right.', disneyPrinciples: ['Anticipation', 'Follow Through', 'Appeal'], cssSuffix: 'dance-c' },
      { id: 'dance-d', label: 'D: Full Groove', description: 'Combines bounce + sway + occasional spin. Full energy.', disneyPrinciples: ['Overlapping Action', 'Squash & Stretch', 'Appeal'], cssSuffix: 'dance-d' },
    ],
  },

  {
    id: 'stretch',
    label: 'Stretch',
    category: 'delight',
    emotion: 'Comfort',
    useCase: 'Extended session, ambient idle easter egg',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'stretch-a', label: 'A: Vertical Stretch', description: 'Scales Y to 1.15, X to 0.9, settles. Classic squash/stretch.', disneyPrinciples: ['Squash & Stretch', 'Follow Through', 'Appeal'], cssSuffix: 'stretch-a' },
      { id: 'stretch-b', label: 'B: Side Lean Stretch', description: 'Leans deeply left then right with exaggerated scale.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'stretch-b' },
      { id: 'stretch-c', label: 'C: Expand + Contract', description: 'Uniform scale 1.0 → 1.14 → 0.96 → 1.0. Big breath.', disneyPrinciples: ['Squash & Stretch', 'Slow In / Slow Out'], cssSuffix: 'stretch-c' },
      { id: 'stretch-d', label: 'D: Slow Deliberate Stretch', description: 'Long, luxurious vertical stretch over 1.5s. Very comfortable.', disneyPrinciples: ['Slow In / Slow Out', 'Squash & Stretch', 'Appeal'], cssSuffix: 'stretch-d' },
    ],
  },

  {
    id: 'idle-personality',
    label: 'Idle Personality',
    category: 'delight',
    emotion: 'Character',
    useCase: 'Long ambient idle — mascot reveals its character through micro-activities',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'idle-personality-a', label: 'A: Hobby_Read', description: 'Book icon floats up; eyes drift down reading. Page-turn micro. Eyes return when book is put away.', disneyPrinciples: ['Appeal', 'Staging', 'Slow In / Slow Out'], cssSuffix: 'idle-personality-a' },
      { id: 'idle-personality-b', label: 'B: FoodAgent', description: 'Food icon rises; eyes track it upward with interest. Lean forward. Happy glow. Float drifts away.', disneyPrinciples: ['Appeal', 'Follow Through', 'Overlapping Action'], cssSuffix: 'idle-personality-b' },
      { id: 'idle-personality-c', label: 'C: MusicAgent', description: 'Body bobs rhythmically at 120 BPM. Eyes squeeze on downbeats. Glow pulses with accented beats.', disneyPrinciples: ['Squash & Stretch', 'Rhythm', 'Appeal'], cssSuffix: 'idle-personality-c' },
      { id: 'idle-personality-d', label: 'D: ThinkingAlone', description: 'Eyes drift up-left; thought bubble floats. Slow wander. Blink resolves the thought and eyes return.', disneyPrinciples: ['Appeal', 'Staging', 'Slow In / Slow Out'], cssSuffix: 'idle-personality-d' },
    ],
  },

  {
    id: 'yawn',
    label: 'Yawn',
    category: 'delight',
    emotion: 'Drowsiness',
    useCase: 'Pre-sleep state, long idle, late-night mode',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'yawn-a', label: 'A: Slow Expand + Droop', description: 'Scale up slowly, tilt back, scale down slowly. Eyes droop.', disneyPrinciples: ['Slow In / Slow Out', 'Squash & Stretch', 'Appeal'], cssSuffix: 'yawn-a' },
      { id: 'yawn-b', label: 'B: Side Lean Yawn', description: 'Leans to one side, yawns, slowly straightens.', disneyPrinciples: ['Follow Through', 'Squash & Stretch'], cssSuffix: 'yawn-b' },
      { id: 'yawn-c', label: 'C: Glow Dim Yawn', description: 'Glow dims as yawn peaks, recovers slowly after.', disneyPrinciples: ['Staging', 'Slow In / Slow Out'], cssSuffix: 'yawn-c' },
      { id: 'yawn-d', label: 'D: Head Drop Yawn', description: 'Head slowly drops forward (scale skew), snaps back up.', disneyPrinciples: ['Slow In / Slow Out', 'Follow Through', 'Appeal'], cssSuffix: 'yawn-d' },
    ],
  },

  {
    id: 'wake-from-sleep',
    label: 'Wake From Sleep',
    category: 'delight',
    emotion: 'Drowsy → Alert',
    useCase: 'Screen wakes from standby, morning greeting, power-on moment',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'wake-from-sleep-a', label: 'A: Clean Wake', description: 'Final Z fades, eyes open slowly, glow blooms, one alert blink.', disneyPrinciples: ['Slow In / Slow Out', 'Appeal', 'Overshoot & Settle'], cssSuffix: 'wake-from-sleep-a' },
      { id: 'wake-from-sleep-b', label: 'B: Reluctant Wake', description: 'Eyes try to open, droop back, try again and succeed.', disneyPrinciples: ['Anticipation', 'Follow Through', 'Appeal'], cssSuffix: 'wake-from-sleep-b' },
      { id: 'wake-from-sleep-c', label: 'C: Glow Bloom Wake', description: 'Glow expands first, then eyes open inside it. Double blink.', disneyPrinciples: ['Staging', 'Slow In / Slow Out', 'Appeal'], cssSuffix: 'wake-from-sleep-c' },
      { id: 'wake-from-sleep-d', label: 'D: Stretch Wake', description: 'Eyes open, body does full stretch, snaps back, alert blink.', disneyPrinciples: ['Squash & Stretch', 'Anticipation', 'Follow Through'], cssSuffix: 'wake-from-sleep-d' },
    ],
  },

  {
    id: 'laughing',
    label: 'Laughing',
    category: 'delight',
    emotion: 'Joy',
    useCase: 'User says something funny, easter egg, positive reaction moment',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'laughing-a', label: 'A: Small Giggle', description: 'Contained shiver ×5, eyes squint, glow flickers. Suppressed laughter that can\'t be held back.', disneyPrinciples: ['Squash & Stretch', 'Follow Through', 'Appeal'], cssSuffix: 'laughing-a' },
      { id: 'laughing-b', label: 'B: Body Shake', description: 'Full ±5px shiver ×8, eyes squint hard, glow pulses on each beat. Trailing chuckle shiver after.', disneyPrinciples: ['Squash & Stretch', 'Overlapping Action', 'Follow Through'], cssSuffix: 'laughing-b' },
      { id: 'laughing-c', label: 'C: Squint + Bounce + Glow', description: 'Three joyful hops with crescent eyes throughout. Warm glow bloom afterglow. Eyes open slowly.', disneyPrinciples: ['Squash & Stretch', 'Anticipation', 'Appeal'], cssSuffix: 'laughing-c' },
      { id: 'laughing-d', label: 'D: Big Laugh + Settle', description: 'Anticipation inhale → explosive eruption + glow bloom → slow exhale → final chuckle → settle.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through', 'Slow In / Slow Out'], cssSuffix: 'laughing-d' },
    ],
  },

  {
    id: 'wow',
    label: 'Wow',
    category: 'delight',
    emotion: 'Star-struck',
    useCase: 'User discovers something amazing, surprising recommendation, delight moment',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'wow-a', label: 'A: Entry Sequence', description: 'OOH mouth snaps in, eye anticipation lift, body squash-rebound, star eyes arrive with sparkle burst. Full entry + steady bob loop.', disneyPrinciples: ['Anticipation', 'Squash & Stretch', 'Follow Through', 'Slow In / Slow Out'], cssSuffix: 'wow-a' },
      { id: 'wow-b', label: 'B: Joyful Hops', description: 'Stars visible immediately, counter-phase heartbeat pulse, body hops every 2s with glow burst on each landing.', disneyPrinciples: ['Squash & Stretch', 'Appeal', 'Follow Through'], cssSuffix: 'wow-b' },
      { id: 'wow-c', label: 'C: Glow Bloom', description: 'Glow expands first, then stars snap in inside the warm bloom. Second sparkle burst at loop midpoint.', disneyPrinciples: ['Staging', 'Slow In / Slow Out', 'Appeal'], cssSuffix: 'wow-c' },
      { id: 'wow-d', label: 'D: Tilt & Sway', description: 'Body leans right into the wow, stars twinkle with rotation, slow left-right sway throughout. Colour-swipe burst on each reversal.', disneyPrinciples: ['Appeal', 'Overlapping Action', 'Follow Through'], cssSuffix: 'wow-d' },
    ],
  },

  {
    id: 'giggle',
    label: 'Giggle',
    category: 'delight',
    emotion: 'Amusement',
    useCase: 'User says something funny, easter egg trigger',
    riveState: null,
    color: '#10B981',
    variants: [
      { id: 'giggle-a', label: 'A: Rapid Shake', description: 'Fast ±3px X shiver over 400ms. Suppressed laughter.', disneyPrinciples: ['Squash & Stretch', 'Follow Through'], cssSuffix: 'giggle-a' },
      { id: 'giggle-b', label: 'B: Bounce Giggle', description: 'Three fast mini-hops. Can\'t contain it!', disneyPrinciples: ['Squash & Stretch', 'Anticipation'], cssSuffix: 'giggle-b' },
      { id: 'giggle-c', label: 'C: Shake + Glow Flash', description: 'Shiver combined with rapid warm glow flicker.', disneyPrinciples: ['Overlapping Action', 'Appeal'], cssSuffix: 'giggle-c' },
      { id: 'giggle-d', label: 'D: Tiny Spin Giggle', description: 'A partial 90° spin then back. Helplessly amused.', disneyPrinciples: ['Appeal', 'Follow Through', 'Anticipation'], cssSuffix: 'giggle-d' },
    ],
  },
];

export const STATE_COUNT = MASCOT_STATES.length;
export const STATES_BY_CATEGORY = Object.fromEntries(
  (['core-ai', 'emotional', 'samsung-tv', 'delight'] as StateCategory[]).map(cat => [
    cat,
    MASCOT_STATES.filter(s => s.category === cat),
  ])
) as Record<StateCategory, MascotState[]>;
