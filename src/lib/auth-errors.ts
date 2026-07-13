/**
 * Supabase auth hata mesajlarını Türkçeye çevirir.
 * Bilinmeyen mesajları olduğu gibi döndürür.
 */
export function translateAuthError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err ?? "");
  const msg = raw.toLowerCase();

  if (msg.includes("invalid login credentials")) return "E-posta veya şifre hatalı.";
  if (msg.includes("email not confirmed")) return "E-postanızı henüz doğrulamadınız. Gelen kutunuzu kontrol edin.";
  if (msg.includes("user already registered") || msg.includes("already been registered") || msg.includes("email_exists")) {
    return "Bu e-posta adresi zaten kayıtlı. Giriş yapmayı deneyin.";
  }
  if (msg.includes("password should be at least")) return "Şifre en az 6 karakter olmalı.";
  if (msg.includes("password") && msg.includes("weak")) return "Şifre çok zayıf. Daha güçlü bir şifre seçin.";
  if (msg.includes("password") && msg.includes("leaked")) return "Bu şifre veri sızıntılarında görüldü. Farklı bir şifre seçin.";
  if (msg.includes("unable to validate email") || msg.includes("invalid email")) return "Geçerli bir e-posta adresi girin.";
  if (msg.includes("user not found")) return "Böyle bir kullanıcı bulunamadı.";
  if (msg.includes("over_email_send_rate_limit") || msg.includes("rate limit")) {
    return "Çok fazla deneme yapıldı, lütfen bir süre bekleyin.";
  }
  if (msg.includes("signup requires a valid password") || msg.includes("password is required")) {
    return "Geçerli bir şifre girin.";
  }
  if (msg.includes("network") || msg.includes("failed to fetch")) return "Bağlantı hatası. İnternetinizi kontrol edin.";
  if (msg.includes("captcha")) return "Doğrulama başarısız. Tekrar deneyin.";
  if (msg.includes("token has expired") || msg.includes("otp_expired")) return "Doğrulama süresi doldu. Yeniden deneyin.";
  if (msg.includes("provider is not enabled")) return "Bu giriş yöntemi henüz aktif değil.";
  if (msg.includes("forbidden")) return "Bu işlem için yetkiniz yok.";

  return raw || "Bilinmeyen bir hata oluştu.";
}

/**
 * Şifre canlı doğrulama. Boşsa null döner (henüz yazmaya başlamamış).
 */
export function validatePasswordLive(password: string): string | null {
  if (!password) return null;
  if (password.length < 6) return `Şifre en az 6 karakter olmalı (şu an ${password.length})`;
  if (password.length > 72) return "Şifre 72 karakterden uzun olamaz";
  return null;
}

export function validateEmailLive(email: string): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return "Geçerli bir e-posta adresi girin";
  return null;
}
