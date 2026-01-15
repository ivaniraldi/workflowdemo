// Service class for Liquidacion module - Pure business logic
import type { CategoryConfig, LiquidationLine } from "./domain";

export class LiquidationService {
  calculateCoeff(hours: number, cfg: CategoryConfig): number {
    const coefHoras = cfg.coeffFullMonth * (hours / cfg.monthlyHoursRef);
    const base = coefHoras + (cfg.fixedCoeff ?? 0);
    return base * (1 + (cfg.plusPercent ?? 0));
  }

  distribute(
    excedente: number,
    data: { personId: string; hours: number; cfg: CategoryConfig }[]
  ): LiquidationLine[] {
    const coeffs = data.map(d => ({
      personId: d.personId,
      coeff: this.calculateCoeff(d.hours, d.cfg),
    }));

    const total = coeffs.reduce((a, b) => a + b.coeff, 0);

    return coeffs.map(c => ({
      personId: c.personId,
      coeffFinal: c.coeff,
      percentage: total === 0 ? 0 : c.coeff / total,
      gross: total === 0 ? 0 : Math.round((excedente * c.coeff / total) * 100) / 100,
    }));
  }
}
