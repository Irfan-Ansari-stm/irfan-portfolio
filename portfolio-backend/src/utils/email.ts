import nodemailer from 'nodemailer';
import { env } from '../config/env';

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth: env.SMTP_USER
        ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
        : undefined,
    });
  }
  return transporter;
}

export interface ContactEmailData {
  name: string;
  email: string;
  subject: string;
  message: string;
  notifyEmail: string;
}

export async function sendContactNotification(data: ContactEmailData): Promise<void> {
  if (!env.SMTP_USER) {
    console.log('📧 Email skipped (no SMTP config). Would have sent:', data.subject);
    return;
  }

  const t = getTransporter();

  // Notify admin
  await t.sendMail({
    from: env.EMAIL_FROM,
    to: data.notifyEmail,
    subject: `📬 New Contact: ${data.subject}`,
    html: `
      <h2>New Contact Form Submission</h2>
      <p><strong>From:</strong> ${data.name} &lt;${data.email}&gt;</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <hr/>
      <p>${data.message.replace(/\n/g, '<br/>')}</p>
    `,
  });

  // Auto-reply to sender
  await t.sendMail({
    from: env.EMAIL_FROM,
    to: data.email,
    subject: `Re: ${data.subject} — Got your message!`,
    html: `
      <p>Hi ${data.name},</p>
      <p>Thanks for reaching out! I've received your message and will get back to you within 24-48 hours.</p>
      <p>Best,<br/>Irfan Ansari</p>
    `,
  });
}
