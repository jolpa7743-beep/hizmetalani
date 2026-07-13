import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogOut, MessageSquare, Plus, User as UserIcon, Menu, X, LayoutList, Shield, LifeBuoy } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-is-admin";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export function AppHeader() {
  const { user, loading } = useAuth();
  const { isAdmin } = useIsAdmin();
  const navigate = useNavigate();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile menu on route change / escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMobileOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  const navLink = "px-3 py-2 rounded-md text-sm font-medium text-foreground/75 hover:text-foreground hover:bg-muted transition-colors";

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/85 backdrop-blur-md supports-[backdrop-filter]:bg-surface/70">
      <div className="mx-auto grid h-16 max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="hizmetalanı.com anasayfa">
          <BrandLogo />
        </Link>

        <nav aria-label="Ana menü" className="hidden md:flex items-center justify-center gap-1">
          <Link to="/" className={navLink} activeOptions={{ exact: true }} activeProps={{ className: "px-3 py-2 rounded-md text-sm font-medium text-brand bg-brand-soft" }}>
            İlanlar
          </Link>
          <Link to="/nasil-calisir" className={navLink}>Nasıl Çalışır?</Link>
          <Link to="/guvenlik" className={navLink}>Güvenlik</Link>
          <Link to="/hakkimizda" className={navLink}>Hakkımızda</Link>
        </nav>

        <div className="hidden md:flex items-center gap-2 justify-self-end">
          {!loading && !user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Giriş Yap</Link>
              </Button>
              <Button size="sm" asChild className="bg-brand hover:bg-brand/90">
                <Link to="/auth" search={{ mode: "signup" }}>Üye Ol</Link>
              </Button>
            </>
          )}
          {user && (
            <>
              <Button size="sm" asChild className="bg-brand hover:bg-brand/90 shadow-sm">
                <Link to="/ilan-ver">
                  <Plus className="size-4 mr-1" aria-hidden /> Ücretsiz İlan Ver
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Mesajlar" className="min-h-11 min-w-11">
                <Link to="/mesajlar"><MessageSquare className="size-5" aria-hidden /></Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
                    aria-label="Hesap menüsü"
                  >
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="bg-brand text-brand-foreground text-sm font-semibold">
                        {(user.email ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                    <UserIcon className="size-4 mr-2" aria-hidden /> Profilim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/ilanlarim" })}>
                    <LayoutList className="size-4 mr-2" aria-hidden /> İlanlarım
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/mesajlar" })}>
                    <MessageSquare className="size-4 mr-2" aria-hidden /> Mesajlarım
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/destek" })}>
                    <LifeBuoy className="size-4 mr-2" aria-hidden /> Destek
                  </DropdownMenuItem>
                  {isAdmin && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                        <Shield className="size-4 mr-2 text-brand" aria-hidden /> Yönetici Paneli
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="size-4 mr-2" aria-hidden /> Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <button
          className="md:hidden inline-flex min-h-11 min-w-11 items-center justify-center rounded-md text-foreground hover:bg-muted justify-self-end"
          aria-label={mobileOpen ? "Menüyü kapat" : "Menüyü aç"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-1 shadow-sm">
          <Link to="/" className="block rounded-md px-3 py-3 text-base font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>
            İlanlar
          </Link>
          <Link to="/nasil-calisir" className="block rounded-md px-3 py-3 text-base font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>
            Nasıl Çalışır?
          </Link>
          <Link to="/guvenlik" className="block rounded-md px-3 py-3 text-base font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>
            Güvenlik
          </Link>
          <Link to="/hakkimizda" className="block rounded-md px-3 py-3 text-base font-medium hover:bg-muted" onClick={() => setMobileOpen(false)}>
            Hakkımızda
          </Link>
          <div className="pt-3 border-t border-border mt-3 flex flex-col gap-2">
            {user ? (
              <>
                <Button asChild className="justify-start bg-brand hover:bg-brand/90 h-11">
                  <Link to="/ilan-ver" onClick={() => setMobileOpen(false)}>
                    <Plus className="size-4 mr-1" aria-hidden /> Ücretsiz İlan Ver
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-11">
                  <Link to="/mesajlar" onClick={() => setMobileOpen(false)}>
                    <MessageSquare className="size-4 mr-2" aria-hidden /> Mesajlarım
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-11">
                  <Link to="/ilanlarim" onClick={() => setMobileOpen(false)}>
                    <LayoutList className="size-4 mr-2" aria-hidden /> İlanlarım
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start h-11">
                  <Link to="/profil" onClick={() => setMobileOpen(false)}>
                    <UserIcon className="size-4 mr-2" aria-hidden /> Profilim
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => { signOut(); setMobileOpen(false); }} className="justify-start text-destructive h-11">
                  <LogOut className="size-4 mr-2" aria-hidden /> Çıkış Yap
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild className="h-11">
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Giriş Yap</Link>
                </Button>
                <Button asChild className="h-11 bg-brand hover:bg-brand/90">
                  <Link to="/auth" search={{ mode: "signup" }} onClick={() => setMobileOpen(false)}>Üye Ol</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
