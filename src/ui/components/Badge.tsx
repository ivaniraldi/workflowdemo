// Status Badge component
import type { AttendanceStatus } from "../../modules/attendance/domain";

interface BadgeProps {
  status: AttendanceStatus;
}

const statusConfig: Record<AttendanceStatus, { label: string; className: string }> = {
  PENDING: {
    label: "Pendiente",
    className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  },
  CONFIRMED: {
    label: "Confirmado",
    className: "bg-green-500/20 text-green-400 border-green-500/30",
  },
  REJECTED: {
    label: "Rechazado",
    className: "bg-red-500/20 text-red-400 border-red-500/30",
  },
};

export function Badge({ status }: BadgeProps) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
}
