const nodemailer = require("nodemailer");
const sendgridMail = require("@sendgrid/mail");

const EMAIL_FROM = process.env.EMAIL_FROM || "no-reply@mobileshop.local";
const MAILTRAP_API_BASE = process.env.MAILTRAP_API_BASE || "https://send.api.mailtrap.io";

let smtpTransporter = null;

function getProvider() {
  if (String(process.env.MAILTRAP_USE_SANDBOX || "").toLowerCase() === "true") return "mailtrap_sandbox";
  if (process.env.SENDGRID_API_KEY) return "sendgrid";
  if (process.env.SMTP_HOST) return "smtp";
  return "log";
}

function getSmtpTransporter() {
  if (smtpTransporter) return smtpTransporter;
  smtpTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
    secure: String(process.env.SMTP_SECURE || "false").toLowerCase() === "true",
    auth: process.env.SMTP_USER
      ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS || "",
        }
      : undefined,
  });
  return smtpTransporter;
}

async function sendViaMailtrapSandbox({ to, subject, text, html }) {
  const apiKey = String(process.env.MAILTRAP_API_KEY || "").trim();
  const inboxId = String(process.env.MAILTRAP_INBOX_ID || "").trim();
  if (!apiKey || !inboxId) {
    throw new Error("MAILTRAP_API_KEY and MAILTRAP_INBOX_ID are required for Mailtrap Sandbox.");
  }

  const recipients = String(to || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean)
    .map((email) => ({ email }));

  if (recipients.length === 0) {
    throw new Error("At least one recipient is required.");
  }

  const response = await fetch(`${MAILTRAP_API_BASE}/api/send/${encodeURIComponent(inboxId)}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: { email: EMAIL_FROM },
      to: recipients,
      subject,
      text,
      html,
      category: "MobileShop",
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Mailtrap Sandbox API error (${response.status}): ${details}`);
  }
}

async function sendEmail({ to, subject, text, html }) {
  const provider = getProvider();
  if (provider === "mailtrap_sandbox") {
    await sendViaMailtrapSandbox({ to, subject, text, html });
    return { provider };
  }
  if (provider === "sendgrid") {
    sendgridMail.setApiKey(process.env.SENDGRID_API_KEY);
    await sendgridMail.send({ to, from: EMAIL_FROM, subject, text, html });
    return { provider };
  }
  if (provider === "smtp") {
    const transporter = getSmtpTransporter();
    await transporter.sendMail({ to, from: EMAIL_FROM, subject, text, html });
    return { provider };
  }
  // Fallback for local development without SMTP/SendGrid credentials.
  console.log("[EMAIL][LOG_ONLY]", JSON.stringify({ to, subject, text }, null, 2));
  return { provider };
}

module.exports = { sendEmail };
