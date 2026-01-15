// Liquidación View - Surplus distribution calculation
import { useState, useEffect } from "react";
import { Card, Button, Input } from "../components";
import { useAttendanceService, useLegajoRepository, useLiquidationService } from "../../context";
import { getCategoryConfig } from "../../adapters";
import type { Person } from "../../modules/legajo/domain";
import type { Attendance } from "../../modules/attendance/domain";
import type { LiquidationLine } from "../../modules/liquidacion/domain";

interface LiquidationResult extends LiquidationLine {
  personName: string;
  personRole: string;
  hours: number;
}

export function LiquidacionView() {
  const attendanceService = useAttendanceService();
  const legajoRepository = useLegajoRepository();
  const liquidationService = useLiquidationService();

  const [persons, setPersons] = useState<Person[]>([]);
  const [confirmedAttendances, setConfirmedAttendances] = useState<Attendance[]>([]);
  const [excedente, setExcedente] = useState<string>("100000");
  const [results, setResults] = useState<LiquidationResult[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const [personsData, attendancesData] = await Promise.all([
      legajoRepository.getAllPersons(),
      attendanceService.listConfirmed(),
    ]);
    setPersons(personsData);
    setConfirmedAttendances(attendancesData);
    setIsLoading(false);
  }

  // Calculate hours per person from confirmed attendances
  function calculateHoursPerPerson(): Map<string, number> {
    const hoursMap = new Map<string, number>();

    confirmedAttendances.forEach(att => {
      const current = hoursMap.get(att.personId) || 0;
      hoursMap.set(att.personId, current + att.hours);
    });

    return hoursMap;
  }

  async function handleCalculate() {
    if (!excedente || parseFloat(excedente) <= 0) return;

    setIsCalculating(true);

    // Simulate async calculation
    await new Promise(resolve => setTimeout(resolve, 500));

    const hoursMap = calculateHoursPerPerson();

    // Build distribution data
    const distributionData = persons
      .filter(p => hoursMap.has(p.id))
      .map(p => ({
        personId: p.id,
        hours: hoursMap.get(p.id)!,
        cfg: getCategoryConfig(p.role),
      }));

    if (distributionData.length === 0) {
      setResults([]);
      setIsCalculating(false);
      return;
    }

    const liquidationLines = liquidationService.distribute(
      parseFloat(excedente),
      distributionData
    );

    // Enrich with person data
    const enrichedResults: LiquidationResult[] = liquidationLines.map(line => {
      const person = persons.find(p => p.id === line.personId)!;
      return {
        ...line,
        personName: person.name,
        personRole: person.role,
        hours: hoursMap.get(line.personId)!,
      };
    });

    setResults(enrichedResults);
    setIsCalculating(false);
  }

  // Summary calculations
  const hoursMap = calculateHoursPerPerson();
  const totalHours = Array.from(hoursMap.values()).reduce((a, b) => a + b, 0);
  const totalGross = results.reduce((a, b) => a + b.gross, 0);

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
          <h2 className="text-2xl font-bold text-white">Liquidación de Excedentes</h2>
          <p className="text-gray-400 mt-1">Calcula la distribución proporcional del fondo compartido</p>
        </div>
      </div>

      {/* Input Section */}
      <Card title="Configuración de la Liquidación" subtitle="Ingresa el monto total a distribuir">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <Input
              type="number"
              label="Monto a Repartir (Excedente)"
              value={excedente}
              onChange={(e) => setExcedente(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <Button
            onClick={handleCalculate}
            disabled={isCalculating || confirmedAttendances.length === 0}
            className="md:w-48"
          >
            {isCalculating ? "Calculando..." : "Calcular Distribución"}
          </Button>
        </div>

        {confirmedAttendances.length === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg text-yellow-400 text-sm">
            No hay registros de asistencia confirmados. Primero confirma registros en la sección de Auditoría.
          </div>
        )}
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-1">Empleados con Horas</p>
          <p className="text-3xl font-bold text-white">{hoursMap.size}</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-1">Total Horas Confirmadas</p>
          <p className="text-3xl font-bold text-indigo-400">{totalHours.toFixed(2)} hs</p>
        </div>
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
          <p className="text-sm text-gray-400 mb-1">Monto a Distribuir</p>
          <p className="text-3xl font-bold text-green-400">
            ${parseFloat(excedente || "0").toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Results Table */}
      {results.length > 0 && (
        <Card title="Resultado de la Distribución" subtitle="Detalle por empleado">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Empleado</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium text-right">Horas</th>
                  <th className="pb-3 font-medium text-right">Coeficiente</th>
                  <th className="pb-3 font-medium text-right">% Participación</th>
                  <th className="pb-3 font-medium text-right">Bruto Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {results.map((result) => (
                  <tr key={result.personId} className="hover:bg-gray-700/30">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                          {result.personName.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{result.personName}</span>
                      </div>
                    </td>
                    <td className="py-4 text-gray-400">{result.personRole}</td>
                    <td className="py-4 text-right text-gray-300">{result.hours.toFixed(2)} hs</td>
                    <td className="py-4 text-right">
                      <span className="text-indigo-400 font-mono">{result.coeffFinal.toFixed(4)}</span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-indigo-500/20 text-indigo-400">
                        {(result.percentage * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-xl font-bold text-green-400">
                        ${result.gross.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="border-t-2 border-gray-600">
                <tr className="font-semibold">
                  <td className="py-4 text-white" colSpan={2}>TOTAL</td>
                  <td className="py-4 text-right text-gray-300">{totalHours.toFixed(2)} hs</td>
                  <td className="py-4"></td>
                  <td className="py-4 text-right text-indigo-400">100.00%</td>
                  <td className="py-4 text-right text-2xl font-bold text-green-400">
                    ${totalGross.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {/* Formula Explanation */}
      <Card title="Fórmula de Cálculo" subtitle="Cómo se calcula el coeficiente de distribución">
        <div className="bg-gray-700/50 rounded-lg p-4 font-mono text-sm">
          <p className="text-gray-300 mb-2">
            <span className="text-indigo-400">Coef_Horas</span> = coeffFullMonth × (horas / monthlyHoursRef)
          </p>
          <p className="text-gray-300 mb-2">
            <span className="text-indigo-400">Base</span> = Coef_Horas + fixedCoeff
          </p>
          <p className="text-gray-300 mb-2">
            <span className="text-indigo-400">Coef_Final</span> = Base × (1 + plusPercent)
          </p>
          <p className="text-gray-300 mt-4 pt-4 border-t border-gray-600">
            <span className="text-green-400">Bruto</span> = Excedente × (Coef_Final / Suma_Coefs)
          </p>
        </div>
      </Card>
    </div>
  );
}
