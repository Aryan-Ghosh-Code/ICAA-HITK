import { db, type SettingsDoc } from "./db";
import { MEAL_SLOTS, slotIsActive } from "@/constants/2027/mealSlots";

export async function certificatesReleased(): Promise<boolean> {
  const s = await (await db())
    .collection<SettingsDoc>("settings")
    .findOne({ _id: "flags" });
  return Boolean(s?.certificatesReleased);
}

export async function getActiveMealSlot(): Promise<string> {
  const s = await (await db())
    .collection<SettingsDoc>("settings")
    .findOne({ _id: "flags" });
  if (s?.activeMealSlot && MEAL_SLOTS.some((m) => m.id === s.activeMealSlot)) {
    return s.activeMealSlot;
  }
  const currentActive = MEAL_SLOTS.find((m) => slotIsActive(m));
  return currentActive ? currentActive.id : MEAL_SLOTS[0].id;
}
