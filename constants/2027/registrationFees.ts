// constants/2027/registrationFees.ts

export interface FeeRow {
  description: string;
  inr: number;
  usd: number;
  eur: number;
}

export interface FeeGroup {
  category: string; // e.g. "Authors", "General Attendees"
  rows: FeeRow[];
}

export interface StandaloneRow {
  description: string;
  inr: number;
  usd: number;
  eur: number;
}

export const AUTHOR_FEES: FeeGroup = {
  category: "Authors",
  rows: [
    { description: "Student", inr: 7000, usd: 300, eur: 260 },
    { description: "Academician (Early-Bird)", inr: 9000, usd: 300, eur: 260 },
    { description: "Academician (Late)", inr: 10000, usd: 350, eur: 300 },
    {
      description: "Industry Personnel (Early-Bird)",
      inr: 10000,
      usd: 300,
      eur: 260,
    },
    {
      description: "Industry Personnel (Late)",
      inr: 12000,
      usd: 350,
      eur: 300,
    },
  ],
};

export const ADDITIONAL_PAPER_FEE: StandaloneRow = {
  description: "Each Additional Paper",
  inr: 4000,
  usd: 150,
  eur: 125,
};

export const ATTENDEE_FEES: FeeGroup = {
  category: "General Attendees",
  rows: [
    {
      description: "Full Conference (Early-Bird)",
      inr: 2500,
      usd: 200,
      eur: 165,
    },
    { description: "Full Conference (Late)", inr: 3000, usd: 250, eur: 200 },
    { description: "Single Day", inr: 1000, usd: 125, eur: 100 },
  ],
};

export const FEE_NOTES: string[] = [
  "At least one author must register within November 10, 2026 for the conference to ensure the inclusion of the paper in the proceedings.",
  "Students must include a letter from the Head of the Institute/ Dean/ Department authenticating their full-time student status.",
  "Authors with affiliation other than Indian institutions must register in USD or EUR.",
  "In case of multiple papers by the same author, each additional paper (maximum of 2 papers) would be subjected to additional registration charge at reduced rate.",
  "In the case of over-length papers (those exceeding the 12-page limit), each additional page - up to a maximum of two pages, will incur an additional charge of ₹2000 per page.",
  "Early Bird Registration for additional authors and general participants deadline is November 15, 2026.",
];

export const CURRENCY_NOTE =
  "Fees shown in INR, USD, and EUR. Payment portal will confirm applicable exchange rates at the time of transaction.";
