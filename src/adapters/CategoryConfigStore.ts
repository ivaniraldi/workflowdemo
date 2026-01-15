// Category Configuration Store - Maps roles to their coefficient configurations
import type { CategoryConfig } from "../modules/liquidacion/domain";

// Role-based category configurations for the coefficient calculation
const categoryConfigs: Record<string, CategoryConfig> = {
  "Desarrollador": {
    monthlyHoursRef: 160,      // Reference: 160 hours per month
    coeffFullMonth: 1.0,       // Base coefficient for full month
    fixedCoeff: 0.1,           // Fixed addition for seniority
    plusPercent: 0.05,         // 5% bonus for the role
  },
  "Gerente": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.5,       // Higher base coefficient for managers
    fixedCoeff: 0.2,           // Higher fixed addition
    plusPercent: 0.10,         // 10% bonus for management
  },
  "Diseñadora": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.0,
    fixedCoeff: 0.1,
    plusPercent: 0.03,         // 3% bonus
  },
  // Default config for any unspecified role
  "default": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.0,
    fixedCoeff: 0,
    plusPercent: 0,
  },
};

export function getCategoryConfig(role: string): CategoryConfig {
  return categoryConfigs[role] || categoryConfigs["default"];
}

export function getAllCategoryConfigs(): Record<string, CategoryConfig> {
  return { ...categoryConfigs };
}
