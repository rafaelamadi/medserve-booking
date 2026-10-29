const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "MedServe Hub",
  subtitle: "Clinician & Staff Portal",
  network: "MedServe Oncology Network",
  url: process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL || process.env.APP_URL || "http://localhost:3000",
  version: "0.1.0",
  copyright: `© ${currentYear}, MedServe Oncology Network.`,
  meta: {
    title: "MedServe Clinician & Staff Hub",
    description:
      "Multi-centre appointment booking and patient scheduling across Lagos (MLCC), Kano (MKDC), and Umuahia (MUDC).",
  },
};
