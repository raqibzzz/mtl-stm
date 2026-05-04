'use client';

interface Props {
  mode: 'heatmap' | 'cartogram';
  loading: boolean;
  onToggle: () => void;
}

export default function ModeToggle({ mode, loading, onToggle }: Props) {
  return (
    <button
      onClick={onToggle}
      disabled={loading}
      className="flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-medium text-gray-800 shadow-lg backdrop-blur transition hover:bg-white disabled:opacity-60"
    >
      {loading ? (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-gray-800" />
      ) : mode === 'heatmap' ? (
        '⬡ Cartogram'
      ) : (
        '◼ Heatmap'
      )}
    </button>
  );
}
