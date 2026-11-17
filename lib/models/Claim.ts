import { Schema, model, models, type Model } from "mongoose";
import type { ClaimDoc } from "@/lib/types";

const ClaimSchema = new Schema<ClaimDoc>(
  {
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    slot: {
      type: String,
      required: true
    },
    claimedAt: {
      type: Date,
      required: true
    },
    claimedBy: {
      type: String,
      ref: "Volunteer",
      required: true
    },
  },
  { versionKey: false, timestamps: true },
);

// Preserve existing compound unique index: (userId, slot)
ClaimSchema.index({ userId: 1, slot: 1 }, { unique: true });

export const ClaimModel: Model<ClaimDoc> =
  (models["Claim"] as Model<ClaimDoc>) ??
  model<ClaimDoc>("Claim", ClaimSchema, "meal_claims");
