// LocalStorage Adapter implementing AttendancePort
import type { Attendance, AttendanceStatus } from "../modules/attendance/domain";
import type { AttendancePort } from "../modules/attendance/port";

const STORAGE_KEY = "attendance_records";

export class LocalStorageAttendanceRepository implements AttendancePort {
  private getAll(): Attendance[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  private saveAll(records: Attendance[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  }

  async save(attendance: Attendance): Promise<void> {
    const records = this.getAll();
    const existingIndex = records.findIndex(r => r.id === attendance.id);

    if (existingIndex >= 0) {
      records[existingIndex] = attendance;
    } else {
      records.push(attendance);
    }

    this.saveAll(records);
  }

  async listByStatus(status: AttendanceStatus): Promise<Attendance[]> {
    const records = this.getAll();
    return records.filter(r => r.status === status);
  }

  async listAll(): Promise<Attendance[]> {
    return this.getAll();
  }
}
