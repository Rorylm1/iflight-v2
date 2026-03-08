/**
 * CO2 Emissions Calculator for Flight Tracking
 *
 * Methodology:
 * This calculator estimates CO2 emissions for air travel based on distance flown.
 * Different emission factors are used for different flight distances because:
 * - Short-haul flights have higher emissions per km due to fuel-intensive takeoff/landing phases
 * - Long-haul flights are more fuel-efficient per km once at cruising altitude
 *
 * The Radiative Forcing Index (RFI) multiplier accounts for non-CO2 climate effects
 * of aviation at high altitudes, including:
 * - Nitrogen oxides (NOx) emissions
 * - Contrail formation
 * - Cirrus cloud enhancement
 *
 * Sources: DEFRA, ICAO, and various aviation carbon calculators
 */

/**
 * Emission factors in kg CO2 per passenger-kilometer
 * These represent the base emissions before RFI adjustment
 */
const EMISSION_FACTORS = {
  short: 0.255, // < 1500 km: Higher due to takeoff/landing fuel intensity
  medium: 0.156, // 1500-4000 km: Moderate efficiency
  long: 0.15, // > 4000 km: Most efficient per km at cruise
} as const;

/**
 * Distance thresholds in kilometers for haul categories
 */
const DISTANCE_THRESHOLDS = {
  shortMax: 1500,
  mediumMax: 4000,
} as const;

/**
 * Radiative Forcing Index (RFI) multiplier
 * Accounts for the additional climate impact of emissions at high altitude
 * The IPCC suggests a factor between 1.9 and 4.7; we use 1.9 as a conservative estimate
 */
const RFI_MULTIPLIER = 1.9;

/**
 * Average CO2 absorption per tree per year in kg
 * Based on a mature tree absorbing approximately 22 kg of CO2 annually
 */
const CO2_PER_TREE_PER_YEAR = 22;

export type HaulType = 'short' | 'medium' | 'long';

export interface CO2Result {
  /** Total CO2 emissions in kilograms (including RFI adjustment) */
  co2Kg: number;
  /** Flight category based on distance */
  haul: HaulType;
}

/**
 * Determines the haul type based on flight distance
 *
 * @param distanceKm - Flight distance in kilometers
 * @returns The haul category: 'short', 'medium', or 'long'
 */
function getHaulType(distanceKm: number): HaulType {
  if (distanceKm < DISTANCE_THRESHOLDS.shortMax) {
    return 'short';
  }
  if (distanceKm <= DISTANCE_THRESHOLDS.mediumMax) {
    return 'medium';
  }
  return 'long';
}

/**
 * Calculates CO2 emissions for a single flight based on distance
 *
 * The calculation applies:
 * 1. Distance-appropriate emission factor (short/medium/long haul)
 * 2. Radiative Forcing Index multiplier for high-altitude effects
 *
 * @param distanceKm - Flight distance in kilometers
 * @returns Object containing CO2 in kg and haul type classification
 *
 * @example
 * // Short-haul flight (London to Paris, ~350 km)
 * calculateFlightCO2(350)
 * // Returns: { co2Kg: 169.6, haul: 'short' }
 *
 * @example
 * // Long-haul flight (London to New York, ~5500 km)
 * calculateFlightCO2(5500)
 * // Returns: { co2Kg: 1567.5, haul: 'long' }
 */
export function calculateFlightCO2(distanceKm: number): CO2Result {
  // Handle edge cases
  if (distanceKm <= 0) {
    return { co2Kg: 0, haul: 'short' };
  }

  const haul = getHaulType(distanceKm);
  const emissionFactor = EMISSION_FACTORS[haul];

  // Calculate base CO2 and apply RFI multiplier
  const baseCO2 = distanceKm * emissionFactor;
  const co2Kg = baseCO2 * RFI_MULTIPLIER;

  return {
    co2Kg: Math.round(co2Kg * 10) / 10, // Round to 1 decimal place
    haul,
  };
}

/**
 * Formats CO2 emissions for human-readable display
 *
 * - Values under 1000 kg are shown as "X kg"
 * - Values 1000 kg and above are shown as "X.X tonnes"
 *
 * @param kg - CO2 emissions in kilograms
 * @returns Formatted string with appropriate unit
 *
 * @example
 * formatCO2(245)    // Returns: "245 kg"
 * formatCO2(1200)   // Returns: "1.2 tonnes"
 * formatCO2(2500)   // Returns: "2.5 tonnes"
 */
export function formatCO2(kg: number): string {
  if (kg < 1000) {
    return `${Math.round(kg)} kg`;
  }

  const tonnes = kg / 1000;
  // Round to 1 decimal place, but show whole number if it's exact
  const rounded = Math.round(tonnes * 10) / 10;
  return `${rounded} tonnes`;
}

/**
 * Calculates the number of trees needed to offset CO2 emissions over one year
 *
 * Based on the assumption that a mature tree absorbs approximately 22 kg of CO2 per year.
 * This is a simplified estimate - actual absorption varies by tree species, age, and climate.
 *
 * @param co2Kg - CO2 emissions in kilograms to offset
 * @returns Number of trees needed (rounded up to nearest whole tree)
 *
 * @example
 * getTreeEquivalent(220)  // Returns: 10 (220 / 22 = 10 trees)
 * getTreeEquivalent(500)  // Returns: 23 (500 / 22 = 22.7, rounded up)
 */
export function getTreeEquivalent(co2Kg: number): number {
  if (co2Kg <= 0) {
    return 0;
  }

  return Math.ceil(co2Kg / CO2_PER_TREE_PER_YEAR);
}
