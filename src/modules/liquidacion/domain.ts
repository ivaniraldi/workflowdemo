// Domain types for Liquidacion module - Pure TypeScript, no external dependencies

export interface CategoryConfig {
  monthlyHoursRef: number;
  coeffFullMonth: number;
  fixedCoeff?: number;
  plusPercent?: number;
}

export interface LiquidationLine {
  personId: string;
  coeffFinal: number;
  percentage: number;
  gross: number;
}
