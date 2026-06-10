/**
 * Block sign-ups from disposable / throwaway email providers. This is a curated
 * starter list of the most common domains — extend `DISPOSABLE_EMAIL_DOMAINS`
 * as needed. Matching is case-insensitive and covers subdomains (e.g.
 * `foo.mailinator.com`).
 */
export const DISPOSABLE_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  "mailinator.com",
  "guerrillamail.com",
  "guerrillamail.info",
  "guerrillamail.net",
  "sharklasers.com",
  "grr.la",
  "10minutemail.com",
  "10minutemail.net",
  "20minutemail.com",
  "temp-mail.org",
  "tempmail.com",
  "tempmailo.com",
  "tempr.email",
  "throwawaymail.com",
  "getnada.com",
  "nada.email",
  "yopmail.com",
  "yopmail.net",
  "dispostable.com",
  "fakeinbox.com",
  "trashmail.com",
  "trashmail.de",
  "maildrop.cc",
  "mailnesia.com",
  "mohmal.com",
  "mintemail.com",
  "emailondeck.com",
  "spam4.me",
  "tempmail.dev",
  "mailcatch.com",
  "moakt.com",
  "luxusmail.org",
  "burnermail.io",
  "discard.email",
  "tmail.ws",
  "tmpmail.org",
  "1secmail.com",
  "1secmail.net",
  "1secmail.org",
  "mailpoof.com",
  "harakirimail.com",
]);

/** Extract the (lowercased) domain from an email address, or null if malformed. */
export function emailDomain(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0 || at === email.length - 1) return null;
  return email.slice(at + 1).trim().toLowerCase();
}

/** True when the email's domain (or a parent domain) is a known disposable provider. */
export function isDisposableEmail(email: string): boolean {
  const domain = emailDomain(email);
  if (!domain) return false;
  if (DISPOSABLE_EMAIL_DOMAINS.has(domain)) return true;
  // Catch subdomains like `inbox.mailinator.com`.
  const parts = domain.split(".");
  for (let i = 1; i < parts.length - 1; i++) {
    if (DISPOSABLE_EMAIL_DOMAINS.has(parts.slice(i).join("."))) return true;
  }
  return false;
}
