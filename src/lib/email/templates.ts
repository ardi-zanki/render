/**
 * Minimal, dependency-free HTML email templates with RenderAI branding.
 * All copy in Bahasa Indonesia (PRD §25).
 */

const BRAND_NAVY = "#102a56";
const INK = "#121826";
const MUTED = "#68758a";
const BORDER = "#dbe3ef";

function layout(opts: {
  heading: string;
  body: string;
  cta?: { label: string; url: string };
  footnote?: string;
}): string {
  const { heading, body, cta, footnote } = opts;
  return `<!doctype html>
<html lang="id">
  <body style="margin:0;background:#f6f8fb;font-family:'Plus Jakarta Sans',Arial,sans-serif;color:${INK};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 12px;">
      <tr><td align="center">
        <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="width:100%;max-width:520px;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);">
          <tr><td style="height:4px;background:${BRAND_NAVY};font-size:0;line-height:0;">&nbsp;</td></tr>
          <tr><td style="padding:26px 30px 8px;">
            <span style="display:inline-block;width:30px;height:30px;background:${BRAND_NAVY};border-radius:8px;vertical-align:middle;"></span>
            <span style="font-size:18px;font-weight:800;letter-spacing:0;vertical-align:middle;margin-left:9px;">RenderAI<span style="color:${BRAND_NAVY}">.</span></span>
          </td></tr>
          <tr><td style="padding:8px 30px 0;">
            <h1 style="font-size:21px;line-height:1.35;font-weight:800;letter-spacing:0;margin:12px 0;color:${INK};">${heading}</h1>
            <div style="font-size:14px;line-height:1.72;color:#3f4a5d;">${body}</div>
          </td></tr>
          ${
            cta
              ? `<tr><td style="padding:24px 30px 8px;">
            <a href="${cta.url}" style="display:inline-block;background:${BRAND_NAVY};color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:11px 18px;border-radius:8px;">${cta.label}</a>
          </td></tr>
          <tr><td style="padding:4px 30px 0;">
            <div style="font-size:12px;line-height:1.6;color:${MUTED};word-break:break-all;">Atau salin tautan ini: ${cta.url}</div>
          </td></tr>`
              : ""
          }
          <tr><td style="padding:24px 30px 28px;">
            <div style="font-size:12px;line-height:1.6;color:${MUTED};border-top:1px solid #eef2f7;padding-top:16px;">${footnote ?? "Email ini dikirim otomatis oleh RenderAI. Abaikan jika Anda tidak meminta."}</div>
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
      heading: `Halo${params.name ? ` ${params.name}` : ""}, verifikasi email Anda`,
      body: "Klik tombol di bawah untuk mengaktifkan akun RenderAI dan mendapatkan kredit awal untuk mencoba workflow render pertama Anda.",
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
      body: "Kami menerima permintaan untuk mengatur ulang password akun RenderAI Anda. Klik tombol di bawah untuk membuat password baru.",
      cta: { label: "Atur Ulang Password", url: params.url },
      footnote:
        "Tautan ini berlaku 30 menit dan hanya bisa dipakai sekali. Abaikan jika bukan Anda.",
    }),
  };
}

export function renderResultEmail(params: {
  success: boolean;
  url: string;
}) {
  return {
    subject: params.success
      ? "Render Anda sudah selesai"
      : "Render Anda gagal diproses",
    html: layout({
      heading: params.success ? "Render Anda sudah selesai" : "Render gagal",
      body: params.success
        ? "Visual arsitektur Anda sudah selesai diproses. Buka hasilnya untuk meninjau, mengunduh, atau membagikan preview."
        : "Maaf, render Anda gagal diproses dan <b>kredit sudah dikembalikan</b>. Silakan coba lagi dari Render Studio.",
      cta: {
        label: params.success ? "Lihat Hasil" : "Coba Lagi",
        url: params.url,
      },
    }),
  };
}

export function paymentSuccessEmail(params: { credits: number; url: string }) {
  return {
    subject: "Pembayaran berhasil - kredit ditambahkan",
    html: layout({
      heading: "Pembayaran berhasil!",
      body: `<b>${params.credits} kredit</b> sudah ditambahkan ke akun Anda. Kredit siap digunakan untuk membuat render berikutnya.`,
      cta: { label: "Mulai Render", url: params.url },
    }),
  };
}

export function lowCreditEmail(params: { balance: number; url: string }) {
  return {
    subject: "Kredit RenderAI Anda menipis",
    html: layout({
      heading: "Kredit Anda menipis",
      body: `Sisa kredit Anda tinggal <b>${params.balance}</b>. Top up sekarang agar bisa melanjutkan render tanpa terputus.`,
      cta: { label: "Top up Kredit", url: params.url },
      footnote:
        "Email ini hanya dikirim sekali saat kredit Anda mulai menipis.",
    }),
  };
}
