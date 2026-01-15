// Domain types for Attendance module - Pure TypeScript, no external dependencies

export type AttendanceStatus = "PENDING" | "CONFIRMED" | "REJECTED";

export interface Attendance {
  id: string;
  personId: string;
  createdBy: string;
  date: string;
  startTime: string;
  endTime: string;
  hours: number;
  status: AttendanceStatus;
  verifiedBy?: string;
}
