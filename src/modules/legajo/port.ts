// Port interface for Legajo module - Defines the contract for external adapters
import type { Person, Discount } from "./domain";

export interface LegajoPort {
  getAllPersons(): Promise<Person[]>;
  getDiscounts(personId: string): Promise<Discount[]>;
}
