import T3ConversationStarter from './components/T3/T3ConversationStarter';

/* Wraps T3 in the same 1920×1080 stage shell used by T2FashionApp */
export default function T3App() {
  return (
    <div id="scaler">
      <div id="stage">
        <T3ConversationStarter
          onYes={() => console.log('[T3] User intent: YES — plan a trip')}
          onNo={() => console.log('[T3] User intent: NO — not this time')}
        />
      </div>
    </div>
  );
}
