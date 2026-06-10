type AuthErrorLike = { code?: string; message?: string } | null | undefined;

/** Map common Better Auth error codes to Bahasa Indonesia (PRD §13.2). */
const MESSAGES: Record<string, string> = {
  USER_ALREADY_EXISTS: "Email ini sudah terdaftar. Silakan masuk.",
  DISPOSABLE_EMAIL: "Gunakan email permanen, bukan email sementara untuk mendaftar.",
  INVALID_EMAIL_OR_PASSWORD: "Email atau password salah.",
  EMAIL_NOT_VERIFIED: "Email Anda belum diverifikasi.",
  INVALID_TOKEN: "Tautan tidak valid atau sudah kedaluwarsa.",
  PASSWORD_TOO_SHORT: "Password minimal 8 karakter.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Akun tidak ditemukan.",
  FAILED_TO_CREATE_USER: "Gagal membuat akun. Coba lagi.",
};

export function authErrorMessage(
  error: AuthErrorLike,
  fallback = "Terjadi kesalahan. Silakan coba lagi.",
): string {
  if (!error) return fallback;
  if (error.code && MESSAGES[error.code]) return MESSAGES[error.code];
  return error.message || fallback;
}

export function isEmailNotVerified(error: AuthErrorLike): boolean {
  return error?.code === "EMAIL_NOT_VERIFIED";
}
