import { MEAL_SLOTS, slotIsActive } from "../constants/2027/mealSlots";
import { ID_RE } from "./ids";
import type { ScanStatus, ScanResult } from "./types";

export type { ScanStatus, ScanResult };

export interface ScanDeps {
  findUser(
    id: string,
  ): Promise<{ _id: string; name: string; foodSlots: string[] } | null>;
  /** Must throw an error with code 11000 when (userId, slot) already exists. */
  insertClaim(c: {
    userId: string;
    slot: string;
    claimedAt: Date;
    claimedBy: string;
  }): Promise<void>;
  findClaim(
    userId: string,
    slot: string,
  ): Promise<{ claimedAt: Date; claimedBy: string } | null>;
  now(): Date;
  ignoreWindow: boolean;
}

export async function processScan(
  deps: ScanDeps,
  input: { id: unknown; slot: unknown; volunteer: string },
): Promise<ScanResult> {
  const slotDef = MEAL_SLOTS.find((s) => s.id === input.slot);
  if (!slotDef) return { status: "BAD_SLOT" };
  if (typeof input.id !== "string" || !ID_RE.test(input.id))
    return { status: "INVALID" };

  const user = await deps.findUser(input.id);
  if (!user) return { status: "INVALID" };

  if (!deps.ignoreWindow && !slotIsActive(slotDef, deps.now()))
    return { status: "WRONG_TIME", name: user.name, slot: slotDef.label };
  if (!user.foodSlots.includes(slotDef.id))
    return { status: "NOT_ELIGIBLE", name: user.name };

  try {
    await deps.insertClaim({
      userId: user._id,
      slot: slotDef.id,
      claimedAt: deps.now(),
      claimedBy: input.volunteer,
    });
    return { status: "OK", name: user.name };
  } catch (e) {
    if ((e as { code?: number })?.code === 11000) {
      const prev = await deps.findClaim(user._id, slotDef.id);
      return {
        status: "ALREADY_CLAIMED",
        name: user.name,
        at: prev?.claimedAt.toISOString(),
        by: prev?.claimedBy,
      };
    }
    throw e;
  }
}
