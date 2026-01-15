// Coeficientes View - Manage role coefficients
import { useState, useEffect } from "react";
import { Card, Button, Input } from "../components";
import { getAllCategoryConfigs, setCategoryConfig, deleteCategoryConfig } from "../../adapters";
import type { CategoryConfig } from "../../modules/liquidacion/domain";

interface RoleConfig {
  role: string;
  config: CategoryConfig;
}

export function CoeficientesView() {
  const [configs, setConfigs] = useState<RoleConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [formRole, setFormRole] = useState("");
  const [formMonthlyHours, setFormMonthlyHours] = useState("160");
  const [formCoeffFull, setFormCoeffFull] = useState("1.0");
  const [formFixedCoeff, setFormFixedCoeff] = useState("0");
  const [formPlusPercent, setFormPlusPercent] = useState("0");

  useEffect(() => {
    loadData();
  }, []);

  function loadData() {
    setIsLoading(true);
    const allConfigs = getAllCategoryConfigs();
    const configList = Object.entries(allConfigs)
      .filter(([role]) => role !== "default")
      .map(([role, config]) => ({ role, config }));
    setConfigs(configList);
    setIsLoading(false);
  }

  function handleNewRole() {
    setEditingRole(null);
    setFormRole("");
    setFormMonthlyHours("160");
    setFormCoeffFull("1.0");
    setFormFixedCoeff("0");
    setFormPlusPercent("0");
    setShowForm(true);
  }

  function handleEditRole(roleConfig: RoleConfig) {
    setEditingRole(roleConfig.role);
    setFormRole(roleConfig.role);
    setFormMonthlyHours(roleConfig.config.monthlyHoursRef.toString());
    setFormCoeffFull(roleConfig.config.coeffFullMonth.toString());
    setFormFixedCoeff((roleConfig.config.fixedCoeff ?? 0).toString());
    setFormPlusPercent(((roleConfig.config.plusPercent ?? 0) * 100).toString());
    setShowForm(true);
  }

  function handleSaveRole() {
    if (!formRole.trim()) return;

    const config: CategoryConfig = {
      monthlyHoursRef: parseFloat(formMonthlyHours) || 160,
      coeffFullMonth: parseFloat(formCoeffFull) || 1.0,
      fixedCoeff: parseFloat(formFixedCoeff) || 0,
      plusPercent: (parseFloat(formPlusPercent) || 0) / 100,
    };

    // If editing and role name changed, delete old one
    if (editingRole && editingRole !== formRole.trim()) {
      deleteCategoryConfig(editingRole);
    }

    setCategoryConfig(formRole.trim(), config);

    setShowForm(false);
    setEditingRole(null);
    loadData();
  }

  function handleDeleteRole(role: string) {
    if (!confirm(`¿Eliminar la configuración del rol "${role}"?`)) return;
    deleteCategoryConfig(role);
    loadData();
  }

  // Calculate example distribution
  function calculateExample(config: CategoryConfig, hours: number = 160): number {
    const coefHoras = config.coeffFullMonth * (hours / config.monthlyHoursRef);
    const base = coefHoras + (config.fixedCoeff ?? 0);
    return base * (1 + (config.plusPercent ?? 0));
  }

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
          <h2 className="text-2xl font-bold text-white">Configuración de Coeficientes</h2>
          <p className="text-gray-400 mt-1">Define los coeficientes de distribución por rol</p>
        </div>
        <Button onClick={handleNewRole}>+ Nuevo Rol</Button>
      </div>

      {/* Formula Explanation */}
      <Card title="Fórmula de Cálculo" subtitle="Cómo se calcula el coeficiente final">
        <div className="bg-gray-700/50 rounded-lg p-4 font-mono text-sm">
          <p className="text-gray-300 mb-2">
            <span className="text-indigo-400">Coef_Horas</span> = coeffFullMonth × (horas_trabajadas / monthlyHoursRef)
          </p>
          <p className="text-gray-300 mb-2">
            <span className="text-indigo-400">Base</span> = Coef_Horas + fixedCoeff
          </p>
          <p className="text-gray-300">
            <span className="text-green-400">Coef_Final</span> = Base × (1 + plusPercent)
          </p>
        </div>
      </Card>

      {/* Form Modal */}
      {showForm && (
        <Card title={editingRole ? `Editar: ${editingRole}` : "Nuevo Rol"}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Nombre del Rol"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder="Ej: Desarrollador"
              disabled={!!editingRole}
            />
            <Input
              type="number"
              label="Horas Mensuales de Referencia"
              value={formMonthlyHours}
              onChange={(e) => setFormMonthlyHours(e.target.value)}
              min="1"
            />
            <Input
              type="number"
              label="Coeficiente Mes Completo"
              value={formCoeffFull}
              onChange={(e) => setFormCoeffFull(e.target.value)}
              step="0.1"
              min="0"
            />
            <Input
              type="number"
              label="Coeficiente Fijo (adicional)"
              value={formFixedCoeff}
              onChange={(e) => setFormFixedCoeff(e.target.value)}
              step="0.01"
            />
            <Input
              type="number"
              label="Plus Porcentual (%)"
              value={formPlusPercent}
              onChange={(e) => setFormPlusPercent(e.target.value)}
              step="1"
              min="0"
              max="100"
            />
            <div className="flex items-end">
              <div className="bg-indigo-500/20 rounded-lg p-3 w-full">
                <p className="text-xs text-indigo-400 mb-1">Coef. Final (160hs)</p>
                <p className="text-xl font-bold text-indigo-300">
                  {calculateExample({
                    monthlyHoursRef: parseFloat(formMonthlyHours) || 160,
                    coeffFullMonth: parseFloat(formCoeffFull) || 1,
                    fixedCoeff: parseFloat(formFixedCoeff) || 0,
                    plusPercent: (parseFloat(formPlusPercent) || 0) / 100,
                  }).toFixed(4)}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-6">
            <Button onClick={handleSaveRole} disabled={!formRole.trim()}>
              {editingRole ? "Guardar Cambios" : "Crear Rol"}
            </Button>
            <Button variant="secondary" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Roles Table */}
      <Card title="Roles Configurados" subtitle={`${configs.length} roles definidos`}>
        {configs.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay roles configurados. Crea el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium text-center">Hs. Ref.</th>
                  <th className="pb-3 font-medium text-center">Coef. Full</th>
                  <th className="pb-3 font-medium text-center">Fijo</th>
                  <th className="pb-3 font-medium text-center">Plus %</th>
                  <th className="pb-3 font-medium text-center">Coef. Final*</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {configs.map(({ role, config }) => (
                  <tr key={role} className="hover:bg-gray-700/30">
                    <td className="py-4">
                      <span className="font-medium text-white">{role}</span>
                    </td>
                    <td className="py-4 text-center text-gray-300">
                      {config.monthlyHoursRef}
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-indigo-400 font-mono">
                        {config.coeffFullMonth.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-gray-400 font-mono">
                        +{(config.fixedCoeff ?? 0).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="text-green-400">
                        +{((config.plusPercent ?? 0) * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-bold bg-indigo-500/20 text-indigo-400">
                        {calculateExample(config).toFixed(4)}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEditRole({ role, config })}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => handleDeleteRole(role)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-xs text-gray-500 mt-4">
              * Coeficiente final calculado con 160 horas trabajadas
            </p>
          </div>
        )}
      </Card>

      {/* Simulation */}
      <Card title="Simulador de Coeficientes" subtitle="Calcula el coeficiente para diferentes horas">
        <SimulatorSection configs={configs} />
      </Card>
    </div>
  );
}

function SimulatorSection({ configs }: { configs: RoleConfig[] }) {
  const [selectedRole, setSelectedRole] = useState(configs[0]?.role || "");
  const [hours, setHours] = useState("160");

  const config = configs.find(c => c.role === selectedRole)?.config;

  function calculate(): number {
    if (!config) return 0;
    const h = parseFloat(hours) || 0;
    const coefHoras = config.coeffFullMonth * (h / config.monthlyHoursRef);
    const base = coefHoras + (config.fixedCoeff ?? 0);
    return base * (1 + (config.plusPercent ?? 0));
  }

  if (configs.length === 0) {
    return <p className="text-gray-500 text-sm">Configura al menos un rol para usar el simulador.</p>;
  }

  return (
    <div className="flex flex-wrap gap-4 items-end">
      <div className="w-48">
        <label className="block text-sm font-medium text-gray-400 mb-1">Rol</label>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg px-3 py-2"
        >
          {configs.map(c => (
            <option key={c.role} value={c.role}>{c.role}</option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <Input
          type="number"
          label="Horas"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          min="0"
        />
      </div>
      <div className="bg-green-500/20 rounded-lg p-3">
        <p className="text-xs text-green-400 mb-1">Coeficiente Resultante</p>
        <p className="text-2xl font-bold text-green-300">{calculate().toFixed(4)}</p>
      </div>
    </div>
  );
}
