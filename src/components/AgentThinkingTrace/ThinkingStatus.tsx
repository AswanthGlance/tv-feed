import { MagnifyingGlassIcon } from './icons';

export default function ThinkingStatus({ label }: { label: string }) {
  return (
    <div className="att-status-row">
      <MagnifyingGlassIcon className="att-status-icon" />
      <span className="att-status-text">{label}</span>
    </div>
  );
}
