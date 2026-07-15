import brandLogo from "@/assets/brand-logo.png";

export function BrandLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <img
        src={brandLogo}
        alt="hizmetalanı.com logosu"
        width={36}
        height={36}
        className="size-9 rounded-[9px] object-cover shadow-[0_2px_8px_-2px_rgba(30,64,175,0.35)]"
      />
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
