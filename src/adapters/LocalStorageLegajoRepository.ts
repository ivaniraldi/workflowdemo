// LocalStorage Adapter implementing LegajoPort
import type { Person, Discount } from "../modules/legajo/domain";
import type { LegajoPort } from "../modules/legajo/port";

const PERSONS_KEY = "legajo_persons";
const DISCOUNTS_KEY = "legajo_discounts";

export class LocalStorageLegajoRepository implements LegajoPort {
  async getAllPersons(): Promise<Person[]> {
    const data = localStorage.getItem(PERSONS_KEY);
    return data ? JSON.parse(data) : [];
  }

  async getDiscounts(personId: string): Promise<Discount[]> {
    const data = localStorage.getItem(DISCOUNTS_KEY);
    const allDiscounts: Discount[] = data ? JSON.parse(data) : [];
    return allDiscounts.filter(d => d.personId === personId);
  }

  async addPerson(person: Omit<Person, "id">): Promise<Person> {
    const persons = await this.getAllPersons();
    const newPerson: Person = {
      ...person,
      id: crypto.randomUUID(),
    };
    persons.push(newPerson);
    localStorage.setItem(PERSONS_KEY, JSON.stringify(persons));
    return newPerson;
  }

  async updatePerson(id: string, data: Partial<Person>): Promise<Person | null> {
    const persons = await this.getAllPersons();
    const index = persons.findIndex(p => p.id === id);
    if (index === -1) return null;

    persons[index] = { ...persons[index], ...data };
    localStorage.setItem(PERSONS_KEY, JSON.stringify(persons));
    return persons[index];
  }

  async deletePerson(id: string): Promise<boolean> {
    const persons = await this.getAllPersons();
    const filtered = persons.filter(p => p.id !== id);
    if (filtered.length === persons.length) return false;

    localStorage.setItem(PERSONS_KEY, JSON.stringify(filtered));

    // Also delete associated discounts
    const discountsData = localStorage.getItem(DISCOUNTS_KEY);
    if (discountsData) {
      const discounts: Discount[] = JSON.parse(discountsData);
      const filteredDiscounts = discounts.filter(d => d.personId !== id);
      localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(filteredDiscounts));
    }

    return true;
  }

  async addDiscount(discount: Omit<Discount, "id">): Promise<Discount> {
    const data = localStorage.getItem(DISCOUNTS_KEY);
    const discounts: Discount[] = data ? JSON.parse(data) : [];
    const newDiscount: Discount = {
      ...discount,
      id: crypto.randomUUID(),
    };
    discounts.push(newDiscount);
    localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
    return newDiscount;
  }

  async deleteDiscount(id: string): Promise<boolean> {
    const data = localStorage.getItem(DISCOUNTS_KEY);
    const discounts: Discount[] = data ? JSON.parse(data) : [];
    const filtered = discounts.filter(d => d.id !== id);
    if (filtered.length === discounts.length) return false;

    localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(filtered));
    return true;
  }
}

// Seed data initializer
export function seedLegajoData(): void {
  const existingPersons = localStorage.getItem(PERSONS_KEY);

  if (!existingPersons) {
    const persons: Person[] = [
      { id: "p1", name: "Iván García", role: "Desarrollador" },
      { id: "p2", name: "Abel Martínez", role: "Gerente" },
      { id: "p3", name: "María López", role: "Diseñadora" },
    ];
    localStorage.setItem(PERSONS_KEY, JSON.stringify(persons));
  }

  const existingDiscounts = localStorage.getItem(DISCOUNTS_KEY);

  if (!existingDiscounts) {
    const discounts: Discount[] = [
      { id: "d1", personId: "p1", label: "Obra Social", amount: 1500 },
      { id: "d2", personId: "p1", label: "Sindicato", amount: 500 },
      { id: "d3", personId: "p2", label: "Obra Social", amount: 2000 },
      { id: "d4", personId: "p2", label: "Préstamo Personal", amount: 3000 },
      { id: "d5", personId: "p3", label: "Obra Social", amount: 1500 },
    ];
    localStorage.setItem(DISCOUNTS_KEY, JSON.stringify(discounts));
  }
}
