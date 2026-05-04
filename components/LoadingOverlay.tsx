'use client';

export default function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-white/90 px-8 py-6 shadow-xl">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600" />
        <p className="text-sm font-medium text-gray-700">{message}</p>
      </div>
    </div>
  );
}
