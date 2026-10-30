import nodemailer from "nodemailer";
import { q } from "./db/index.js";

let transporter: nodemailer.Transporter | null = null;
function getTransport() {
  if (transporter || !process.env.SMTP_HOST) return transporter;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
  });
  return transporter;
}

/** Sends an email via SMTP when configured; always records it in the email log so admins can see notifications. */
export async function sendEmail(to: string, subject: string, body: string) {
  try {
    await q("INSERT INTO email_log (to_email, subject, body) VALUES ($1,$2,$3)", [to, subject, body]);
    const t = getTransport();
    if (t) {
      await t.sendMail({ from: process.env.MAIL_FROM || "MBONO Recruitment Services <no-reply@mbono.co.za>", to, subject, text: body });
    } else {
      console.log(`[email] To: ${to} | ${subject}\n        ${body.replace(/\n/g, "\n        ")}`);
    }
  } catch (e) {
    console.error("[email] failed:", (e as Error).message);
  }
}

export async function notify(userId: number, email: string, title: string, message: string) {
  await q("INSERT INTO notifications (user_id, title, message) VALUES ($1,$2,$3)", [userId, title, message]);
  await sendEmail(email, `MBONO Recruitment: ${title}`, `${message}\n\nSign in to your MBONO dashboard for details.\n\nMBONO Recruitment Services`);
}
