export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <svg width="34" height="34" viewBox="0 0 40 40" fill="none" aria-hidden>
        <rect width="40" height="40" rx="9" fill="url(#hz-g)" />
        <path
          d="M12 27V13h3v5.5h10V13h3v14h-3v-5.5H15V27h-3Z"
          fill="white"
        />
        <defs>
          <linearGradient id="hz-g" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#1E40AF" />
            <stop offset="1" stopColor="#0EA5E9" />
          </linearGradient>
        </defs>
      </svg>
      <div className="leading-tight">
        <div className="text-display text-[18px] text-foreground">
          hizmetalanı<span className="text-brand-accent">.com</span>
        </div>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          İş & Hizmet İlanları
        </div>
      </div>
    </div>
  );
}
