// Port interface for Attendance module - Defines the contract for external adapters
import type { Attendance, AttendanceStatus } from "./domain";

export interface AttendancePort {
  save(attendance: Attendance): Promise<void>;
  listByStatus(status: AttendanceStatus): Promise<Attendance[]>;
  listAll(): Promise<Attendance[]>;
}
