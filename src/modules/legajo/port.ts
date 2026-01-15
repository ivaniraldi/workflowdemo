// Port interface for Legajo module - Defines the contract for external adapters
import type { Person, Discount } from "./domain";

export interface LegajoPort {
  getAllPersons(): Promise<Person[]>;
  getDiscounts(personId: string): Promise<Discount[]>;
  addPerson(person: Omit<Person, "id">): Promise<Person>;
  updatePerson(id: string, data: Partial<Person>): Promise<Person | null>;
  deletePerson(id: string): Promise<boolean>;
  addDiscount(discount: Omit<Discount, "id">): Promise<Discount>;
  deleteDiscount(id: string): Promise<boolean>;
}
