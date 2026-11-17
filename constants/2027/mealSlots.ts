export interface MealSlot {
  id: string;
  label: string;
  from: string; // ISO with IST offset: scanning is only accepted inside this window
  to: string;
}

// Assumption: Day 1 and Day 3 have one meal (lunch); Day 2 has lunch and dinner.
// Edit ids, labels and times to match the real catering plan BEFORE seeding.
export const MEAL_SLOTS: MealSlot[] = [
  { id: "D1_LUNCH", label: "Day 1 · Lunch", from: "2027-01-06T12:00:00+05:30", to: "2027-01-06T15:30:00+05:30" },
  { id: "D2_LUNCH", label: "Day 2 · Lunch", from: "2027-01-07T12:00:00+05:30", to: "2027-01-07T15:30:00+05:30" },
  { id: "D2_DINNER", label: "Day 2 · Dinner", from: "2027-01-07T19:00:00+05:30", to: "2027-01-07T22:00:00+05:30" },
  { id: "D3_LUNCH", label: "Day 3 · Lunch", from: "2027-01-08T12:00:00+05:30", to: "2027-01-08T15:30:00+05:30" },
];

export const SLOT_IDS = MEAL_SLOTS.map((s) => s.id);

export function slotIsActive(slot: MealSlot, now: Date = new Date()): boolean {
  const t = now.getTime();
  return t >= new Date(slot.from).getTime() && t <= new Date(slot.to).getTime();
}
