// app/types/driver.ts

export type DriverStatus = "ACTIVE" | "INACTIVE";

export type Driver = {
  id: string;
  tenantSlug: string;

  fullName: string;
  phoneNumber?: string;

  status: DriverStatus;

  createdAt: string; // ISO string
  updatedAt: string; // ISO string
};