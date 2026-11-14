// ─── Database / Domain Models ──────────────────────────────────────────────

export interface UserCertDoc {
  fileId: string;
  fileName?: string;
  syncedAt?: Date;
}

export interface UserDoc {
  _id: string; // random 32-hex string = secret token inside the QR
  name: string;
  PIDs: string[]; // array of PIDs; first is primary
  foodSlots: string[]; // meal slots eligible to claim
  certs: Record<string, UserCertDoc>; // PID -> Certificate entry
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ClaimDoc {
  userId: string;
  slot: string;
  claimedAt: Date;
  claimedBy: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface VolunteerDoc {
  _id: string;
  name: string;
  passwordHash?: string;
  role: "volunteer" | "admin";
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface SettingsDoc {
  _id: string; // "flags"
  certificatesReleased?: boolean;
  activeMealSlot?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ScanLogDoc {
  claimedAt: Date;
  volunteer: string;
  slot: string;
  status: string;
  userId: string;
  rawIdPrefix?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface LoginAttemptDoc {
  key: string;
  windowStart: Date;
  count: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type ScanStatus =
  | "OK"
  | "ALREADY_CLAIMED"
  | "NOT_ELIGIBLE"
  | "WRONG_TIME"
  | "INVALID"
  | "BAD_SLOT"
  | "NETWORK";

export interface ScanResult {
  status: ScanStatus;
  name?: string;
  at?: string;
  by?: string;
  slot?: string;
}

export interface SlotStats {
  slot: string;
  activeSlot?: string;
  eligible: number;
  claimed: number;
  remaining: number;
}

export interface SearchUserResult {
  id: string;
  name: string;
  primaryPid: string;
  roles: string;
  foodSlots: string[];
  claimedSlots: string[];
}

export interface RosterEntry {
  userId: string;
  name: string;
  served: boolean;
  claimedAt?: string;
  claimedBy?: string;
}

export interface AdminStatsData {
  totalUsers: number;
  categoryCounts: Record<string, number>;
  slotCounts: Record<string, number>;
  eligiblePerSlot: Record<string, number>;
  certificatesReleased: boolean;
  activeMealSlot: string;
  recentLogs: Array<{
    _id: string;
    action: string;
    slot: string;
    volunteer: string;
    success: boolean;
    reason?: string;
    pid?: string;
    name?: string;
    ts: string;
  }>;
  volunteers: Array<{
    _id: string;
    name: string;
    role: string;
    createdAt?: string;
  }>;
  /** Per-slot roster: who is eligible, served, and remaining */
  roster: Record<string, RosterEntry[]>;
}

// ─── UI / Component Types ───────────────────────────────────────────────────

import { CARD } from "@/constants/2027/attractions";
import { ReactNode } from "react";

export type NavChild = { label: string; href: string };

export type NavItem =
  | { label: string; href: string; children?: never }
  | { label: string; children: NavChild[]; href?: never };

export interface StubProps {
  page: string;
  heading: string;
  description: string;
}

export interface InfoCardProps {
  icon: ReactNode;
  headerLabel: string;
  accentClass: string;
  diamondClass: string;
  tags: readonly string[];
  bodyText: string;
  footer?: ReactNode;
}

export interface TagPillProps {
  label: string;
}

export interface Hotel {
  name: string;
  image: string;
  address: string;
  phone: string;
  website: string;
  mapEmbedUrl: string;
}

export interface HotelCardProps {
  index: number;
  hotel: Hotel;
  isActive: boolean;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
}

export interface MapLayout {
  name: string;
  mapEmbedUrl: string;
}

export interface Attraction {
  url: string;
  title: string;
  desc: string;
}

export interface ImportantDate {
  event: string;
  date: string;
  oldDate?: string;
  time?: string;
  note?: string;
  isPassed?: boolean;
}

export interface KeynoteSpeaker {
  name: string;
  university: string;
  image: string;
  profileUrl: string;
  bannerImage?: string;
  talkTitle?: string;
  isOnline?: boolean;
}

export interface ProgramCommitteeMember {
  name: string;
  institution: string;
  role?: string;
}

export interface GalleryImage {
  url: string;
  title: string;
  desc: string;
}

export type CoverflowCardDimensions = CoverflowCardSizes[keyof CoverflowCardSizes];

export type CoverflowCardSizes = typeof CARD;

export interface CoverflowImageProps {
  index: number;
  rotateY: number;
  xOffset: number;
  zOffset: number;
  scale: number;
  opacity: number;
  card: CoverflowCardDimensions;
  cardBlur: string;
  d: number;
  isCenter: boolean;
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>;
  img: GalleryImage;
}

export type DeviceType = "mobile" | "tablet" | "desktop";

export interface CardTransform {
  xOffset: number;
  rotateY: number;
  zOffset: number;
  scale: number;
  opacity: number;
  cardBlur: string;
}

export interface ToastProps {
  toastMessage: string;
  setToastMessage: React.Dispatch<React.SetStateAction<string | null>>;
}

export interface Proceeding {
  year: number;
  title: string;
  volume: string;
  editors: string;
  image: string;
  link: string;
  description: string;
}