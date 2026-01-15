// Auditoría View - Admin attendance verification
import { useState, useEffect } from "react";
import { Card, Button, Badge } from "../components";
import { useAttendanceService, useLegajoRepository } from "../../context";
import type { Person } from "../../modules/legajo/domain";
import type { Attendance } from "../../modules/attendance/domain";

export function AuditoriaView() {
  const attendanceService = useAttendanceService();
  const legajoRepository = useLegajoRepository();

  const [persons, setPersons] = useState<Person[]>([]);
  const [pendingAttendances, setPendingAttendances] = useState<Attendance[]>([]);
  const [allAttendances, setAllAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [personsData, pendingData, allData] = await Promise.all([
      legajoRepository.getAllPersons(),
      attendanceService.listPending(),
      attendanceService.listAll(),
    ]);
    setPersons(personsData);
    setPendingAttendances(pendingData);
    setAllAttendances(allData);
    setIsLoading(false);
  }

  async function handleConfirm(attendance: Attendance) {
    setProcessingId(attendance.id);
    await attendanceService.confirm(attendance, "admin");
    await loadData();
    setProcessingId(null);
  }

  async function handleReject(attendance: Attendance) {
    setProcessingId(attendance.id);
    await attendanceService.reject(attendance, "admin");
    await loadData();
    setProcessingId(null);
  }

  function getPersonName(personId: string): string {
    return persons.find(p => p.id === personId)?.name || "Desconocido";
  }

  function getPersonRole(personId: string): string {
    return persons.find(p => p.id === personId)?.role || "";
  }

  // Statistics
  const stats = {
    pending: allAttendances.filter(a => a.status === "PENDING").length,
    confirmed: allAttendances.filter(a => a.status === "CONFIRMED").length,
    rejected: allAttendances.filter(a => a.status === "REJECTED").length,
    total: allAttendances.length,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Auditoría de Asistencia</h2>
          <p className="text-gray-400 mt-1">Revisa y confirma los registros de horas pendientes</p>
        </div>
        <Button variant="secondary" onClick={loadData}>
          Actualizar
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
          <p className="text-sm text-gray-400">Total Registros</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.total}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-yellow-500/30 p-4">
          <p className="text-sm text-yellow-400">Pendientes</p>
          <p className="text-3xl font-bold text-yellow-400 mt-1">{stats.pending}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-green-500/30 p-4">
          <p className="text-sm text-green-400">Confirmados</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{stats.confirmed}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-red-500/30 p-4">
          <p className="text-sm text-red-400">Rechazados</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{stats.rejected}</p>
        </div>
      </div>

      {/* Pending Records */}
      <Card
        title="Registros Pendientes de Aprobación"
        subtitle={`${pendingAttendances.length} registro(s) requieren verificación`}
      >
        {pendingAttendances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Empleado</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Horario</th>
                  <th className="pb-3 font-medium">Horas</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {pendingAttendances.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-700/30">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                          {getPersonName(att.personId).charAt(0)}
                        </div>
                        <span className="font-medium text-white">{getPersonName(att.personId)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-400">{getPersonRole(att.personId)}</td>
                    <td className="py-4 text-gray-300">{att.date}</td>
                    <td className="py-4 text-gray-300">{att.startTime} - {att.endTime}</td>
                    <td className="py-4">
                      <span className="text-indigo-400 font-semibold">{att.hours} hs</span>
                    </td>
                    <td className="py-4">
                      <Badge status={att.status} />
                    </td>
                    <td className="py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="success"
                          onClick={() => handleConfirm(att)}
                          disabled={processingId === att.id}
                        >
                          {processingId === att.id ? "..." : "Confirmar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleReject(att)}
                          disabled={processingId === att.id}
                        >
                          {processingId === att.id ? "..." : "Rechazar"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-gray-400">No hay registros pendientes de verificación</p>
          </div>
        )}
      </Card>

      {/* All Records History */}
      <Card title="Historial Completo" subtitle="Todos los registros de asistencia">
        {allAttendances.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Empleado</th>
                  <th className="pb-3 font-medium">Fecha</th>
                  <th className="pb-3 font-medium">Horas</th>
                  <th className="pb-3 font-medium">Estado</th>
                  <th className="pb-3 font-medium">Verificado por</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {allAttendances.slice().reverse().map((att) => (
                  <tr key={att.id} className="hover:bg-gray-700/30">
                    <td className="py-3 text-white">{getPersonName(att.personId)}</td>
                    <td className="py-3 text-gray-300">{att.date}</td>
                    <td className="py-3 text-indigo-400 font-medium">{att.hours} hs</td>
                    <td className="py-3">
                      <Badge status={att.status} />
                    </td>
                    <td className="py-3 text-gray-400">{att.verifiedBy || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No hay registros en el historial</p>
        )}
      </Card>
    </div>
  );
}
