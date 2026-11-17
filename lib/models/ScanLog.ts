import { Schema, model, models, type Model } from "mongoose";
import type { ScanLogDoc } from "@/lib/types";

const ScanLogSchema = new Schema<ScanLogDoc>(
  {
    claimedAt: {
      type: Date,
      required: true
    },
    volunteer: {
      type: String,
      ref: "Volunteer",
      required: true
    },
    slot: {
      type: String,
      enum: ["D1_LUNCH", "D2_LUNCH", "D2_DINNER", "D3_LUNCH"],
      required: true
    },
    status: {
      type: String,
      required: true
    },
    userId: {
      type: String,
      ref: "User",
      required: true
    },
    rawIdPrefix: {
      type: String
    },
  },
  { versionKey: false, timestamps: true },
);

// Preserve index: descending on `claimedAt`
ScanLogSchema.index({ claimedAt: -1 });

export const ScanLogModel: Model<ScanLogDoc> =
  (models["ScanLog"] as Model<ScanLogDoc>) ??
  model<ScanLogDoc>("ScanLog", ScanLogSchema, "scan_log");
