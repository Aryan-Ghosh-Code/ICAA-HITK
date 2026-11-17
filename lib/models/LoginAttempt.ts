import { Schema, model, models, type Model } from "mongoose";
import type { LoginAttemptDoc } from "@/lib/types";

const LoginAttemptSchema = new Schema<LoginAttemptDoc>(
  {
    key: {
      type: String,
      required: true
    },
    windowStart: {
      type: Date,
      required: true
    },
    count: {
      type: Number,
      required: true,
      default: 0
    },
  },
  { versionKey: false, timestamps: true },
);

// Preserve existing TTL index: auto-expire documents after 1 hour
LoginAttemptSchema.index({ windowStart: 1 }, { expireAfterSeconds: 3600 });

export const LoginAttemptModel: Model<LoginAttemptDoc> =
  (models["LoginAttempt"] as Model<LoginAttemptDoc>) ??
  model<LoginAttemptDoc>("LoginAttempt", LoginAttemptSchema, "login_attempts");
