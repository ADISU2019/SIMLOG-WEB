import { ShipmentStatus } from "@/types/declarationStatus";

const STATUS_STYLES: Record<ShipmentStatus, string> = {
  CREATED: "bg-gray-100 text-gray-800",
  DOCUMENTS_UPLOADED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-green-100 text-green-800",
  IN_TRANSIT: "bg-purple-100 text-purple-800",
  CLEARED: "bg-teal-100 text-teal-800",
  REJECTED: "bg-red-100 text-red-800",
  CANCELLED: "bg-slate-200 text-slate-700",
};

export default function StatusBadge({
  status,
}: {
  status: ShipmentStatus;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[status]}`}
    >
      {status.replaceAll("_", " ")}
    </span>
  );
}
