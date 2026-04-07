// services/shipmentService.ts

import type { ShipmentStatus } from "@/types/declarationStatus";

export interface Shipment {
  id: string;
  reference: string;
  origin: string;
  destination: string;
  status: ShipmentStatus;
  createdAt: string;
}

/**
 * Allowed status transitions (single source of truth)
 */
const STATUS_TRANSITIONS: Readonly<
  Record<ShipmentStatus, readonly ShipmentStatus[]>
> = Object.freeze({
  CREATED: ["DOCUMENTS_UPLOADED", "CANCELLED"],
  DOCUMENTS_UPLOADED: ["UNDER_REVIEW", "CANCELLED"],
  UNDER_REVIEW: ["APPROVED", "REJECTED"],
  APPROVED: ["IN_TRANSIT"],
  IN_TRANSIT: ["CLEARED"],
  CLEARED: [],
  REJECTED: [],
  CANCELLED: [],
});

/**
 * Validate whether a status transition is allowed
 */
export function canTransition(
  from: ShipmentStatus,
  to: ShipmentStatus
): boolean {
  return STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Get allowed next statuses (used by UI / admin actions)
 */
export function getNextStatuses(status: ShipmentStatus): ShipmentStatus[] {
  return [...(STATUS_TRANSITIONS[status] ?? [])];
}

/**
 * Transition shipment status safely (pure function)
 */
export function transitionShipmentStatus(
  shipment: Shipment,
  nextStatus: ShipmentStatus
): Shipment {
  if (!canTransition(shipment.status, nextStatus)) {
    throw new Error(
      `Invalid status transition from ${shipment.status} to ${nextStatus}`
    );
  }

  return {
    ...shipment,
    status: nextStatus,
  };
}