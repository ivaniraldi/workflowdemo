// Cargar Horas View - Employee hours entry
import { useState, useEffect, FormEvent } from "react";
import { Card, Button, Input, Select, Badge } from "../components";
import { useAttendanceService, useLegajoRepository } from "../../context";
import type { Person } from "../../modules/legajo/domain";
import type { Attendance } from "../../modules/attendance/domain";

export function CargarHorasView() {
  const attendanceService = useAttendanceService();
  const legajoRepository = useLegajoRepository();

  const [persons, setPersons] = useState<Person[]>([]);
  const [selectedPersonId, setSelectedPersonId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [recentAttendances, setRecentAttendances] = useState<Attendance[]>([]);

  useEffect(() => {
    loadPersons();
    loadRecentAttendances();
  }, []);

  async function loadPersons() {
    const data = await legajoRepository.getAllPersons();
    setPersons(data);
    if (data.length > 0) {
      setSelectedPersonId(data[0].id);
    }
  }

  async function loadRecentAttendances() {
    const all = await attendanceService.listAll();
    setRecentAttendances(all.slice(-5).reverse());
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedPersonId) return;

    setIsLoading(true);
    setMessage(null);

    try {
      const hours = attendanceService.calculateHours(startTime, endTime);
      if (hours <= 0) {
        setMessage({ type: "error", text: "Las horas calculadas deben ser mayores a 0" });
        return;
      }

      await attendanceService.create(
        selectedPersonId,
        selectedPersonId, // createdBy = same person in this demo
        date,
        startTime,
        endTime
      );

      setMessage({ type: "success", text: `Registro guardado exitosamente (${hours} horas)` });
      await loadRecentAttendances();

      // Reset form
      setDate(new Date().toISOString().split("T")[0]);
      setStartTime("09:00");
      setEndTime("17:00");
    } catch (error) {
      setMessage({ type: "error", text: "Error al guardar el registro" });
    } finally {
      setIsLoading(false);
    }
  }

  const selectedPerson = persons.find(p => p.id === selectedPersonId);
  const previewHours = attendanceService.calculateHours(startTime, endTime);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Cargar Horas</h2>
          <p className="text-gray-400 mt-1">Registra tus horas trabajadas para el período</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Card */}
        <div className="lg:col-span-2">
          <Card title="Nuevo Registro de Horas" subtitle="Completa los datos de tu jornada laboral">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Select
                label="Empleado"
                value={selectedPersonId}
                onChange={(e) => setSelectedPersonId(e.target.value)}
              >
                <option value="">Selecciona un empleado</option>
                {persons.map((person) => (
                  <option key={person.id} value={person.id}>
                    {person.name} - {person.role}
                  </option>
                ))}
              </Select>

              <Input
                type="date"
                label="Fecha"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  type="time"
                  label="Hora de Entrada"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                />
                <Input
                  type="time"
                  label="Hora de Salida"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                />
              </div>

              {/* Preview */}
              <div className="bg-gray-700/50 rounded-lg p-4 border border-gray-600">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Horas calculadas:</span>
                  <span className="text-2xl font-bold text-indigo-400">{previewHours} hs</span>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-lg ${message.type === "success" ? "bg-green-500/20 text-green-400 border border-green-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`}>
                  {message.text}
                </div>
              )}

              <Button
                type="submit"
                disabled={isLoading || !selectedPersonId}
                className="w-full"
              >
                {isLoading ? "Guardando..." : "Guardar Registro"}
              </Button>
            </form>
          </Card>
        </div>

        {/* Info Card */}
        <div className="space-y-6">
          <Card title="Empleado Seleccionado">
            {selectedPerson ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedPerson.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{selectedPerson.name}</p>
                    <p className="text-sm text-gray-400">{selectedPerson.role}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">Selecciona un empleado para ver sus datos</p>
            )}
          </Card>

          <Card title="Registros Recientes">
            {recentAttendances.length > 0 ? (
              <div className="space-y-3">
                {recentAttendances.map((att) => {
                  const person = persons.find(p => p.id === att.personId);
                  return (
                    <div key={att.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-white">{person?.name || "Desconocido"}</p>
                        <p className="text-xs text-gray-400">{att.date} - {att.hours} hs</p>
                      </div>
                      <Badge status={att.status} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-400 text-sm">No hay registros recientes</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
