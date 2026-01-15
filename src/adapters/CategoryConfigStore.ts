// Category Configuration Store - Maps roles to their coefficient configurations
import type { CategoryConfig } from "../modules/liquidacion/domain";

const CONFIGS_KEY = "category_configs";

// Default role-based category configurations
const defaultConfigs: Record<string, CategoryConfig> = {
  "Desarrollador": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.0,
    fixedCoeff: 0.1,
    plusPercent: 0.05,
  },
  "Gerente": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.5,
    fixedCoeff: 0.2,
    plusPercent: 0.10,
  },
  "Diseñadora": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.0,
    fixedCoeff: 0.1,
    plusPercent: 0.03,
  },
  "default": {
    monthlyHoursRef: 160,
    coeffFullMonth: 1.0,
    fixedCoeff: 0,
    plusPercent: 0,
  },
};

function loadConfigs(): Record<string, CategoryConfig> {
  const data = localStorage.getItem(CONFIGS_KEY);
  if (data) {
    return JSON.parse(data);
  }
  // Initialize with defaults
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(defaultConfigs));
  return defaultConfigs;
}

export function getCategoryConfig(role: string): CategoryConfig {
  const configs = loadConfigs();
  return configs[role] || configs["default"];
}

export function getAllCategoryConfigs(): Record<string, CategoryConfig> {
  return loadConfigs();
}

export function setCategoryConfig(role: string, config: CategoryConfig): void {
  const configs = loadConfigs();
  configs[role] = config;
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
}

export function deleteCategoryConfig(role: string): boolean {
  if (role === "default") return false;
  const configs = loadConfigs();
  if (!configs[role]) return false;
  delete configs[role];
  localStorage.setItem(CONFIGS_KEY, JSON.stringify(configs));
  return true;
}

export function getAvailableRoles(): string[] {
  const configs = loadConfigs();
  return Object.keys(configs).filter(r => r !== "default");
}
