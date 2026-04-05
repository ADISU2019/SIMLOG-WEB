// app/types/truck.ts

export type TruckStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export type Truck = {
  id: string;
  tenantSlug: string;

  plateNumber: string;   // unique per tenant
  ownerName: string;

  status: TruckStatus;

  createdAt: string;     // ISO string
  updatedAt: string;     // ISO string
};