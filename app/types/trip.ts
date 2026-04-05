// app/types/trip.ts
// =========================================================
// TRIP TYPES (Tracking MVP)
// - Phase 2: Dispatcher creates trip (ASSIGNED)
// - Phase 3: Driver executes trip (START / CHECK-IN / COMPLETE)
// - Phase 4: Accountability + Reports (fuel focus + backend flags)
// =========================================================

/** =========================================================
 * Trip Status Lifecycle
 * =========================================================
 * ASSIGNED    → created by dispatcher (driver not started yet)
 * STARTED     → driver pressed "Start Trip"
 * IN_PROGRESS → driver submitted at least one check-in
 * COMPLETED   → driver completed trip
 * CANCELLED   → dispatcher/admin cancels trip (optional later)
 */
export type TripStatus =
  | "ASSIGNED"
  | "STARTED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

/** =========================================================
 * Fuel Flags (Phase 4)
 * - Persisted on trip for reporting
 * =========================================================
 *
 * NOTE: keep these strings stable, since we store them in Firestore.
 */
export type FuelFlag =
  | "MISSING_FUEL_GAUGE"
  | "FUEL_GAUGE_INCREASED"
  | "VERY_HIGH_FUEL_USED_SINGLE_CHECKIN"
  // Optional (nice for Phase 4 reports; safe to keep even if not used yet)
  | "TOTAL_FUEL_OVER_PLANNED"
  | "TOTAL_EXTRA_COST_HIGH";

/** =========================================================
 * Check-ins (manual proof of movement + fuel accountability)
 * =========================================================
 * Stored on Trip as: checkIns?: TripCheckIn[]
 * Newest-first is recommended in the API (prepend).
 */
export type TripCheckIn = {
  id: string; // unique id for this check-in entry
  at: string; // ISO timestamp
  currentCity: string; // driver reported location/city

  note?: string; // optional text

  // Optional costs / fuel (MVP)
  fuelUsed?: number; // optional liters used since last check-in
  extraCost?: number; // optional extra costs since last check-in

  // Phase 4 - Fuel accountability
  fuelGaugePercent?: number; // 0..100 (driver gauge reading)
};

/** =========================================================
 * Phase 4 Trip Report Snapshot (stored on trip when completed)
 * ========================================================= */
export type TripReportSnapshot = {
  generatedAt: string; // ISO
  tripId: string;
  tenantSlug: string; // companyId in your platform structure

  status: TripStatus;

  truckPlate: string;
  driverName: string;

  startCity: string;
  destinationCity: string;

  assignedAt: string;
  startedAt?: string;
  completedAt?: string;

  checkInCount: number;

  // fuel summary
  lastFuelGaugePercent?: number;
  lastFuelGaugeAt?: string;
  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

  // accountability
  fuelFlags?: FuelFlag[];
};

/** =========================================================
 * Trip (Firestore document + UI type)
 * ========================================================= */
export type Trip = {
  id: string;
  tenantSlug: string; // companyId in your platform structure

  // ---------------------------------------------------------
  // Associations (snapshot for easy display)
  // ---------------------------------------------------------
  truckId: string;
  truckPlate: string;
  truckOwner?: string;

  driverId: string;
  driverName: string;
  driverPhone?: string;

  // ---------------------------------------------------------
  // Route + Cargo
  // ---------------------------------------------------------
  startCity: string;
  destinationCity: string;

  agreedCost: number;
  loadType: string;
  loadWeight?: number;

  // ---------------------------------------------------------
  // Planning (optional fields for later)
  // ---------------------------------------------------------
  plannedFuel?: number;
  plannedDistanceKm?: number;
  plannedDurationHours?: number;

  // ---------------------------------------------------------
  // Status + Lifecycle timestamps
  // ---------------------------------------------------------
  status: TripStatus;

  assignedAt: string; // ISO
  startedAt?: string; // ISO
  completedAt?: string; // ISO

  updatedAt?: string; // ISO

  // ---------------------------------------------------------
  // Ethiopian-style trip code (stored as hash only)
  // Format: LDDMMN  Example: A05012
  // ---------------------------------------------------------
  tripCodeHash: string;
  tripCodeDay: string; // "01".."30"
  tripCodeMonth: string; // "01".."13"
  tripDailySequence: number; // 1..9

  // ---------------------------------------------------------
  // Driver check-ins
  // ---------------------------------------------------------
  checkIns?: TripCheckIn[];

  lastCheckinCity?: string;
  lastCheckinAt?: string;

  // ---------------------------------------------------------
  // Phase 4: Fuel summary fields (dashboard-friendly)
  // ---------------------------------------------------------
  lastFuelGaugePercent?: number;
  lastFuelGaugeAt?: string;

  totalFuelUsedLiters?: number;
  totalExtraCost?: number;

  // ---------------------------------------------------------
  // Phase 4: Backend fuel flags (persisted)
  // ---------------------------------------------------------
  fuelFlags?: FuelFlag[];
  fuelFlagsUpdatedAt?: string;

  // ---------------------------------------------------------
  // Phase 4: Report snapshot (written at completion)
  // ---------------------------------------------------------
  report?: TripReportSnapshot;

  // ---------------------------------------------------------
  // Notes
  // ---------------------------------------------------------
  notes?: string;
};