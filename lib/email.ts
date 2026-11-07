import "server-only";
import { SITE, FOUNDING_OFFER } from "./config";
import type { Album } from "./types";

/**
 * Transactional email via Resend's HTTP API (no SDK needed).
 * Without RESEND_API_KEY, emails are printed to the server log so local testing still works.
 */
async function send(to: string, subject: string, html: string, text: string): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM || `MandapCanvas <hello@${new URL(SITE.url).hostname}>`;
  if (!key) {
    console.log(`\n[email:dev] to=${to}\nsubject=${subject}\n${text}\n`);
    return { delivered: false };
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to, subject, html, text }),
  });
  if (!res.ok) throw new Error(`Email failed (${res.status}): ${await res.text()}`);
  return { delivered: true };
}

function shell(body: string): string {
  return `<div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2B1620;background:#FBF3EF">
  <div style="font-size:22px;color:#9E1B32;margin-bottom:24px">MandapCanvas</div>${body}
  <p style="font-size:12px;color:#7a6470;margin-top:32px">AI concept previews for Desi weddings in the U.S.</p></div>`;
}

export async function sendLoginEmail(to: string, link: string, opts?: { offer?: boolean }) {
  const offer = opts?.offer && FOUNDING_OFFER.active
    ? `<p style="font-size:15px;background:#fbf1ee;border-radius:12px;padding:12px 14px">Welcome! As a founding couple you get <strong>${FOUNDING_OFFER.text}</strong>: use code <strong>${FOUNDING_OFFER.code}</strong> at checkout.</p>`
    : "";
  return send(
    to,
    opts?.offer ? "Welcome to MandapCanvas: your sign-in link" : "Your MandapCanvas sign-in link",
    shell(`<p style="font-size:16px">Use this link to sign in. It works for 30 minutes.</p>
      <p><a href="${link}" style="display:inline-block;background:#9E1B32;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif">Sign in to MandapCanvas</a></p>
      ${offer}
      <p style="font-size:13px;color:#7a6470">If you didn't ask for this, you can ignore this email.</p>`),
    `Sign in to MandapCanvas: ${link}\nThis link works for 30 minutes.${opts?.offer && FOUNDING_OFFER.active ? `\nFounding offer: ${FOUNDING_OFFER.text} with code ${FOUNDING_OFFER.code}.` : ""}`,
  );
}

export async function sendAlbumReadyEmail(to: string, album: Album) {
  const link = `${SITE.url}/album/${album.id}`;
  return send(
    to,
    `Your album "${album.title}" is ready`,
    shell(`<p style="font-size:16px">All ${album.shots.filter((s) => s.status === "done").length} images in <strong>${album.title}</strong> are ready.</p>
      <p><a href="${link}" style="display:inline-block;background:#9E1B32;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-family:Arial,sans-serif">Open your album</a></p>
      <p style="font-size:13px;color:#7a6470">Share it with family from the album page so they can vote on favorites.</p>`),
    `Your album "${album.title}" is ready: ${link}`,
  );
}

export async function sendReceiptNote(to: string, what: string) {
  const link = `${SITE.url}/account`;
  return send(
    to,
    "Thanks for your MandapCanvas order",
    shell(`<p style="font-size:16px">Thank you — ${what}.</p>
      <p>Your albums are always in <a href="${link}">your account</a>. Sign in with this email address.</p>`),
    `Thank you — ${what}. Your albums: ${link}`,
  );
}

const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

/** A visitor's feedback or contact note, to the support inbox. */
export async function sendFeedbackEmail(f: { message: string; rating?: string; email?: string; page: string; kind: "feedback" | "contact" }) {
  const subject = `${f.kind === "contact" ? "Contact" : "Feedback"}${f.rating ? ` ${f.rating}` : ""}: ${f.message.slice(0, 60)}`;
  const meta = [`Page: ${f.page}`, f.email ? `Reply to: ${f.email}` : "No email given", f.rating ? `Rating: ${f.rating}` : ""].filter(Boolean);
  return send(
    SITE.supportEmail,
    subject,
    shell(`<p style="font-size:16px;white-space:pre-wrap">${esc(f.message)}</p><p style="font-size:13px;color:#7a6470">${meta.map(esc).join("<br>")}</p>`),
    `${f.message}\n\n${meta.join("\n")}`,
  );
}
