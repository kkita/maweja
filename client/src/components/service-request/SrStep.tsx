export function SrStep({ n }: { n: number }) {
  return (
    <span className="w-6 h-6 bg-red-600 text-white rounded-full text-[11px] font-black flex items-center justify-center flex-shrink-0">
      {n}
    </span>
  );
}
