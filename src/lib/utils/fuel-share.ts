/**
 * Advisory Fuel Share and Points Calculation Utility
 * 
 * STRICT COMPLIANCE RULES:
 * 1. Zero commercial fares. No payments inside the app.
 * 2. Fuel sharing is peer-to-peer and advisory only.
 * 3. 1 Fuel Point = ₹1 equivalent of shared fuel cost.
 * 4. Formula:
 *    - Total Trip Fuel (L) = distanceKm / vehicleMileageKmPerLitre
 *    - Total Trip Fuel Cost (₹) = Total Trip Fuel * fuelPricePerLitre (Bangalore Petrol default ~₹102.86)
 *    - Shared Fair Contribution = Total Trip Fuel Cost / (totalOccupants)
 *      where totalOccupants = totalSeats (or 1 driver + offered seats)
 */

export const BANGALORE_FUEL_PRICE_PER_LITRE = 103; // Current average petrol price in INR

export interface FuelPointsCalculation {
  tripDistanceKm: number;
  vehicleMileageKmPerLitre: number;
  fuelPricePerLitre: number;
  totalFuelLitreUsed: number;
  totalTripFuelCostINR: number;
  occupantCount: number; // Driver + Passengers
  perPassengerPoints: number; // 1 Point = ₹1
  settlementNote: string;
}

export function calculateFuelSharePoints(params: {
  distanceKm: number;
  mileageKmPerLitre?: number;
  seatsOffered?: number;
  fuelPricePerLitre?: number;
}): FuelPointsCalculation {
  const distanceKm = Math.max(1, params.distanceKm || 15);
  // Default mileage based on typical Indian cars (15 km/L) if not configured
  const mileageKmPerLitre = Math.max(5, Math.min(60, params.mileageKmPerLitre || 15));
  const fuelPrice = params.fuelPricePerLitre || BANGALORE_FUEL_PRICE_PER_LITRE;
  const seats = Math.max(1, params.seatsOffered || 3);
  
  // Total vehicle occupants sharing the journey (Driver + Available Passenger seats)
  const totalOccupants = seats + 1;

  const totalFuelLitreUsed = Number((distanceKm / mileageKmPerLitre).toFixed(2));
  const totalTripFuelCostINR = Math.round(totalFuelLitreUsed * fuelPrice);
  
  // Fair per-passenger fuel points contribution
  const perPassengerPoints = Math.max(10, Math.round(totalTripFuelCostINR / totalOccupants));

  return {
    tripDistanceKm: distanceKm,
    vehicleMileageKmPerLitre: mileageKmPerLitre,
    fuelPricePerLitre: fuelPrice,
    totalFuelLitreUsed,
    totalTripFuelCostINR,
    occupantCount: totalOccupants,
    perPassengerPoints,
    settlementNote: 'Advisory fuel points only. Settle directly with co-resident in person (UPI / cash). Club House processes zero in-app payments.',
  };
}
