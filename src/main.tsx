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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isBeamPOC      ? <BeamButtonPOC /> :
     isInterstitial ? <InterstitialPreviewApp /> :
     isL0Export     ? <L0ExportApp /> :
     isPreview      ? <L0PreviewApp /> :
     isColdStart    ? <ColdStartApp /> :
     isWarmStart    ? <WarmStartApp /> :
     isWarmProfile1 ? <WarmProfile1App /> :
     isT2Fashion    ? <T2FashionApp /> :
     isT3           ? <T3App /> :
     isL1Templates  ? <L1TemplatesApp /> :
     isL0Lab        ? <L0AnimationLabApp /> :
                      <App />}
  </StrictMode>,
)
