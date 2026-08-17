import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/globals.css'
import './styles/tokens.css'
import './styles/motion.css'
import './styles/tv.css'
import './styles/animations.css'
import './styles/premium.css'
import './styles/figma-onboarding.css'
import App from './App'
import ColdStartApp from './ColdStartApp'
import WarmStartApp from './WarmStartApp'
import L0PreviewApp from './L0PreviewApp'
import InterstitialPreviewApp from './InterstitialPreviewApp'
import BeamButtonPOC from './components/dev/BeamButtonPOC'
import T2FashionApp from './T2FashionApp'
import T3App from './T3App'
import L1TemplatesApp from './L1TemplatesApp'
import L0ExportApp from './L0ExportApp'
import L0AnimationLabApp from './L0AnimationLabApp'
import WarmProfile1App from './WarmProfile1App'
import WarmProfile1CrispApp from './WarmProfile1CrispApp'
import WarmProfile1CrisperApp from './WarmProfile1CrisperApp'
import WarmProfile2CrispApp from './WarmProfile2CrispApp'
import ColdProfile1App from './ColdProfile1App'
import L0T1App from './L0T1App'
import MascotPlaygroundApp from './MascotPlaygroundApp'
import L1EmbeddedCTAPrototype from './components/L1/L1EmbeddedCTAPrototype'
import L1ExpandedCardPrototype from './components/L1/L1ExpandedCardPrototype'
import L1ContinuousCTAPrototype from './components/L1/L1ContinuousCTAPrototype'
import L1TextTablePrototype from './components/L1/L1TextTablePrototype'
import CTAExplorationIndex from './CTAExplorationIndex'
import L1ShoppingTemplate from './components/L1/L1ShoppingTemplate'
import FoodL1Scenarios from './components/L1/FoodL1Scenarios'
import FoodL1TextPage from './components/L1/FoodL1TextPage'
import FoodL1PatternPage from './components/L1/FoodL1PatternPage'
import TravelL1 from './components/L1/TravelL1'
import L1Scenarios from './components/L1/L1Scenarios'
import PrototypeIndex from './PrototypeIndex'
import MascotIntroApp from './MascotIntroApp'
import AgentHubApp from './AgentHubApp'
import NewConversationApp from './NewConversationApp'
import CapabilityL1App from './CapabilityL1App'
import AgentThinkingTraceApp from './AgentThinkingTraceApp'
import AgentThinkingV2App from './AgentThinkingV2App'

declare global { interface Window { __L0_PREVIEW__?: string; __BEAM_POC__?: boolean; __INTERSTITIAL_PREVIEW__?: boolean; __L0_EXPORT__?: boolean } }

const isPreview       = !!window.__L0_PREVIEW__;
const isBeamPOC       = !!window.__BEAM_POC__;
const isInterstitial  = !!window.__INTERSTITIAL_PREVIEW__;
const isL0Export      = !!window.__L0_EXPORT__;
const isColdStart     = window.location.pathname === '/demo_cold_start'
                     || window.location.pathname === '/demo-cold-start';
const isWarmStart     = window.location.pathname === '/demo_warm_start'
                     || window.location.pathname === '/demo-warm-start';
const isWarmProfile1  = window.location.pathname === '/warm_profile_1'
                     || window.location.pathname === '/warm-profile-1';
const isWarmProfile1Crisp = window.location.pathname === '/warm_profile_1_crisp'
                     || window.location.pathname === '/warm-profile-1-crisp';
// Final/showcase URL — Option 6 (Connected Hub) only, no prototype controls.
const isAgentHubFinal = window.location.pathname === '/agent_hub_final'
                     || window.location.pathname === '/agent-hub-final';
const isWarmProfile1Crisper = window.location.pathname === '/agent_hub_exploration'
                     || window.location.pathname === '/agent-hub-exploration'
                     || window.location.pathname === '/warm_profile_1_crisper'
                     || window.location.pathname === '/warm-profile-1-crisper';
const isWarmProfile2Crisp = window.location.pathname === '/warm_profile_2_crisp'
                     || window.location.pathname === '/warm-profile-2-crisp';
const isColdProfile1  = window.location.pathname === '/cold_profile_1'
                     || window.location.pathname === '/cold-profile-1';
const isT2Fashion     = window.location.pathname === '/t2-fashion'
                     || window.location.hash === '#t2-fashion'
                     || new URLSearchParams(window.location.search).has('t2');
const isT3            = window.location.pathname === '/t3'
                     || window.location.hash === '#t3'
                     || new URLSearchParams(window.location.search).has('t3');
const isL1Templates   = window.location.pathname === '/L1_templates'
                     || window.location.pathname.startsWith('/L1_templates');
const isL0Lab         = window.location.pathname === '/l0_experiment'
                     || new URLSearchParams(window.location.search).has('l0_experiment');
const isSetup         = window.location.pathname === '/setup';
const isL0T1          = window.location.pathname === '/l0_t1'
                     || window.location.pathname === '/l0-t1';
const isMascotPlayground = window.location.pathname === '/mascot-playground'
                     || window.location.pathname === '/mascot_playground';
const isEmbeddedCTA    = window.location.pathname === '/l1-embedded-cta'
                      || window.location.pathname === '/l1_embedded_cta';
const isExpandedCard   = window.location.pathname === '/l1-expanded-card'
                      || window.location.pathname === '/l1_expanded_card';
const isContinuousCTA  = window.location.pathname === '/l1-continuous-cta'
                      || window.location.pathname === '/l1_continuous_cta';
const isTextTable      = window.location.pathname === '/l1-text-table'
                      || window.location.pathname === '/l1_text_table';
const isCTAIndex       = window.location.pathname === '/cta-exploration';
const isL1Final        = window.location.pathname === '/l1_final'
                      || window.location.pathname === '/l1-final';
const isIndex          = window.location.pathname === '/index'
                      || window.location.pathname === '/prototype-index';
const isMascotIntro    = window.location.pathname === '/mascot-intro'
                      || window.location.pathname === '/mascot_intro';
const isAgentHub       = window.location.pathname === '/agent-hub'
                      || window.location.pathname === '/agent_hub';
const isNewConversation = window.location.pathname === '/new-conversation'
                       || window.location.pathname === '/new_conversation';
const isFoodL1         = window.location.pathname === '/food-l1'
                      || window.location.pathname === '/food_l1';
const isFoodL1Text     = window.location.pathname === '/food-l1-text'
                      || window.location.pathname === '/food_l1_text';
const isFoodL1Pattern  = window.location.pathname === '/food-l1-pattern'
                      || window.location.pathname === '/food_l1_pattern';
const isTravelL1       = window.location.pathname === '/travel-l1'
                      || window.location.pathname === '/travel_l1';
const isL1Scenarios    = window.location.pathname === '/l1-scenarios'
                      || window.location.pathname === '/l1_scenarios';
const isCapabilityL1   = window.location.pathname.startsWith('/l1-category')
                      || window.location.pathname.startsWith('/l1_category');
const isAgentThinkingTrace = window.location.pathname === '/agent_thinking_trace'
                      || window.location.pathname === '/agent-thinking-trace';
const isAgentThinkingV2 = window.location.pathname === '/agent_thinking_v2'
                      || window.location.pathname === '/agent-thinking-v2';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isBeamPOC      ? <BeamButtonPOC /> :
     isInterstitial ? <InterstitialPreviewApp /> :
     isL0Export     ? <L0ExportApp /> :
     isPreview      ? <L0PreviewApp /> :
     isColdStart    ? <ColdStartApp /> :
     isWarmStart    ? <WarmStartApp /> :
     isWarmProfile1 ? <WarmProfile1App /> :
     isWarmProfile1Crisp ? <WarmProfile1CrispApp /> :
     isAgentHubFinal ? <WarmProfile1CrisperApp final /> :
     isWarmProfile1Crisper ? <WarmProfile1CrisperApp /> :
     isWarmProfile2Crisp ? <WarmProfile2CrispApp /> :
     isColdProfile1  ? <ColdProfile1App /> :
     isT2Fashion    ? <T2FashionApp /> :
     isT3           ? <T3App /> :
     isL1Templates  ? <L1TemplatesApp /> :
     isL0Lab        ? <L0AnimationLabApp /> :
     isSetup        ? <App warmFeedMode /> :
     isL0T1         ? <L0T1App /> :
     isMascotPlayground ? <MascotPlaygroundApp /> :
     isEmbeddedCTA      ? <L1EmbeddedCTAPrototype /> :
     isExpandedCard     ? <L1ExpandedCardPrototype /> :
     isContinuousCTA    ? <L1ContinuousCTAPrototype /> :
     isTextTable        ? <L1TextTablePrototype /> :
     isCTAIndex         ? <CTAExplorationIndex /> :
     isL1Final          ? <L1ShoppingTemplate /> :
     isIndex            ? <PrototypeIndex /> :
     isMascotIntro      ? <MascotIntroApp /> :
     isAgentHub         ? <AgentHubApp onBack={() => window.history.back()} /> :
     isNewConversation  ? <NewConversationApp /> :
     isFoodL1           ? <FoodL1Scenarios /> :
     isFoodL1Text       ? <FoodL1TextPage /> :
     isFoodL1Pattern    ? <FoodL1PatternPage /> :
     isTravelL1         ? <TravelL1 /> :
     isL1Scenarios      ? <L1Scenarios /> :
     isCapabilityL1     ? <CapabilityL1App /> :
     isAgentThinkingTrace ? <AgentThinkingTraceApp /> :
     isAgentThinkingV2    ? <AgentThinkingV2App /> :
                          <App />}
  </StrictMode>,
)
