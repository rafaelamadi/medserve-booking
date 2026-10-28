export type ScopeCentre = {
  id: string;
  code: string;
  name: string;
  city: string;
};

export const MEDSERVE_CENTRES: ScopeCentre[] = [
  { id: "centre-mlcc", code: "MLCC", name: "MedServe LUTH Cancer Centre", city: "Lagos" },
  { id: "centre-mkdc", code: "MKDC", name: "Kano Diagnostic Centre", city: "Kano" },
  { id: "centre-mudc", code: "MUDC", name: "Umuahia Diagnostic Centre", city: "Abuja" },
];
