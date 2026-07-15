import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type SmtpSettings = {
  id: number;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  secure: boolean;
  enabled: boolean;
  updated_at: string;
};

export type SmtpFormValues = Omit<SmtpSettings, "id" | "updated_at">;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(context: any) {
  const { data } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (!data) throw new Error("Forbidden");
}

export const getSmtpSettings = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data, error } = await context.supabase
      .from("smtp_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return (data as SmtpSettings) ?? null;
  });

export const updateSmtpSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: Partial<SmtpFormValues>) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() };
    if (patch.password === "") delete patch.password;
    const { error } = await supabaseAdmin
      .from("smtp_settings")
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .update(patch as any)
      .eq("id", 1);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const sendTestSmtpEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { to: string }) => {
    if (!d.to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(d.to)) throw new Error("Geçerli bir e-posta adresi girin");
    return d;
  })
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: cfg, error } = await supabaseAdmin
      .from("smtp_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    const s = cfg as SmtpSettings | null;
    if (!s || !s.host || !s.port || !s.username || !s.password || !s.from_email) {
      throw new Error("SMTP ayarları eksik. Host, port, kullanıcı, şifre ve gönderen e-posta zorunlu.");
    }

    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: s.host,
      port: s.port,
      secure: s.secure,
      auth: { user: s.username, pass: s.password },
    });

    try {
      await transporter.verify();
    } catch (e) {
      throw new Error(`SMTP bağlantısı başarısız: ${(e as Error).message}`);
    }

    try {
      const info = await transporter.sendMail({
        from: s.from_name ? `"${s.from_name}" <${s.from_email}>` : s.from_email,
        to: data.to,
        subject: "SMTP Test E-postası",
        text: "Bu bir test e-postasıdır. SMTP ayarlarınız doğru çalışıyor.",
        html: `<div style="font-family:sans-serif;padding:16px">
          <h2 style="margin:0 0 8px">SMTP Test Başarılı ✅</h2>
          <p>Bu e-posta admin panelinizden gönderilen bir test mesajıdır. SMTP yapılandırmanız doğru çalışıyor.</p>
          <p style="color:#666;font-size:12px">Gönderim zamanı: ${new Date().toISOString()}</p>
        </div>`,
      });
      return { ok: true, messageId: info.messageId };
    } catch (e) {
      throw new Error(`Gönderim hatası: ${(e as Error).message}`);
    }
  });
