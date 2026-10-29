/**
 * Centralized MedServe Email Templates Registry.
 * Single source of truth for patient email templates across all dashboard views and automated dispatches.
 */

export type EmailTemplateContext = {
  patientName: string;
  patientEmail?: string;
  patientMrn?: string;
  centreName?: string;
  centreCode?: string;
  serviceName?: string;
  timeSlot?: string;
  reference?: string;
};

export type EmailTemplateKey =
  | "APPOINTMENT_CONFIRMATION"
  | "CHECKIN_ADVISORY"
  | "SESSION_COMPLETED"
  | "APPOINTMENT_REMINDER"
  | "CUSTOM";

export type EmailTemplateDefinition = {
  key: EmailTemplateKey;
  label: string;
  description: string;
  generateSubject: (ctx: EmailTemplateContext) => string;
  generateBody: (ctx: EmailTemplateContext) => string;
};

export const EMAIL_TEMPLATES: Record<EmailTemplateKey, EmailTemplateDefinition> = {
  APPOINTMENT_CONFIRMATION: {
    key: "APPOINTMENT_CONFIRMATION",
    label: "Appointment Confirmation",
    description: "Confirmed booking notice with date, slot, and centre info",
    generateSubject: (ctx) => {
      const code = ctx.centreCode ? ` - MedServe ${ctx.centreCode}` : " - MedServe";
      const ref = ctx.reference ? ` [${ctx.reference}]` : ctx.patientMrn ? ` [${ctx.patientMrn}]` : "";
      return `Appointment Confirmation${code}${ref}`;
    },
    generateBody: (ctx) => {
      const cleanService = ctx.serviceName?.replace(/\s*\([^)]*\)/g, "").trim() || "Consultation";
      const centre = ctx.centreName || "MedServe Clinical Centre";
      const slot = ctx.timeSlot || "your scheduled slot";
      return (
        `Dear ${ctx.patientName},\n\n` +
        `Your appointment for ${cleanService} at ${centre} is confirmed for ${slot}.\n\n` +
        `Please arrive 15 minutes before your scheduled slot. Our clinical staff looks forward to welcoming you.\n\n` +
        `Warm regards,\nMedServe Clinical Desk`
      );
    },
  },

  CHECKIN_ADVISORY: {
    key: "CHECKIN_ADVISORY",
    label: "Check-in Advisory",
    description: "Arrival instructions for front reception & registration",
    generateSubject: (ctx) => {
      const code = ctx.centreCode ? ` - MedServe ${ctx.centreCode}` : " - MedServe";
      const ref = ctx.reference ? ` [${ctx.reference}]` : ctx.patientMrn ? ` [${ctx.patientMrn}]` : "";
      return `Check-in Advisory${code}${ref}`;
    },
    generateBody: (ctx) => {
      const centre = ctx.centreName || "MedServe Clinical Centre";
      const slot = ctx.timeSlot ? ` for your ${ctx.timeSlot} appointment` : "";
      return (
        `Dear ${ctx.patientName},\n\n` +
        `Please proceed to the reception desk at ${centre}${slot}.\n\n` +
        `Kindly have your identification, hospital card, and any referral documents ready.\n\n` +
        `Warm regards,\nMedServe Reception Team`
      );
    },
  },

  SESSION_COMPLETED: {
    key: "SESSION_COMPLETED",
    label: "Session Completed",
    description: "Post-care clinical follow-up and care feedback notice",
    generateSubject: (ctx) => {
      const code = ctx.centreCode ? ` - MedServe ${ctx.centreCode}` : " - MedServe";
      const ref = ctx.reference ? ` [${ctx.reference}]` : ctx.patientMrn ? ` [${ctx.patientMrn}]` : "";
      return `Session Completed${code}${ref}`;
    },
    generateBody: (ctx) => {
      const cleanService = ctx.serviceName?.replace(/\s*\([^)]*\)/g, "").trim() || "Clinical session";
      const centre = ctx.centreName || "MedServe Clinical Centre";
      return (
        `Dear ${ctx.patientName},\n\n` +
        `Your clinical session for ${cleanService} at ${centre} has been successfully completed.\n\n` +
        `If you have any questions or experience any discomfort, please contact our care team. Thank you for trusting MedServe with your care.\n\n` +
        `Warm regards,\nMedServe Clinical Team`
      );
    },
  },

  APPOINTMENT_REMINDER: {
    key: "APPOINTMENT_REMINDER",
    label: "Appointment Reminder",
    description: "General appointment readiness reminder",
    generateSubject: (ctx) => {
      const code = ctx.centreCode ? ` - MedServe ${ctx.centreCode}` : " - MedServe";
      const ref = ctx.reference ? ` [${ctx.reference}]` : ctx.patientMrn ? ` [${ctx.patientMrn}]` : "";
      return `Appointment Reminder${code}${ref}`;
    },
    generateBody: (ctx) => {
      const cleanService = ctx.serviceName?.replace(/\s*\([^)]*\)/g, "").trim() || "Consultation";
      const centre = ctx.centreName || "MedServe Clinical Centre";
      const slot = ctx.timeSlot ? ` scheduled for ${ctx.timeSlot}` : "";
      return (
        `Dear ${ctx.patientName},\n\n` +
        `This is a friendly reminder of your upcoming ${cleanService} appointment at ${centre}${slot}.\n\n` +
        `If you need to reschedule or have accessibility requirements, please reach out to our team in advance.\n\n` +
        `Warm regards,\nMedServe Patient Care`
      );
    },
  },

  CUSTOM: {
    key: "CUSTOM",
    label: "Custom Draft",
    description: "Compose a personalized clinical email",
    generateSubject: (ctx) => {
      const ref = ctx.reference ? ` [${ctx.reference}]` : ctx.patientMrn ? ` [${ctx.patientMrn}]` : "";
      return `Clinical Notice - ${ctx.patientName}${ref}`;
    },
    generateBody: (ctx) => {
      const centre = ctx.centreName || "MedServe";
      return (
        `Dear ${ctx.patientName},\n\n` +
        `Regarding your care at ${centre}:\n\n\n\n` +
        `Warm regards,\nMedServe Clinical Desk`
      );
    },
  },
};

export const EMAIL_TEMPLATE_LIST = Object.values(EMAIL_TEMPLATES);

export function renderEmailTemplate(
  key: EmailTemplateKey | string,
  ctx: EmailTemplateContext
): { subject: string; body: string } {
  const tpl = EMAIL_TEMPLATES[key as EmailTemplateKey] || EMAIL_TEMPLATES.CUSTOM;
  return {
    subject: tpl.generateSubject(ctx),
    body: tpl.generateBody(ctx),
  };
}
