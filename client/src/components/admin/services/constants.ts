export const SERVICE_ICONS: { name: string; url: string }[] = [
  { name: "Carburant",     url: "/services/carburant.png" },
  { name: "Coiffure",      url: "/services/coiffure.png" },
  { name: "Conciergerie",  url: "/services/conciergerie.png" },
  { name: "Domicile",      url: "/services/domicile.png" },
  { name: "Esthétique",    url: "/services/esthetique.png" },
  { name: "Événementiel",  url: "/services/evenementiel.png" },
  { name: "Hôtellerie",    url: "/services/hotellerie.png" },
  { name: "Logistique",    url: "/services/logistique.png" },
  { name: "Manucure",      url: "/services/manucure.png" },
  { name: "Massage",       url: "/services/massage.png" },
  { name: "Professionnel", url: "/services/professionnel.png" },
  { name: "Transport",     url: "/services/transport.png" },
  { name: "Voyage",        url: "/services/voyage.png" },
];

export const LOGOS: { name: string; url: string }[] = [
  { name: "Logo MAWEJA Rouge", url: "/maweja-logo-red.png" },
  { name: "Icône MAWEJA",      url: "/maweja-icon.png" },
  { name: "Logo MAWEJA",       url: "/logo.png" },
];

export type CustomField = {
  id: string;
  label: string;
  type: "text" | "number" | "select" | "textarea" | "photo" | "date";
  required: boolean;
  placeholder?: string;
  options?: string[];
};
