// lib/pricing.ts
import type { Material, OrderLocation, ProductType, GlassType, OkovType, ColorType, KomarnikType } from '@/types';

// ─── Profile bar model ────────────────────────────────────────────────────────
// Profiles sold in 6 m bars — waste is a real cost. Bars rounded UP to whole units.

const BAR_LENGTH_MM = 6000;

// Total profile length ≈ factor × (width + height) mm
const PROFILE_LENGTH_FACTOR: Record<Exclude<ProductType, 'plisirani_komarnik'>, number> = {
  window_single:    6,   // frame + sash + bead
  window_double:   10,   // + extra sash + central mullion
  trokrilni_prozor:13,   // 3 sashes + 2 mullions
  fiksni_prozor:    4,   // frame only, no sash
  door:             7,
  balkonska_vrata:  9,
  klizna_vrata:    12,   // frame + 2 sliding sashes + track
};

// Cost per 6 m bar — PVC: Schüco & Alphacan; ALU: Elvial & Profilco
const BAR_COST: Record<Material, number> = {
  PVC: 3_800,
  ALU: 9_500,
};

// ─── Glass ───────────────────────────────────────────────────────────────────
const GLASS_PER_MM2: Record<GlassType, number> = {
  dvoslojno:               0.0034,  // 4/16/4 Ar, U ≈ 1.1 W/m²K
  dvoslojno_niskoemisiono: 0.0046,  // Low-E double, U ≈ 0.9 W/m²K
  dvoslojno_peskirano:     0.0055,  // frosted double
  niskoemisiono:           0.0062,  // triple Low-E, U ≈ 0.6 W/m²K
  '4_godisnja_doba':       0.0088,  // double Low-E triple, U ≈ 0.5 W/m²K
  peskirano:               0.0075,  // frosted triple
};

const GLASS_AREA_RATIO: Record<Exclude<ProductType, 'plisirani_komarnik'>, number> = {
  window_single:    1.00,
  window_double:    1.00,
  trokrilni_prozor: 1.00,
  fiksni_prozor:    0.92,  // mostly glass, minimal frame
  door:             0.72,
  balkonska_vrata:  0.76,
  klizna_vrata:     0.82,
};

// ─── Hardware ────────────────────────────────────────────────────────────────
const OKOV_COST: Record<OkovType, number> = {
  agb:    5_200,  // AGB Italian, RC2
  schuco: 9_800,  // Schüco German, RC3
};

// ─── Color surcharge ─────────────────────────────────────────────────────────
const COLOR_MULTIPLIER: Record<ColorType, number> = {
  white:      1.00,
  anthracite: 1.50,
  wood:       1.50,
};

// ─── Labor ───────────────────────────────────────────────────────────────────
const LABOR_BASE: Record<Material, number> = {
  PVC: 4_200,
  ALU: 8_800,
};

const TYPE_COMPLEXITY: Record<Exclude<ProductType, 'plisirani_komarnik'>, number> = {
  window_single:    1.00,
  window_double:    1.65,
  trokrilni_prozor: 2.20,
  fiksni_prozor:    0.75,  // no moving parts
  door:             1.90,
  balkonska_vrata:  2.15,
  klizna_vrata:     2.60,
};

// ─── Add-ons ─────────────────────────────────────────────────────────────────
const KOMARNIK_BASE      = 3_200;   // plisirani
const KOMARNIK_PER_MM2   = 0.00090;
const ROLO_KOMARNIK_BASE    = 4_200;  // rolo (navijač)
const ROLO_KOMARNIK_PER_MM2 = 0.00110;
const FIKSNI_KOMARNIK_BASE    = 1_800;  // fiksni ram
const FIKSNI_KOMARNIK_PER_MM2 = 0.00060;
const ROLETNA_BASE       = 7_200;
const ROLETNA_PER_MM_W   = 3.8;
const OKAPNICA_FLAT      = 1_600;

// Internal windowsill (PVC klupica)
const SILL_INSIDE_BASE     = 1_200;
const SILL_INSIDE_PER_MM_W = 2.2;

// Sliding door mechanism (always included for klizna_vrata)
const KLIZNA_MECHANISM_BASE     = 14_000;
const KLIZNA_MECHANISM_PER_MM_W = 4.5;

// Installation per unit (montaža)
const INSTALLATION_COST: Record<ProductType, number> = {
  window_single:      3_500,
  window_double:      5_500,
  trokrilni_prozor:   7_000,
  fiksni_prozor:      2_500,
  door:               6_000,
  balkonska_vrata:    8_000,
  klizna_vrata:      12_000,
  plisirani_komarnik: 1_500,
};

// ─── Delivery ────────────────────────────────────────────────────────────────
export const DELIVERY_FEES: Record<OrderLocation, number> = {
  Srbija:       3_500,
  Inostranstvo: 25_000,
};

// ─── Dimensions ──────────────────────────────────────────────────────────────
export const DIMENSION_LIMITS: Record<ProductType, { minW: number; maxW: number; minH: number; maxH: number }> = {
  window_single:     { minW: 500,  maxW: 2500, minH: 500,  maxH: 2600 },
  window_double:     { minW: 900,  maxW: 3200, minH: 500,  maxH: 2600 },
  trokrilni_prozor:  { minW: 1400, maxW: 4000, minH: 500,  maxH: 2600 },
  fiksni_prozor:     { minW: 300,  maxW: 3000, minH: 300,  maxH: 3500 },
  door:              { minW: 700,  maxW: 1200, minH: 1900, maxH: 2400 },
  balkonska_vrata:   { minW: 700,  maxW: 3500, minH: 1900, maxH: 2800 },
  klizna_vrata:      { minW: 1200, maxW: 5000, minH: 1800, maxH: 2600 },
  plisirani_komarnik:{ minW: 400,  maxW: 2500, minH: 400,  maxH: 2600 },
};

export const DEFAULT_DIMENSIONS: Record<ProductType, { w: number; h: number }> = {
  window_single:     { w: 1000, h: 1200 },
  window_double:     { w: 1500, h: 1200 },
  trokrilni_prozor:  { w: 2100, h: 1200 },
  fiksni_prozor:     { w: 1000, h: 1200 },
  door:              { w: 900,  h: 2100 },
  balkonska_vrata:   { w: 1500, h: 2200 },
  klizna_vrata:      { w: 2400, h: 2100 },
  plisirani_komarnik:{ w: 1000, h: 1200 },
};

// ─── Public interfaces ───────────────────────────────────────────────────────

export interface ItemOptions {
  glassType?:       GlassType;
  okovType?:        OkovType;
  color?:           ColorType;
  komarnikType?:    KomarnikType;
  hasRoletna?:      boolean;
  hasOkapnica?:     boolean;
  hasInstallation?: boolean;
  hasSillInside?:   boolean;
}

export interface PriceBreakdown {
  profileCost: number;
  glassCost:   number;
  okovCost:    number;
  laborCost:   number;
  addonsCost:  number;
  perUnit:     number;
  basePrice:   number;
  deliveryFee: number;
  total:       number;
}

// ─── Core calculation ────────────────────────────────────────────────────────

export function calculatePrice(
  width: number,
  height: number,
  material: Material,
  type: ProductType,
  location: OrderLocation,
  quantity: number,
  options: ItemOptions = {}
): PriceBreakdown {
  const {
    glassType       = 'dvoslojno',
    okovType        = 'agb',
    color           = 'white',
    komarnikType    = 'none' as KomarnikType,
    hasRoletna      = false,
    hasOkapnica     = false,
    hasInstallation = false,
    hasSillInside   = false,
  } = options;

  const deliveryFee = DELIVERY_FEES[location];

  // ── Plisirani komarnik: flat area-based pricing ──────────────────────────
  if (type === 'plisirani_komarnik') {
    const colorExtra = color !== 'white' ? 0.15 : 0;
    const unitBase   = Math.round(5_500 + width * height * 0.013 * (1 + colorExtra));
    const addonsCost = hasInstallation ? INSTALLATION_COST.plisirani_komarnik : 0;
    const perUnit    = unitBase + addonsCost;
    const basePrice  = perUnit * quantity;
    return { profileCost: unitBase, glassCost: 0, okovCost: 0, laborCost: 0, addonsCost, perUnit, basePrice, deliveryFee, total: basePrice + deliveryFee };
  }

  const complexity = TYPE_COMPLEXITY[type];
  const colorMult  = COLOR_MULTIPLIER[color];
  const glassRatio = GLASS_AREA_RATIO[type];

  const totalProfileMM = PROFILE_LENGTH_FACTOR[type] * (width + height);
  const barsNeeded     = Math.ceil(totalProfileMM / BAR_LENGTH_MM);
  const profileCost    = Math.round(barsNeeded * BAR_COST[material] * colorMult);

  const glassCost = Math.round(width * height * glassRatio * GLASS_PER_MM2[glassType]);

  // Fixed windows have no sash hardware; sliding doors use a separate mechanism cost
  const okovCost = (type === 'fiksni_prozor' || type === 'klizna_vrata')
    ? 0
    : Math.round(OKOV_COST[okovType] * complexity);

  const laborCost = Math.round(LABOR_BASE[material] * complexity);

  let addonsCost = 0;
  if (type === 'klizna_vrata') addonsCost += Math.round(KLIZNA_MECHANISM_BASE + width * KLIZNA_MECHANISM_PER_MM_W);
  if (komarnikType === 'plisirani') addonsCost += Math.round(KOMARNIK_BASE       + width * height * KOMARNIK_PER_MM2);
  if (komarnikType === 'rolo')      addonsCost += Math.round(ROLO_KOMARNIK_BASE  + width * height * ROLO_KOMARNIK_PER_MM2);
  if (komarnikType === 'fiksni')    addonsCost += Math.round(FIKSNI_KOMARNIK_BASE + width * height * FIKSNI_KOMARNIK_PER_MM2);
  if (hasRoletna)      addonsCost += Math.round(ROLETNA_BASE + width * ROLETNA_PER_MM_W);
  if (hasOkapnica)     addonsCost += OKAPNICA_FLAT;
  if (hasSillInside)   addonsCost += Math.round(SILL_INSIDE_BASE + width * SILL_INSIDE_PER_MM_W);
  if (hasInstallation) addonsCost += INSTALLATION_COST[type];

  const perUnit   = profileCost + glassCost + okovCost + laborCost + addonsCost;
  const basePrice = perUnit * quantity;

  return { profileCost, glassCost, okovCost, laborCost, addonsCost, perUnit, basePrice, deliveryFee, total: basePrice + deliveryFee };
}

export function getDeliveryFee(location: OrderLocation): number {
  return DELIVERY_FEES[location];
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
    window_single:      'Jednokrilni prozor',
    window_double:      'Dvokrilni prozor',
    trokrilni_prozor:   'Trokrilni prozor',
    fiksni_prozor:      'Fiksni prozor',
    door:               'Vrata',
    balkonska_vrata:    'Balkonska vrata',
    klizna_vrata:       'Klizna vrata',
    plisirani_komarnik: 'Plisirani komarnik',
  };
  return labels[type];
}

// Raw material cost estimate — used by finance dashboard
const MATERIAL_COST_FACTORS: Record<Material, number> = {
  PVC: 0.0015,
  ALU: 0.0028,
};

const LEGACY_TYPE_MULTIPLIERS: Record<ProductType, number> = {
  window_single:      1.0,
  window_double:      1.6,
  trokrilni_prozor:   2.1,
  fiksni_prozor:      0.7,
  door:               1.8,
  balkonska_vrata:    2.0,
  klizna_vrata:       2.4,
  plisirani_komarnik: 0.6,
};

export function calculateMaterialCost(
  width: number,
  height: number,
  material: Material,
  type: ProductType,
  quantity: number
): number {
  const area = width * height;
  return Math.round(area * MATERIAL_COST_FACTORS[material] * LEGACY_TYPE_MULTIPLIERS[type] * quantity);
}
