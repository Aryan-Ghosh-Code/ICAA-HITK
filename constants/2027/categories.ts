// The prefix for participant IDs (e.g. ICAA27_AUT_001)
export const PID_PREFIX = "ICAA27";

// The 3-letter code inside a PID decides the role label on the card and the certificate title
export const CATEGORIES = {
  AUT: { role: "Author", certificate: "Certificate of Presentation" },
  ATT: { role: "Attendee", certificate: "Certificate of Participation" },
  SPK: { role: "Speaker", certificate: "Certificate of Invited Talk" },
  VLT: { role: "Volunteer", certificate: "Certificate of Volunteering" },
  ORG: { role: "Organiser", certificate: "Certificate of Organisation" },
} as const;

export type CategoryCode = keyof typeof CATEGORIES;
