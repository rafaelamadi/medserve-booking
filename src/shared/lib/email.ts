import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const resendFromEmail = process.env.RESEND_FROM_EMAIL || "notifications@medserve.takeoutmedia.xyz";

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

export interface StaffInviteEmailParams {
  to: string;
  fullName: string;
  role: string;
  centreName: string;
  mfaCode: string;
  inviteUrl?: string;
}

/**
 * Sends a staff onboarding invitation email via Resend with assigned facility, role, and MFA credentials.
 */
export async function sendStaffInviteEmail(
  params: StaffInviteEmailParams
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const { to, fullName, role, centreName, mfaCode, inviteUrl } = params;
  const firstName = fullName.split(" ")[0] || "Staff Member";
  const activationLink = inviteUrl || "http://localhost:3000/hub/login";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .card { background-color: #ffffff; max-width: 540px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .badge { display: inline-block; padding: 6px 14px; background-color: #ecfdf5; color: #047857; font-size: 13px; font-weight: 600; border-radius: 9999px; margin-bottom: 12px; }
          .title { font-size: 24px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
          .subtitle { font-size: 15px; color: #64748b; line-height: 1.5; margin: 0; }
          .info-table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 14px; }
          .info-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
          .info-table td:first-child { color: #64748b; font-weight: 500; width: 40%; }
          .info-table td:last-child { color: #0f172a; font-weight: 600; }
          .mfa-box { background: #f8fafc; border-radius: 12px; padding: 16px; margin: 20px 0; text-align: center; border: 1px dashed #cbd5e1; }
          .mfa-code { font-family: monospace; font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #0f172a; }
          .btn { display: block; text-align: center; background-color: #0f172a; color: #ffffff !important; font-weight: 600; font-size: 14px; padding: 14px 24px; border-radius: 10px; text-decoration: none; margin: 24px 0 12px; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">MedServe Clinician & Staff Hub</div>
          <h1 class="title">Staff Account Invitation</h1>
          <p class="subtitle">Hello ${firstName}, you have been enrolled as a clinical staff member on the MedServe Oncology Network.</p>
          
          <table class="info-table">
            <tr>
              <td>Assigned Role</td>
              <td>${role}</td>
            </tr>
            <tr>
              <td>Clinical Facility</td>
              <td>${centreName}</td>
            </tr>
            <tr>
              <td>Account Email</td>
              <td>${to}</td>
            </tr>
          </table>

          <div class="mfa-box">
            <div style="font-size: 12px; color: #64748b; margin-bottom: 6px; text-transform: uppercase; font-weight: 600;">Your One-Time MFA Enrollment Code</div>
            <div class="mfa-code">${mfaCode}</div>
          </div>

          <a href="${activationLink}" class="btn">Activate Account & Set Password</a>

          <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 12px;">
            Use your email and MFA code above to complete account activation.
          </p>

          <div class="footer">
            MedServe Oncology Network &bull; Lagos (MLCC) &bull; Kano (MKDC) &bull; Umuahia (MUDC)
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(
      `\n=========================================\n[MedServe Staff Invite DEV] Simulated Email to: ${to}\nRole: ${role} | Centre: ${centreName}\nMFA Code: ${mfaCode}\nActivation Link: ${activationLink}\n=========================================\n`,
    );
    return { success: true, simulated: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: `MedServe Health <${resendFromEmail}>`,
      to: [to],
      subject: `MedServe Staff Invitation - Activate your ${role} account`,
      html,
    });

    if (error) {
      console.error("[MedServe Staff] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[MedServe Staff] Failed to send email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}

export interface AppointmentConfirmationEmailParams {
  to: string;
  patientName: string;
  reference: string;
  centreName: string;
  centreAddress?: string;
  serviceName: string;
  date: string;
  timeSlot: string;
}

/**
 * Sends a branded appointment confirmation email to the patient with booking reference and centre details.
 */
export async function sendAppointmentConfirmationEmail(
  params: AppointmentConfirmationEmailParams
): Promise<{ success: boolean; simulated?: boolean; error?: string }> {
  const { to, patientName, reference, centreName, centreAddress, serviceName, date, timeSlot } = params;
  const firstName = patientName.split(" ")[0] || "Patient";

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
          .card { background-color: #ffffff; max-width: 540px; margin: 0 auto; border-radius: 16px; border: 1px solid #e2e8f0; padding: 36px 32px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .badge { display: inline-block; padding: 6px 14px; background-color: #ecfdf5; color: #047857; font-size: 13px; font-weight: 600; border-radius: 9999px; margin-bottom: 12px; }
          .title { font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 8px 0; }
          .subtitle { font-size: 14px; color: #64748b; line-height: 1.5; margin: 0; }
          .ref-box { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 12px; padding: 18px; margin: 24px 0; text-align: center; border: 1px solid #bbf7d0; }
          .ref-label { font-size: 11px; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; color: #15803d; margin-bottom: 4px; }
          .ref-code { font-family: monospace; font-size: 26px; font-weight: 700; letter-spacing: 4px; color: #14532d; }
          .info-table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; }
          .info-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
          .info-table td:first-child { color: #64748b; font-weight: 500; width: 38%; }
          .info-table td:last-child { color: #0f172a; font-weight: 600; }
          .notice { font-size: 12px; color: #64748b; background-color: #f8fafc; border-left: 3px solid #0f172a; padding: 12px 14px; border-radius: 4px; margin-top: 20px; line-height: 1.5; }
          .footer { text-align: center; font-size: 12px; color: #94a3b8; margin-top: 28px; border-top: 1px solid #f1f5f9; padding-top: 18px; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="badge">MedServe Appointment Confirmation</div>
          <h1 class="title">Your Appointment is Confirmed</h1>
          <p class="subtitle">Hello ${firstName}, your clinical appointment has been scheduled at MedServe. Please find your visit details below:</p>
          
          <div class="ref-box">
            <div class="ref-label">Booking Reference Code</div>
            <div class="ref-code">${reference}</div>
          </div>

          <table class="info-table">
            <tr>
              <td>Patient Name</td>
              <td>${patientName}</td>
            </tr>
            <tr>
              <td>Clinical Centre</td>
              <td>${centreName}</td>
            </tr>
            <tr>
              <td>Service</td>
              <td>${serviceName}</td>
            </tr>
            <tr>
              <td>Date</td>
              <td>${date}</td>
            </tr>
            <tr>
              <td>Scheduled Time</td>
              <td>${timeSlot}</td>
            </tr>
            ${centreAddress ? `<tr><td>Address</td><td>${centreAddress}</td></tr>` : ""}
          </table>

          <div class="notice">
            <strong>Arrival Reminder:</strong> Please present your booking reference <strong>${reference}</strong> at the front desk 15 minutes before your scheduled appointment time.
          </div>

          <div class="footer">
            MedServe Oncology Network &bull; Lagos (MLCC) &bull; Kano (MKDC) &bull; Umuahia (MUDC)
          </div>
        </div>
      </body>
    </html>
  `;

  if (!resend) {
    console.log(
      `\n=========================================\n[MedServe Booking DEV] Simulated Confirmation Email to: ${to}\nPatient: ${patientName} | Ref: ${reference}\nDate: ${date} ${timeSlot} | Centre: ${centreName}\n=========================================\n`,
    );
    return { success: true, simulated: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: `MedServe Health <${resendFromEmail}>`,
      to: [to],
      subject: `Appointment Confirmed: ${reference} - ${serviceName} at MedServe`,
      html,
    });

    if (error) {
      console.error("[MedServe Booking] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error("[MedServe Booking] Failed to send email:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send email",
    };
  }
}


