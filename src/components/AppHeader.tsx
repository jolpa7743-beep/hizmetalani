import { Link, useNavigate, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { LogOut, MessageSquare, Plus, User as UserIcon, Menu, X, LayoutList } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
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
  const navigate = useNavigate();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur supports-[backdrop-filter]:bg-surface/80">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="shrink-0">
          <BrandLogo />
        </Link>

        <nav className="hidden md:flex items-center gap-1 text-sm">
          <Link to="/" className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
            İlanlar
          </Link>
          <Link to="/nasil-calisir" className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
            Nasıl Çalışır?
          </Link>
          <Link to="/guvenlik" className="px-3 py-2 rounded-md hover:bg-muted text-foreground/80 hover:text-foreground">
            Güvenlik
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {!loading && !user && (
            <>
              <Button variant="ghost" size="sm" asChild>
                <Link to="/auth">Giriş Yap</Link>
              </Button>
              <Button size="sm" asChild>
                <Link to="/auth" search={{ mode: "signup" }}>
                  Üye Ol
                </Link>
              </Button>
            </>
          )}
          {user && (
            <>
              <Button size="sm" asChild className="bg-brand hover:bg-brand/90">
                <Link to="/ilan-ver">
                  <Plus className="size-4 mr-1" /> Ücretsiz İlan Ver
                </Link>
              </Button>
              <Button variant="ghost" size="icon" asChild aria-label="Mesajlar">
                <Link to="/mesajlar">
                  <MessageSquare className="size-5" />
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <Avatar className="size-9 border border-border">
                      <AvatarFallback className="bg-brand text-brand-foreground text-sm">
                        {(user.email ?? "?").slice(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate({ to: "/profil" })}>
                    <UserIcon className="size-4 mr-2" /> Profilim
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/ilanlarim" })}>
                    <LayoutList className="size-4 mr-2" /> İlanlarım
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate({ to: "/mesajlar" })}>
                    <MessageSquare className="size-4 mr-2" /> Mesajlarım
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="size-4 mr-2" /> Çıkış Yap
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>

        <button
          className="md:hidden p-2 -mr-2"
          aria-label="Menu"
          onClick={() => setMobileOpen((v) => !v)}
        >
          {mobileOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border bg-surface px-4 py-3 space-y-1">
          <Link to="/" className="block py-2" onClick={() => setMobileOpen(false)}>
            İlanlar
          </Link>
          <Link to="/nasil-calisir" className="block py-2" onClick={() => setMobileOpen(false)}>
            Nasıl Çalışır?
          </Link>
          <Link to="/guvenlik" className="block py-2" onClick={() => setMobileOpen(false)}>
            Güvenlik
          </Link>
          <div className="pt-2 border-t border-border mt-2 flex flex-col gap-2">
            {user ? (
              <>
                <Button asChild className="justify-start bg-brand hover:bg-brand/90">
                  <Link to="/ilan-ver" onClick={() => setMobileOpen(false)}>
                    <Plus className="size-4 mr-1" /> Ücretsiz İlan Ver
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link to="/mesajlar" onClick={() => setMobileOpen(false)}>
                    <MessageSquare className="size-4 mr-2" /> Mesajlarım
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link to="/ilanlarim" onClick={() => setMobileOpen(false)}>
                    <LayoutList className="size-4 mr-2" /> İlanlarım
                  </Link>
                </Button>
                <Button variant="outline" asChild className="justify-start">
                  <Link to="/profil" onClick={() => setMobileOpen(false)}>
                    <UserIcon className="size-4 mr-2" /> Profilim
                  </Link>
                </Button>
                <Button variant="ghost" onClick={() => { signOut(); setMobileOpen(false); }} className="justify-start text-destructive">
                  <LogOut className="size-4 mr-2" /> Çıkış Yap
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>Giriş Yap</Link>
                </Button>
                <Button asChild>
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
