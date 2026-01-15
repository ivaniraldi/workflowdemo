// Recibos View - Generate final receipts/pay stubs
import { useState, useEffect } from "react";
import { Card, Button, Input } from "../components";
import { useAttendanceService, useLegajoRepository, useLiquidationService, useReceiptService } from "../../context";
import { getCategoryConfig } from "../../adapters";
import type { Person } from "../../modules/legajo/domain";
import type { Receipt } from "../../modules/recibo/service";

interface ReceiptWithPerson extends Receipt {
  personName: string;
  personRole: string;
}

export function RecibosView() {
  const attendanceService = useAttendanceService();
  const legajoRepository = useLegajoRepository();
  const liquidationService = useLiquidationService();
  const receiptService = useReceiptService();

  const [persons, setPersons] = useState<Person[]>([]);
  const [excedente, setExcedente] = useState<string>("100000");
  const [period, setPeriod] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [receipts, setReceipts] = useState<ReceiptWithPerson[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const personsData = await legajoRepository.getAllPersons();
    setPersons(personsData);
    setIsLoading(false);
  }

  async function handleGenerateReceipts() {
    if (!excedente || parseFloat(excedente) <= 0) return;

    setIsGenerating(true);

    // Get confirmed attendances
    const confirmedAttendances = await attendanceService.listConfirmed();

    // Calculate hours per person
    const hoursMap = new Map<string, number>();
    confirmedAttendances.forEach(att => {
      const current = hoursMap.get(att.personId) || 0;
      hoursMap.set(att.personId, current + att.hours);
    });

    // Build distribution data
    const distributionData = persons
      .filter(p => hoursMap.has(p.id))
      .map(p => ({
        personId: p.id,
        hours: hoursMap.get(p.id)!,
        cfg: getCategoryConfig(p.role),
      }));

    if (distributionData.length === 0) {
      setReceipts([]);
      setIsGenerating(false);
      return;
    }

    // Calculate distribution
    const liquidationLines = liquidationService.distribute(
      parseFloat(excedente),
      distributionData
    );

    // Generate receipts with discounts
    const generatedReceipts: ReceiptWithPerson[] = await Promise.all(
      liquidationLines.map(async (line) => {
        const person = persons.find(p => p.id === line.personId)!;
        const personDiscounts = await legajoRepository.getDiscounts(line.personId);

        const receipt = receiptService.generate(
          line.personId,
          period,
          line.gross,
          personDiscounts.map(d => ({ label: d.label, amount: d.amount }))
        );

        return {
          ...receipt,
          personName: person.name,
          personRole: person.role,
        };
      })
    );

    setReceipts(generatedReceipts);
    setIsGenerating(false);
  }

  // Total calculations
  const totalGross = receipts.reduce((a, b) => a + b.gross, 0);
  const totalDiscounts = receipts.reduce((a, b) => a + b.discounts.reduce((x, y) => x + y.amount, 0), 0);
  const totalNet = receipts.reduce((a, b) => a + b.net, 0);

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
          <h2 className="text-2xl font-bold text-white">Generación de Recibos</h2>
          <p className="text-gray-400 mt-1">Genera los comprobantes de pago finales con descuentos aplicados</p>
        </div>
      </div>

      {/* Generation Form */}
      <Card title="Parámetros de Generación" subtitle="Configura el período y monto para generar los recibos">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <Input
            type="month"
            label="Período"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
          />
          <Input
            type="number"
            label="Monto Excedente"
            value={excedente}
            onChange={(e) => setExcedente(e.target.value)}
            min="0"
            step="0.01"
          />
          <Button
            onClick={handleGenerateReceipts}
            disabled={isGenerating}
            className="h-[42px]"
          >
            {isGenerating ? "Generando..." : "Generar Recibos"}
          </Button>
        </div>
      </Card>

      {/* Summary */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-800 rounded-xl border border-gray-700 p-5">
            <p className="text-sm text-gray-400 mb-1">Recibos Generados</p>
            <p className="text-3xl font-bold text-white">{receipts.length}</p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-indigo-500/30 p-5">
            <p className="text-sm text-indigo-400 mb-1">Total Bruto</p>
            <p className="text-3xl font-bold text-indigo-400">
              ${totalGross.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-red-500/30 p-5">
            <p className="text-sm text-red-400 mb-1">Total Descuentos</p>
            <p className="text-3xl font-bold text-red-400">
              -${totalDiscounts.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-gray-800 rounded-xl border border-green-500/30 p-5">
            <p className="text-sm text-green-400 mb-1">Total Neto</p>
            <p className="text-3xl font-bold text-green-400">
              ${totalNet.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Receipt Cards */}
      {receipts.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {receipts.map((receipt) => (
            <div
              key={receipt.id}
              className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl border border-gray-700 overflow-hidden shadow-xl"
            >
              {/* Receipt Header */}
              <div className="bg-indigo-600 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-indigo-200 uppercase tracking-wider">Recibo de Haberes</p>
                    <p className="text-white font-bold text-lg mt-1">{receipt.personName}</p>
                    <p className="text-indigo-200 text-sm">{receipt.personRole}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-indigo-200">Período</p>
                    <p className="text-white font-semibold">{receipt.period}</p>
                  </div>
                </div>
              </div>

              {/* Receipt Body */}
              <div className="p-6 space-y-4">
                {/* Gross */}
                <div className="flex items-center justify-between py-3 border-b border-gray-700">
                  <span className="text-gray-400">Haberes Brutos</span>
                  <span className="text-xl font-bold text-white">
                    ${receipt.gross.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Discounts */}
                <div className="space-y-2">
                  <p className="text-sm text-gray-400 font-medium">Deducciones:</p>
                  {receipt.discounts.length > 0 ? (
                    receipt.discounts.map((discount, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">- {discount.label}</span>
                        <span className="text-red-400">
                          -${discount.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">Sin deducciones</p>
                  )}
                </div>

                {/* Total Discounts */}
                {receipt.discounts.length > 0 && (
                  <div className="flex items-center justify-between py-2 border-t border-gray-700">
                    <span className="text-gray-400">Total Deducciones</span>
                    <span className="text-red-400 font-semibold">
                      -${receipt.discounts.reduce((a, b) => a + b.amount, 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}

                {/* Net */}
                <div className="flex items-center justify-between py-4 bg-green-500/10 rounded-lg px-4 border border-green-500/30">
                  <span className="text-green-400 font-semibold">NETO A COBRAR</span>
                  <span className="text-2xl font-bold text-green-400">
                    ${receipt.net.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                  </span>
                </div>

                {/* Receipt ID */}
                <div className="text-center pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 font-mono">ID: {receipt.id.slice(0, 8)}...</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {receipts.length === 0 && !isGenerating && (
        <Card>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <p className="text-gray-400 mb-2">No hay recibos generados</p>
            <p className="text-sm text-gray-500">
              Configura los parámetros y haz clic en "Generar Recibos" para crear los comprobantes
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
