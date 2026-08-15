/**
 * Server-only email service using Nodemailer.
 * Configure via SMTP_* environment variables.
 *
 * Supports Gmail (with App Password) and any SMTP server.
 * If SMTP is not configured, logs the email to console (dev mode).
 */
import nodemailer from "nodemailer";

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM ?? user ?? "noreply@resolvely.app";

  if (!host || !user || !pass) {
    // Dev/offline mode — log to console
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

export type EmailPayload = {
  to: string;
  subject: string;
  html: string;
};

export async function sendEmail(payload: EmailPayload): Promise<void> {
  const transporter = createTransporter();
  const from =
    process.env.SMTP_FROM ??
    process.env.SMTP_USER ??
    "noreply@resolvely.app";

  if (!transporter) {
    // Silent in production if unconfigured; log in dev
    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[Email - dev mode] To: ${payload.to}\nSubject: ${payload.subject}\n${payload.html}`
      );
    }
    return;
  }

  await transporter.sendMail({ from, ...payload });
}

// ─── Email Templates ─────────────────────────────────────────────────────

export function statusChangeEmailHtml(opts: {
  complaintTitle: string;
  newStatus: string;
  complaintId: string;
  appUrl: string;
}): string {
  const statusLabel: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
    closed: "Closed",
  };

  const statusColors: Record<string, string> = {
    open: "#3b82f6",
    in_progress: "#f59e0b",
    resolved: "#22c55e",
    closed: "#6b7280",
  };

  const color = statusColors[opts.newStatus] ?? "#6b7280";
  const label = statusLabel[opts.newStatus] ?? opts.newStatus;
  const url = `${opts.appUrl}/complaints/${opts.complaintId}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 0;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1e1b4b; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">✨ Resolvely</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">Ticket status updated</h2>
      <p style="color: #6b7280; margin: 0 0 24px; font-size: 14px;">Your complaint has a new status.</p>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 4px;">${opts.complaintTitle}</div>
        <div style="display: inline-block; background: ${color}22; color: ${color}; border: 1px solid ${color}44; border-radius: 20px; padding: 4px 12px; font-size: 13px; font-weight: 500;">${label}</div>
      </div>

      <a href="${url}" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View ticket →</a>
    </div>
    <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      You're receiving this because you submitted a support ticket on Resolvely.
    </div>
  </div>
</body>
</html>`;
}

export function resolutionEmailHtml(opts: {
  complaintTitle: string;
  resolutionNote?: string;
  complaintId: string;
  appUrl: string;
}): string {
  const url = `${opts.appUrl}/complaints/${opts.complaintId}`;

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 0;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #059669; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">✅ Resolvely • Issue Resolved</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">Your complaint has been resolved! 🎉</h2>
      <p style="color: #6b7280; margin: 0 0 20px; font-size: 14px;">Our support team has investigated and marked your ticket as resolved.</p>

      <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin-bottom: 20px; background: #f0fdf4;">
        <div style="font-weight: 600; color: #111827; margin-bottom: 6px;">${opts.complaintTitle}</div>
        <div style="display: inline-block; background: #22c55e22; color: #15803d; border: 1px solid #22c55e44; border-radius: 20px; padding: 4px 12px; font-size: 12px; font-weight: 600;">Status: Resolved</div>
        ${
          opts.resolutionNote
            ? `<div style="margin-top: 12px; font-size: 13px; color: #374151; border-top: 1px dashed #bbf7d0; padding-top: 10px;">
                <b>Resolution Note from Support:</b><br/>${opts.resolutionNote}
               </div>`
            : ""
        }
      </div>

      <a href="${url}" style="display: inline-block; background: #059669; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">View Ticket & Leave Rating →</a>
    </div>
    <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af;">
      Thank you for using Resolvely AI Complaint Management System.
    </div>
  </div>
</body>
</html>`;
}

export function welcomeEmailHtml(opts: {
  fullName: string;
  appUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 0;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
    <div style="background: #1e1b4b; padding: 24px 32px;">
      <h1 style="color: #fff; margin: 0; font-size: 20px;">✨ Resolvely</h1>
    </div>
    <div style="padding: 32px;">
      <h2 style="margin: 0 0 8px; font-size: 18px; color: #111827;">Welcome, ${opts.fullName}! 👋</h2>
      <p style="color: #6b7280; font-size: 14px;">Your account is ready. Submit a complaint and our team (and AI!) will be on it right away.</p>
      <a href="${opts.appUrl}/new" style="display: inline-block; background: #4f46e5; color: #fff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">Submit a ticket →</a>
    </div>
  </div>
</body>
</html>`;
}
