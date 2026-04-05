// services/shipmentService.ts

import { ShipmentStatus } from "@/types/declarationStatus";

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
  [ShipmentStatus.CREATED]: [
    ShipmentStatus.DOCUMENTS_UPLOADED,
    ShipmentStatus.CANCELLED,
  ],
  [ShipmentStatus.DOCUMENTS_UPLOADED]: [
    ShipmentStatus.UNDER_REVIEW,
    ShipmentStatus.CANCELLED,
  ],
  [ShipmentStatus.UNDER_REVIEW]: [
    ShipmentStatus.APPROVED,
    ShipmentStatus.REJECTED,
  ],
  [ShipmentStatus.APPROVED]: [ShipmentStatus.IN_TRANSIT],
  [ShipmentStatus.IN_TRANSIT]: [ShipmentStatus.CLEARED],
  [ShipmentStatus.CLEARED]: [],
  [ShipmentStatus.REJECTED]: [],
  [ShipmentStatus.CANCELLED]: [],
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
export function getNextStatuses(
  status: ShipmentStatus
): ShipmentStatus[] {
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
