import type { TracePlaybackState } from '../../hooks/useTracePlayback';

export default function DemoController({ playback }: { playback: TracePlaybackState }) {
  const progress = playback.totalDuration > 0 ? playback.elapsedTime / playback.totalDuration : 0;

  return (
    <div className="att-playback-bar">
      <button className="att-playback-btn" onClick={playback.prevStep}>⟵</button>
      <button className="att-playback-btn" onClick={() => (playback.isPlaying ? playback.pause() : playback.play())}>
        {playback.isPlaying ? 'Pause' : 'Play'}
      </button>
      <button className="att-playback-btn" onClick={playback.nextStep}>⟶</button>
      <button className="att-playback-btn" onClick={playback.restart}>Restart</button>
      <div className="att-playback-track">
        <div className="att-playback-fill" style={{ width: `${Math.min(progress, 1) * 100}%` }} />
      </div>
      <span>{playback.speed}x</span>
      <button className="att-playback-btn" onClick={playback.toggleMode}>
        {playback.mode === 'real' ? 'Real timing' : 'Demo timing'}
      </button>
    </div>
  );
}
