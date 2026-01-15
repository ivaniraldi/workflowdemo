// Service class for Attendance module - Pure business logic
import type { Attendance } from "./domain";
import type { AttendancePort } from "./port";

export class AttendanceService {
  constructor(private repo: AttendancePort) {}

  calculateHours(start: string, end: string): number {
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    let m = (eh * 60 + em) - (sh * 60 + sm);
    if (m < 0) m += 1440;
    return Math.round((m / 60) * 100) / 100;
  }

  async create(personId: string, createdBy: string, date: string, start: string, end: string) {
    const att: Attendance = {
      id: crypto.randomUUID(),
      personId,
      createdBy,
      date,
      startTime: start,
      endTime: end,
      hours: this.calculateHours(start, end),
      status: "PENDING",
    };
    await this.repo.save(att);
    return att;
  }

  async confirm(att: Attendance, verifierId: string) {
    const confirmed = { ...att, status: "CONFIRMED" as const, verifiedBy: verifierId };
    await this.repo.save(confirmed);
    return confirmed;
  }

  async reject(att: Attendance, verifierId: string) {
    const rejected = { ...att, status: "REJECTED" as const, verifiedBy: verifierId };
    await this.repo.save(rejected);
    return rejected;
  }

  async listPending() {
    return this.repo.listByStatus("PENDING");
  }

  async listConfirmed() {
    return this.repo.listByStatus("CONFIRMED");
  }

  async listAll() {
    return this.repo.listAll();
  }
}
