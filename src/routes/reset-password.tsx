import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, KeyRound } from "lucide-react";
import { translateAuthError, validatePasswordLive } from "@/lib/auth-errors";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  head: () => ({
    meta: [
      { title: "Şifre Sıfırla — hizmetalanı.com" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Supabase auto-processes the recovery token from the URL hash on load.
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Also check current session in case the event already fired
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const pwError = validatePasswordLive(password);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (pwError) return setError(pwError);
    if (password !== confirm) return setError("Şifreler eşleşmiyor");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.");
      await supabase.auth.signOut();
      navigate({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      const msg = translateAuthError(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-10 bg-gradient-to-br from-brand/5 via-background to-brand-accent/5">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto grid size-12 place-items-center rounded-full bg-brand/10 text-brand mb-2">
            <KeyRound className="size-6" />
          </div>
          <CardTitle className="text-2xl">Yeni şifre belirleyin</CardTitle>
          <CardDescription>
            {ready
              ? "En az 6 karakterli yeni bir şifre belirleyin."
              : "Bağlantı doğrulanıyor…"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? (
            <div className="flex justify-center py-6 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
            </div>
          ) : (
            <form onSubmit={onSubmit} className="space-y-3">
              <div>
                <Label htmlFor="new-password">Yeni şifre</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete="new-password"
                />
                {pwError && <p className="mt-1 text-xs text-destructive">{pwError}</p>}
              </div>
              <div>
                <Label htmlFor="confirm-password">Yeni şifre (tekrar)</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirm}
                  onChange={(e) => { setConfirm(e.target.value); setError(null); }}
                  required
                  minLength={6}
                  maxLength={72}
                  autoComplete="new-password"
                />
              </div>
              {error && (
                <Alert variant="destructive" className="py-2">
                  <AlertCircle className="size-4" />
                  <AlertDescription className="text-sm">{error}</AlertDescription>
                </Alert>
              )}
              <Button type="submit" disabled={loading || !password || !confirm} className="w-full h-11 bg-brand hover:bg-brand/90">
                {loading && <Loader2 className="size-4 mr-2 animate-spin" />}
                Şifreyi Güncelle
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
