/**
 * Minimal, dependency-free HTML email templates with RenderAI branding.
 * All copy in Bahasa Indonesia (PRD §25).
 */

const BRAND_NAVY = "#1b2a5e";
const INK = "#16181d";

function layout(opts: {
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footnote?: string;
}): string {
  const { heading, body, cta, footnote } = opts;
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f7f7f5;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 0;">
      <tr><td align="center">
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e7e7e3;border-radius:16px;overflow:hidden;">
          <tr><td style="padding:28px 32px 8px;">
            <span style="display:inline-block;width:28px;height:28px;background:${BRAND_NAVY};border-radius:8px;vertical-align:middle;"></span>
            <span style="font-size:18px;font-weight:800;letter-spacing:-0.02em;vertical-align:middle;margin-left:8px;">RenderAI<span style="color:${BRAND_NAVY}">.</span></span>
          </td></tr>
          <tr><td style="padding:8px 32px 0;">
            <h1 style="font-size:22px;font-weight:800;letter-spacing:-0.02em;margin:12px 0;">${heading}</h1>
            <div style="font-size:15px;line-height:1.6;color:#3f434b;">${body}</div>
          </td></tr>
          ${
            cta
              ? `<tr><td style="padding:24px 32px 8px;">
            <a href="${cta.url}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:12px 24px;border-radius:9999px;">${cta.label}</a>
          </td></tr>
          <tr><td style="padding:4px 32px 0;">
            <div style="font-size:12px;color:#9096a0;word-break:break-all;">Atau salin tautan ini: ${cta.url}</div>
          </td></tr>`
              : ""
          }
          <tr><td style="padding:24px 32px 28px;">
            <div style="font-size:12px;color:#9096a0;border-top:1px solid #f0f0ed;padding-top:16px;">${footnote ?? "Email ini dikirim otomatis oleh RenderAI. Abaikan jika Anda tidak meminta."}</div>
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function verificationEmail(params: { name?: string; url: string }) {
  return {
    subject: "Verifikasi email RenderAI Anda",
    html: layout({
      heading: `Halo${params.name ? ` ${params.name}` : ""}, yuk verifikasi email`,
      body: "Satu langkah lagi! Klik tombol di bawah untuk memverifikasi email Anda dan mendapatkan <b>3 kredit gratis</b> untuk mulai render.",
      cta: { label: "Verifikasi Email", url: params.url },
      footnote: "Tautan ini berlaku 24 jam. Abaikan jika Anda tidak mendaftar.",
    }),
  };
}

export function resetPasswordEmail(params: { name?: string; url: string }) {
  return {
    subject: "Atur ulang password RenderAI",
    html: layout({
      heading: "Atur ulang password Anda",
      body: "Kami menerima permintaan untuk mengatur ulang password. Klik tombol di bawah untuk membuat password baru.",
      cta: { label: "Atur Ulang Password", url: params.url },
      footnote:
        "Tautan ini berlaku 30 menit dan hanya bisa dipakai sekali. Abaikan jika bukan Anda.",
    }),
  };
}
