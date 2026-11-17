import { Schema, model, models, type Model } from "mongoose";
import type { VolunteerDoc } from "@/lib/types";

const VolunteerSchema = new Schema<VolunteerDoc>(
  {
    _id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    role: {
      type: String,
      enum: ["volunteer", "admin"],
      required: true
    },
    active: {
      type: Boolean,
      required: true,
      default: true
    },
  },
  {
    _id: false,
    versionKey: false,
    timestamps: true,
  },
);

// Preserve existing index: name unique
VolunteerSchema.index({ name: 1 }, { unique: true });

export const VolunteerModel: Model<VolunteerDoc> =
  (models["Volunteer"] as Model<VolunteerDoc>) ??
  model<VolunteerDoc>("Volunteer", VolunteerSchema, "volunteers");
