// lib/orderItems.ts — validation + row building for CRM-entered order items (create and edit)
import { DIMENSION_LIMITS } from '@/lib/pricing';
import type { ProductType } from '@/types';

export const VALID_PRODUCT_TYPES: ProductType[] = [
  'window_single', 'window_double', 'trokrilni_prozor', 'fiksni_prozor',
  'door', 'balkonska_vrata', 'klizna_vrata', 'plisirani_komarnik',
];

// Manual CRM entries are looser than the public calculator, but never tighter
const MIN_DIMENSION = 100;
const MAX_DIMENSION = 4000;
const MAX_QUANTITY = 100;

// Spec fields carried over when an existing order is duplicated or edited
const EXTRA_DIMENSION_KEYS = [
  'glassType', 'okovType', 'color', 'komarnikType',
  'hasRoletna', 'hasOkapnica', 'hasInstallation', 'hasSillInside',
  'notes', 'image_url',
] as const;

export type OrderItemInput = {
  type: string; material: string; width: number; height: number; quantity: number;
  dimensions_data?: Record<string, unknown>;
};

function pickExtras(data: unknown): Record<string, unknown> {
  if (!data || typeof data !== 'object') return {};
  const src = data as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of EXTRA_DIMENSION_KEYS) if (src[key] !== undefined) out[key] = src[key];
  return out;
}

/** Returns an error message (prefixed with the item number) or null when every item is valid. */
export function validateOrderItems(items: unknown): string | null {
  if (!Array.isArray(items) || items.length === 0) return 'Narudžbina mora imati barem jednu stavku';
  for (const [idx, item] of (items as OrderItemInput[]).entries()) {
    const fail = (msg: string) => `Stavka ${idx + 1}: ${msg}`;
    if (!item || typeof item !== 'object') return fail('neispravna stavka');
    if (!VALID_PRODUCT_TYPES.includes(item.type as ProductType)) return fail('neispravan tip proizvoda');
    if (item.material !== 'PVC' && item.material !== 'ALU') return fail('neispravan materijal');
    const maxW = Math.max(MAX_DIMENSION, DIMENSION_LIMITS[item.type as ProductType].maxW);
    const maxH = Math.max(MAX_DIMENSION, DIMENSION_LIMITS[item.type as ProductType].maxH);
    if (!Number.isFinite(item.width) || item.width < MIN_DIMENSION || item.width > maxW)
      return fail(`neispravna širina (${MIN_DIMENSION}–${maxW} mm)`);
    if (!Number.isFinite(item.height) || item.height < MIN_DIMENSION || item.height > maxH)
      return fail(`neispravna visina (${MIN_DIMENSION}–${maxH} mm)`);
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > MAX_QUANTITY)
      return fail(`neispravna količina (1–${MAX_QUANTITY})`);
  }
  return null;
}

/** Maps validated input to order_items rows, keeping only whitelisted spec fields. */
export function toOrderItemRows(orderId: string, items: OrderItemInput[]) {
  return items.map(item => ({
    order_id:        orderId,
    type:            item.type,
    material:        item.material,
    width:           item.width,
    height:          item.height,
    quantity:        item.quantity,
    dimensions_data: {
      ...pickExtras(item.dimensions_data),
      type: item.type, material: item.material, width: item.width, height: item.height, quantity: item.quantity,
    },
  }));
}
