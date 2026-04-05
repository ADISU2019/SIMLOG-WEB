// app/types/tripEvent.ts

export type TripEventType =
  | "START"
  | "CHECKIN"
  | "COMPLETE";

export type TripEvent = {
  id: string;
  tenantSlug: string;
  tripId: string;

  type: TripEventType;
  city: string;
  timestamp: string; // ISO string
  notes?: string;
};