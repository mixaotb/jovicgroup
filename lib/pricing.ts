// lib/pricing.ts
import { Material, OrderLocation, ProductType } from '@/types';

// Base price per mm² in RSD
const MATERIAL_FACTORS: Record<Material, number> = {
  PVC: 0.0028,
  ALU: 0.0045,
};

// Product type multipliers
const TYPE_MULTIPLIERS: Record<ProductType, number> = {
  window_single: 1.0,
  window_double: 1.6,
  door: 1.8,
};

// Delivery fees in RSD
const DELIVERY_FEES: Record<OrderLocation, number> = {
  Srbija: 2500,
  Inostranstvo: 18000,
};

export interface PriceBreakdown {
  basePrice: number;
  deliveryFee: number;
  total: number;
  perUnit: number;
}

export function calculatePrice(
  width: number,
  height: number,
  material: Material,
  type: ProductType,
  location: OrderLocation,
  quantity: number
): PriceBreakdown {
  const area = width * height; // mm²
  const materialFactor = MATERIAL_FACTORS[material];
  const typeMultiplier = TYPE_MULTIPLIERS[type];
  const deliveryFee = DELIVERY_FEES[location];

  const perUnit = Math.round(area * materialFactor * typeMultiplier);
  const basePrice = perUnit * quantity;
  const total = basePrice + deliveryFee;

  return {
    basePrice,
    deliveryFee,
    total,
    perUnit,
  };
}

export function formatRSD(amount: number): string {
  return new Intl.NumberFormat('sr-RS', {
    style: 'currency',
    currency: 'RSD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getProductTypeLabel(type: ProductType): string {
  const labels: Record<ProductType, string> = {
    window_single: 'Jednokrilni prozor',
    window_double: 'Dvokrilni prozor',
    door: 'Vrata',
  };
  return labels[type];
}

// Raw material cost per mm² (approx. 43% of selling price)
const MATERIAL_COST_FACTORS: Record<Material, number> = {
  PVC: 0.0012,
  ALU: 0.0020,
};

export function calculateMaterialCost(
  width: number,
  height: number,
  material: Material,
  type: ProductType,
  quantity: number
): number {
  const area = width * height;
  return Math.round(area * MATERIAL_COST_FACTORS[material] * TYPE_MULTIPLIERS[type] * quantity);
}
