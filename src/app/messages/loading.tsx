export default function Loading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#0055d7]/30 border-t-[#0055d7] rounded-full animate-spin" />
        <p className="text-sm text-[#414950]">Loading…</p>
      </div>
    </div>
  );
}
