// Empleados View - CRUD for employees
import { useState, useEffect } from "react";
import { Card, Button, Input, Select } from "../components";
import { useLegajoRepository } from "../../context";
import { getAvailableRoles } from "../../adapters";
import type { Person, Discount } from "../../modules/legajo/domain";

export function EmpleadosView() {
  const legajoRepository = useLegajoRepository();

  const [persons, setPersons] = useState<Person[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formRole, setFormRole] = useState("");

  // Discounts state
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personDiscounts, setPersonDiscounts] = useState<Discount[]>([]);
  const [discountLabel, setDiscountLabel] = useState("");
  const [discountAmount, setDiscountAmount] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setIsLoading(true);
    const personsData = await legajoRepository.getAllPersons();
    setPersons(personsData);
    setRoles(getAvailableRoles());
    setIsLoading(false);
  }

  async function loadDiscounts(personId: string) {
    const discounts = await legajoRepository.getDiscounts(personId);
    setPersonDiscounts(discounts);
  }

  function handleNewPerson() {
    setEditingId(null);
    setFormName("");
    setFormRole(roles[0] || "");
    setShowForm(true);
  }

  function handleEditPerson(person: Person) {
    setEditingId(person.id);
    setFormName(person.name);
    setFormRole(person.role);
    setShowForm(true);
  }

  async function handleSavePerson() {
    if (!formName.trim() || !formRole) return;

    if (editingId) {
      await legajoRepository.updatePerson(editingId, {
        name: formName.trim(),
        role: formRole,
      });
    } else {
      await legajoRepository.addPerson({
        name: formName.trim(),
        role: formRole,
      });
    }

    setShowForm(false);
    setEditingId(null);
    setFormName("");
    setFormRole("");
    await loadData();
  }

  async function handleDeletePerson(id: string) {
    if (!confirm("¿Eliminar este empleado y sus descuentos asociados?")) return;
    await legajoRepository.deletePerson(id);
    if (selectedPersonId === id) {
      setSelectedPersonId(null);
      setPersonDiscounts([]);
    }
    await loadData();
  }

  async function handleSelectPerson(personId: string) {
    setSelectedPersonId(personId);
    await loadDiscounts(personId);
  }

  async function handleAddDiscount() {
    if (!selectedPersonId || !discountLabel.trim() || !discountAmount) return;

    await legajoRepository.addDiscount({
      personId: selectedPersonId,
      label: discountLabel.trim(),
      amount: parseFloat(discountAmount),
    });

    setDiscountLabel("");
    setDiscountAmount("");
    await loadDiscounts(selectedPersonId);
  }

  async function handleDeleteDiscount(id: string) {
    await legajoRepository.deleteDiscount(id);
    if (selectedPersonId) {
      await loadDiscounts(selectedPersonId);
    }
  }

  const selectedPerson = persons.find(p => p.id === selectedPersonId);

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
          <h2 className="text-2xl font-bold text-white">Gestión de Empleados</h2>
          <p className="text-gray-400 mt-1">Administra empleados y sus descuentos</p>
        </div>
        <Button onClick={handleNewPerson}>+ Nuevo Empleado</Button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <Card title={editingId ? "Editar Empleado" : "Nuevo Empleado"}>
          <div className="space-y-4">
            <Input
              label="Nombre completo"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="Ej: Juan Pérez"
            />
            <Select
              label="Rol / Categoría"
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
            >
              {roles.map(r => (
                <option key={r} value={r}>{r}</option>
              ))}
            </Select>
            <div className="flex gap-3">
              <Button onClick={handleSavePerson} disabled={!formName.trim() || !formRole}>
                {editingId ? "Guardar Cambios" : "Crear Empleado"}
              </Button>
              <Button variant="secondary" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Employees Table */}
      <Card title="Lista de Empleados" subtitle={`${persons.length} empleados registrados`}>
        {persons.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            No hay empleados registrados. Crea el primero.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-sm text-gray-400 border-b border-gray-700">
                  <th className="pb-3 font-medium">Nombre</th>
                  <th className="pb-3 font-medium">Rol</th>
                  <th className="pb-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {persons.map((person) => (
                  <tr
                    key={person.id}
                    className={`hover:bg-gray-700/30 cursor-pointer ${
                      selectedPersonId === person.id ? "bg-indigo-500/10" : ""
                    }`}
                    onClick={() => handleSelectPerson(person.id)}
                  >
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-medium">
                          {person.name.charAt(0)}
                        </div>
                        <span className="font-medium text-white">{person.name}</span>
                      </div>
                    </td>
                    <td className="py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-gray-700 text-gray-300">
                        {person.role}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditPerson(person);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 text-sm"
                        >
                          Editar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePerson(person.id);
                          }}
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
          </div>
        )}
      </Card>

      {/* Discounts Section */}
      {selectedPerson && (
        <Card
          title={`Descuentos de ${selectedPerson.name}`}
          subtitle="Gestiona los descuentos fijos del empleado"
        >
          {/* Add Discount Form */}
          <div className="flex gap-4 mb-6">
            <div className="flex-1">
              <Input
                label="Concepto"
                value={discountLabel}
                onChange={(e) => setDiscountLabel(e.target.value)}
                placeholder="Ej: Obra Social"
              />
            </div>
            <div className="w-40">
              <Input
                type="number"
                label="Monto"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddDiscount}
                disabled={!discountLabel.trim() || !discountAmount}
              >
                Agregar
              </Button>
            </div>
          </div>

          {/* Discounts List */}
          {personDiscounts.length === 0 ? (
            <div className="text-center py-4 text-gray-500 text-sm">
              Sin descuentos registrados
            </div>
          ) : (
            <div className="space-y-2">
              {personDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg"
                >
                  <span className="text-gray-300">{discount.label}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-red-400 font-medium">
                      -${discount.amount.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                    </span>
                    <button
                      onClick={() => handleDeleteDiscount(discount.id)}
                      className="text-gray-500 hover:text-red-400 text-sm"
                    >
                      Quitar
                    </button>
                  </div>
                </div>
              ))}
              <div className="flex justify-between pt-3 border-t border-gray-700 font-medium">
                <span className="text-gray-400">Total Descuentos</span>
                <span className="text-red-400">
                  -${personDiscounts.reduce((a, b) => a + b.amount, 0).toLocaleString("es-AR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
