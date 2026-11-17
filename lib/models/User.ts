import { Schema, model, models, type Model } from "mongoose";
import type { UserDoc, UserCertDoc } from "@/lib/types";

const CertSchema = new Schema<UserCertDoc>(
  {
    fileId: {
      type: String,
      required: true,
      trim: true,
    },
    fileName: {
      type: String,
      trim: true,
    },
    syncedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
    versionKey: false,
  },
);

const UserSchema = new Schema<UserDoc>(
  {
    _id: {
      type: String,
      required: true,
    },
    name: {
      type: String,
      minlength: 2,
      required: true,
      trim: true,
    },
    PIDs: {
      type: [String],
      required: true,
    },
    foodSlots: {
      type: [String],
      default: [],
    },
    certs: {
      type: Map,
      of: CertSchema,
      default: () => new Map(),
    },
  },
  {
    // _id is a custom string, not ObjectId
    _id: false,
    versionKey: false,
    timestamps: true,
  },
);

// Preserve existing index: PIDs unique
UserSchema.index({ PIDs: 1 }, { unique: true });

export const UserModel: Model<UserDoc> =
  (models["User"] as Model<UserDoc>) ?? model<UserDoc>("User", UserSchema, "users");

