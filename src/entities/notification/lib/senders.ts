/** PRD §14: logs must not contain phone numbers or message bodies in plain form. */
export function maskPhone(phone: string): string {
  if (phone.length <= 6) return "***";
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export type SmsResult = { providerRef: string };

/**
 * SMS provider adapter (FR-N1). Default is a redacted console sender for dev;
 * set TERMII_API_KEY + SMS_SENDER to send via Termii in production.
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const apiKey = process.env.TERMII_API_KEY;
  const sender = process.env.SMS_SENDER;
  if (apiKey && sender) {
    const res = await fetch("https://v3.api.termii.com/api/sms/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, from: sender, sms: message, type: "plain", api_key: apiKey, channel: "generic" }),
    });
    if (!res.ok) throw new Error(`Termii HTTP ${res.status}`);
    const body = (await res.json()) as { message_id?: string; messageId?: string };
    console.log(`[sms:termii] to=${maskPhone(to)} ref=${body.message_id ?? body.messageId ?? "?"}`);
    return { providerRef: String(body.message_id ?? body.messageId ?? "termii") };
  }
  console.log(`[sms:console] to=${maskPhone(to)} chars=${message.length}`);
  return { providerRef: `console-${Date.now()}` };
}

/** Email sender stub (Resend wiring lands with the Phase 3 worker). */
export async function sendEmail(to: string, subject: string): Promise<SmsResult> {
  console.log(`[email:console] to=${to.replace(/(^.).*(@.*$)/, "$1***$2")} subject=${subject}`);
  return { providerRef: `console-${Date.now()}` };
}

/**
 * WhatsApp sender stub (Q5: live provider when approved).
 * Throws until configured so change notices fall through to EMAIL (FR-N2).
 */
export async function sendWhatsApp(to: string): Promise<SmsResult> {
  if (!process.env.WHATSAPP_TOKEN) throw new Error("WhatsApp not configured");
  console.log(`[whatsapp] to=${maskPhone(to)}`);
  return { providerRef: `wa-${Date.now()}` };
}
