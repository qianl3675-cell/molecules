// 品牌标识：分子结构（致敬 Atoms —— 原子组合成分子）
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="mola" x1="0" y1="0" x2="48" y2="48">
          <stop offset="0" stopColor="#a78bfa" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      <line x1="14" y1="14" x2="34" y2="34" stroke="url(#mola)" strokeWidth="3" strokeLinecap="round" />
      <line x1="34" y1="14" x2="14" y2="34" stroke="url(#mola)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="24" cy="24" r="8" fill="url(#mola)" />
      <circle cx="11" cy="11" r="6" fill="#c4b5fd" fillOpacity="0.9" />
      <circle cx="37" cy="11" r="6" fill="#8b5cf6" fillOpacity="0.9" />
      <circle cx="11" cy="37" r="6" fill="#8b5cf6" fillOpacity="0.9" />
      <circle cx="37" cy="37" r="6" fill="#c4b5fd" fillOpacity="0.9" />
    </svg>
  );
}

export function LogoText() {
  return (
    <span className="flex items-center gap-2">
      <Logo />
      <span className="text-[17px] font-bold tracking-wide">
        Molecules
        <span className="ml-1.5 hidden text-[11px] font-normal text-zinc-500 sm:inline">AI 应用工坊</span>
      </span>
    </span>
  );
}
