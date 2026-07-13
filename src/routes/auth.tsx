import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/hooks/use-auth";
import { seedDemoUsers } from "@/lib/admin.functions";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { translateAuthError, validatePasswordLive, validateEmailLive } from "@/lib/auth-errors";

const searchSchema = z.object({
  mode: z.enum(["signin", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  component: AuthPage,
  head: () => ({ meta: [{ title: "Giriş Yap / Üye Ol — hizmetalanı.com" }] }),
});

function getPasswordStrength(pw: string): { score: 0 | 1 | 2 | 3; label: string; color: string } {
  if (!pw) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pw.length >= 6) score++;
  if (pw.length >= 10) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)) score++;
  const labels = ["Çok zayıf", "Zayıf", "Orta", "Güçlü"] as const;
  const colors = ["bg-destructive", "bg-amber-500", "bg-yellow-500", "bg-emerald-500"];
  return { score: score as 0 | 1 | 2 | 3, label: labels[score], color: colors[score] };
}

function AuthPage() {
  const { user } = useAuth();
  const search = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"signin" | "signup">(search.mode ?? "signin");
  const [loading, setLoading] = useState<null | "email" | "google" | "seed">(null);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const seed = useServerFn(seedDemoUsers);

  // Live validation
  const emailError = validateEmailLive(form.email);
  const passwordError = validatePasswordLive(form.password);
  const passwordStrength = getPasswordStrength(form.password);

  const fillDemo = (kind: "demo" | "admin") => {
    setTab("signin");
    setSubmitError(null);
    const password = kind === "demo" ? "demo1234" : "admin123";
    setForm({ email: `${kind}@${kind}.com`, password, fullName: "" });
  };

  const runSeed = async () => {
    setLoading("seed");
    setSubmitError(null);
    try {
      await seed();
      toast.success("Demo hesaplar hazır! demo@demo.com/demo1234 veya admin@admin.com/admin123");
    } catch (e) {
      const msg = translateAuthError(e);
      toast.error(msg);
      setSubmitError(msg);
    } finally {
      setLoading(null);
    }
  };

  useEffect(() => {
    if (user) navigate({ to: search.redirect ?? "/" });
  }, [user, navigate, search.redirect]);

  const onEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Client-side validation
    if (emailError || !form.email) {
      setSubmitError(emailError ?? "E-posta adresinizi girin");
      return;
    }
    if (passwordError || !form.password) {
      setSubmitError(passwordError ?? "Şifrenizi girin");
      return;
    }

    setLoading("email");
    try {
      if (tab === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { full_name: form.fullName.trim() || null },
          },
        });
        if (error) throw error;
        toast.success("Kayıt başarılı! E-postanızı doğrulamayı unutmayın.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        toast.success("Hoş geldiniz!");
      }
    } catch (err) {
      const msg = translateAuthError(err);
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  const onGoogle = async () => {
    setLoading("google");
    setSubmitError(null);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      const msg = translateAuthError(result.error);
      toast.error(msg);
      setSubmitError(msg);
      setLoading(null);
      return;
    }
    if (!result.redirected) {
      toast.success("Giriş başarılı!");
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand/5 via-background to-brand-accent/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">hizmetalanı'na hoş geldiniz</CardTitle>
          <CardDescription>Giriş yapın veya ücretsiz hesap oluşturun</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={(v) => setTab(v as "signin" | "signup")}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signin">Giriş Yap</TabsTrigger>
              <TabsTrigger value="signup">Üye Ol</TabsTrigger>
            </TabsList>

            <div className="pt-4 space-y-3">
              <Button
                type="button"
                variant="outline"
                className="w-full h-11"
                onClick={onGoogle}
                disabled={loading !== null}
              >
                {loading === "google" ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <svg className="size-4 mr-2" viewBox="0 0 48 48" aria-hidden>
                    <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.6l6.7-6.7C35.6 2.5 30.2 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.8 6c1.9-5.6 7.2-9.7 13.6-9.7z"/>
                    <path fill="#4285F4" d="M46.5 24.6c0-1.6-.2-3.1-.4-4.6H24v9.1h12.7c-.6 3-2.3 5.5-4.9 7.2l7.6 5.9c4.4-4.1 7.1-10.1 7.1-17.6z"/>
                    <path fill="#FBBC05" d="M10.4 28.5c-.5-1.4-.8-2.9-.8-4.5s.3-3.1.8-4.5l-7.8-6C1 16.7 0 20.2 0 24s1 7.3 2.6 10.5l7.8-6z"/>
                    <path fill="#34A853" d="M24 48c6.5 0 12-2.1 16-5.8l-7.6-5.9c-2.1 1.4-4.8 2.3-8.4 2.3-6.4 0-11.8-4.1-13.7-9.7l-7.8 6C6.5 42.6 14.6 48 24 48z"/>
                  </svg>
                )}
                Google ile devam et
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">veya</span>
                </div>
              </div>

              <form onSubmit={onEmailSubmit} className="space-y-3">
                <TabsContent value="signup" className="space-y-3 m-0">
                  <div>
                    <Label htmlFor="fullName">Ad Soyad</Label>
                    <Input
                      id="fullName"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      placeholder="Adınız Soyadınız"
                      maxLength={80}
                    />
                  </div>
                </TabsContent>
                <div>
                  <Label htmlFor="email">E-posta</Label>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setSubmitError(null); }}
                    placeholder="ornek@eposta.com"
                    required
                    aria-invalid={!!emailError}
                    aria-describedby={emailError ? "email-error" : undefined}
                    className={emailError ? "border-destructive focus-visible:ring-destructive/40" : ""}
                  />
                  {emailError && (
                    <p id="email-error" className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" /> {emailError}
                    </p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Şifre</Label>
                    {tab === "signup" && form.password && !passwordError && (
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="size-3 text-emerald-600" /> {passwordStrength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={tab === "signup" ? "new-password" : "current-password"}
                      value={form.password}
                      onChange={(e) => { setForm({ ...form, password: e.target.value }); setSubmitError(null); }}
                      placeholder="En az 6 karakter"
                      required
                      minLength={6}
                      maxLength={72}
                      aria-invalid={!!passwordError}
                      aria-describedby={passwordError ? "password-error" : undefined}
                      className={`pr-10 ${passwordError ? "border-destructive focus-visible:ring-destructive/40" : ""}`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-muted-foreground hover:text-foreground rounded"
                      aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                  {passwordError ? (
                    <p id="password-error" className="mt-1 text-xs text-destructive flex items-center gap-1">
                      <AlertCircle className="size-3" /> {passwordError}
                    </p>
                  ) : tab === "signup" && form.password ? (
                    <div className="mt-1.5 flex gap-1" aria-hidden>
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className={`h-1 flex-1 rounded-full transition-colors ${
                            i < passwordStrength.score ? passwordStrength.color : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  ) : null}
                </div>

                {submitError && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="text-sm">{submitError}</AlertDescription>
                  </Alert>
                )}

                <Button
                  type="submit"
                  disabled={loading !== null || !!emailError || !!passwordError || !form.email || !form.password}
                  className="w-full h-11 bg-brand hover:bg-brand/90"
                >
                  {loading === "email" && <Loader2 className="size-4 mr-2 animate-spin" />}
                  {tab === "signup" ? "Ücretsiz Üye Ol" : "Giriş Yap"}
                </Button>
              </form>

              <div className="rounded-lg border border-dashed border-brand/40 bg-brand/5 p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-medium text-brand">
                  <Sparkles className="size-3.5" /> Demo Hesaplar
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Test için hazır hesaplar. İlk kez kullanıyorsanız "Oluştur" ile hesapları hazırlayın.
                </p>
                <div className="grid grid-cols-3 gap-1.5">
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => fillDemo("demo")}>
                    demo1234
                  </Button>
                  <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => fillDemo("admin")}>
                    admin123
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="h-8 text-xs bg-brand hover:bg-brand/90"
                    onClick={runSeed}
                    disabled={loading !== null}
                  >
                    {loading === "seed" ? <Loader2 className="size-3 animate-spin" /> : "Oluştur"}
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Devam ederek{" "}
                <a href="/kullanim-kosullari" className="underline hover:text-brand">Kullanım Koşullarını</a> ve{" "}
                <a href="/gizlilik" className="underline hover:text-brand">Gizlilik Politikasını</a> kabul edersiniz.
              </p>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
