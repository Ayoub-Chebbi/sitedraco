"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4 text-center px-4">
      <h2 className="text-xl font-bold text-white">Une erreur est survenue</h2>
      {error.digest && (
        <p className="text-xs text-gray-500 font-mono">Digest: {error.digest}</p>
      )}
      <button
        onClick={reset}
        className="px-4 py-2 rounded-lg bg-purple-700 text-white text-sm hover:bg-purple-600 transition-colors"
      >
        Réessayer
      </button>
    </div>
  );
}
