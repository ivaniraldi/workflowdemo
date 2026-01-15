// Service class for Recibo module - Pure business logic

export interface Receipt {
  id: string;
  personId: string;
  period: string;
  gross: number;
  discounts: { label: string; amount: number }[];
  net: number;
}

export class ReceiptService {
  generate(
    personId: string,
    period: string,
    gross: number,
    discounts: { label: string; amount: number }[]
  ): Receipt {
    const totalDiscounts = discounts.reduce((a, b) => a + b.amount, 0);
    return {
      id: crypto.randomUUID(),
      personId,
      period,
      gross,
      discounts,
      net: gross - totalDiscounts,
    };
  }
}
