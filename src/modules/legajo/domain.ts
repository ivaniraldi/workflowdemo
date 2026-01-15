// Domain types for Legajo module - Pure TypeScript, no external dependencies

export interface Person {
  id: string;
  name: string;
  role: string;
}

export interface Discount {
  id: string;
  personId: string;
  label: string;
  amount: number;
}
