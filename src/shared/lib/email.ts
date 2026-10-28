import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "notifications@medserve.ng";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Sends a 6-digit verification code to the patient's email via Resend.
 * Falls back to console simulation if RESEND_API_KEY is not configured.
 */
export async function sendOtpEmail(
  to: string,
  code: string,
  recipientName?: string,
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const name = recipientName ? recipientName.split(" ")[0] : "there";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .card { background-color: #ffffff; max-width: 520px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { text-align: center; margin-bottom: 24px; }
          .badge { display: inline-block; padding: 6px 14px; background-color: #ecfdf5; color: #047857; font-size: 13px; font-weight: 600; border-radius: 9999px; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
          .subtitle { font-size: 15px; color: #64748b; line-height: 1.5; margin: 0; }
          .otp-box { background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); border-radius: 12px; padding: 20px; margin: 28px 0; text-align: center; border: 1px dashed #cbd5e1; }
          .otp-code { font-family: monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #0f172a; }
          .warning { font-size: 13px; color: #64748b; text-align: center; margin-top: 16px; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <div class="badge">MedServe Patient Care</div>
            <h1 class="title">Your Verification Code</h1>
            <p class="subtitle">Hello ${name}, use this one-time code to securely sign in to your MedServe Care Portal.</p>
          </div>
          <div class="otp-box">
            <div class="otp-code">${code}</div>
          </div>
          <p class="warning">This verification code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
          <div class="footer">
            MedServe Oncology Network &bull; Lagos &bull; Kano &bull; Umuahia
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(
      `\n=========================================\n[MedServe Auth DEV] Simulated Email to: ${to}\nOTP Code: ${code}\n=========================================\n`,
    );
    return { success: true, simulated: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: `MedServe Health <${resendFromEmail}>`,
      to: [to],
      subject: `${code} is your MedServe verification code`,
      html,
    });

    if (error) {
      console.error("[MedServe Auth] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[MedServe Auth] Failed to send email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}
