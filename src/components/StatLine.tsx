import { textStats } from '../workflow';

export function StatLine({
  label,
  text,
  bytesPerEstimatedToken,
}: {
  label?: string;
  text: string;
  bytesPerEstimatedToken?: number;
}) {
  const stats = textStats(text, bytesPerEstimatedToken);

  return (
    <div className="node-stat-line">
      {label && <span className="stat-label">{label}</span>}
      <span>{stats.characters} chars</span>
      <span>{stats.words} words</span>
      <span>~{stats.tokens} tokens</span>
    </div>
  );
}
