// app/api/finance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { calculateMaterialCost, calculatePrice } from '@/lib/pricing';
import type { Material, ProductType, FinanceData } from '@/types';

type RawItem = { type: string; material: string; width: number; height: number; quantity: number };
type RawOrder = {
  id: string;
  status: string;
  total_price: number;
  payment_method: string;
  location: string;
  created_at: string;
  items: RawItem[] | null;
};

function itemCost(item: RawItem): number {
  try {
    return calculateMaterialCost(
      item.width, item.height,
      item.material as Material, item.type as ProductType,
      item.quantity
    );
  } catch { return 0; }
}

function itemBaseRevenue(item: RawItem): number {
  try {
    const { basePrice } = calculatePrice(
      item.width, item.height,
      item.material as Material, item.type as ProductType,
      'Srbija',
      item.quantity
    );
    return basePrice;
  } catch { return 0; }
}

const MONTHS_SR = ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Avg', 'Sep', 'Okt', 'Nov', 'Dec'];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Neautorizovan pristup' }, { status: 401 });

    const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Pristup odbijen' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    const { data: raw, error } = await supabase
      .from('orders')
      .select('id, status, total_price, payment_method, location, created_at, items:order_items(type, material, width, height, quantity)')
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const all = (raw || []) as RawOrder[];

    // Period filter
    const now = new Date();
    let periodOrders = all;
    if (period === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      periodOrders = all.filter(o => new Date(o.created_at) >= start);
    } else if (period === 'year') {
      const start = new Date(now.getFullYear(), 0, 1);
      periodOrders = all.filter(o => new Date(o.created_at) >= start);
    }

    // ── Summary ──────────────────────────────────────────────────────────────
    const delivered = periodOrders.filter(o => o.status === 'isporuceno');
    const totalRevenue = delivered.reduce((s, o) => s + (o.total_price || 0), 0);
    const materialCost = delivered.reduce((s, o) => s + (o.items || []).reduce((ss, i) => ss + itemCost(i), 0), 0);
    const grossProfit = totalRevenue - materialCost;
    const marginPercent = totalRevenue > 0 ? Math.round((grossProfit / totalRevenue) * 1000) / 10 : 0;
    const pendingRevenue = periodOrders
      .filter(o => o.status === 'na_cekanju' || o.status === 'u_proizvodnji')
      .reduce((s, o) => s + (o.total_price || 0), 0);
    const cancelledValue = periodOrders
      .filter(o => o.status === 'otkazano')
      .reduce((s, o) => s + (o.total_price || 0), 0);

    // ── By Status ─────────────────────────────────────────────────────────────
    const byStatus: Record<string, { count: number; revenue: number }> = {};
    for (const o of periodOrders) {
      if (!byStatus[o.status]) byStatus[o.status] = { count: 0, revenue: 0 };
      byStatus[o.status].count++;
      byStatus[o.status].revenue += o.total_price || 0;
    }

    // ── By Product Type & Material (delivered orders, item-level) ─────────────
    const byProductType: Record<string, { units: number; calcRevenue: number; cost: number }> = {};
    const byMaterial: Record<string, { units: number; calcRevenue: number; cost: number }> = {};

    for (const o of delivered) {
      for (const item of (o.items || [])) {
        const type = item.type;
        const mat = item.material;
        const cost = itemCost(item);
        const revenue = itemBaseRevenue(item);
        const qty = item.quantity;

        if (!byProductType[type]) byProductType[type] = { units: 0, calcRevenue: 0, cost: 0 };
        byProductType[type].units += qty;
        byProductType[type].calcRevenue += revenue;
        byProductType[type].cost += cost;

        if (!byMaterial[mat]) byMaterial[mat] = { units: 0, calcRevenue: 0, cost: 0 };
        byMaterial[mat].units += qty;
        byMaterial[mat].calcRevenue += revenue;
        byMaterial[mat].cost += cost;
      }
    }

    // ── By Payment Method (delivered) ─────────────────────────────────────────
    const byPaymentMethod: Record<string, { count: number; revenue: number }> = {};
    for (const o of delivered) {
      const pm = o.payment_method;
      if (!byPaymentMethod[pm]) byPaymentMethod[pm] = { count: 0, revenue: 0 };
      byPaymentMethod[pm].count++;
      byPaymentMethod[pm].revenue += o.total_price || 0;
    }

    // ── By Location (all period orders) ──────────────────────────────────────
    const byLocation: Record<string, { count: number; revenue: number }> = {};
    for (const o of periodOrders) {
      if (!byLocation[o.location]) byLocation[o.location] = { count: 0, revenue: 0 };
      byLocation[o.location].count++;
      byLocation[o.location].revenue += o.total_price || 0;
    }

    // ── Monthly Trend (last 12 months, always full year regardless of period) ─
    const monthlyMap: Record<string, { revenue: number; cost: number; orders: number }> = {};
    const trendStart = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    for (const o of all) {
      const d = new Date(o.created_at);
      if (d < trendStart) continue;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!monthlyMap[key]) monthlyMap[key] = { revenue: 0, cost: 0, orders: 0 };
      monthlyMap[key].orders++;
      if (o.status === 'isporuceno') {
        monthlyMap[key].revenue += o.total_price || 0;
        monthlyMap[key].cost += (o.items || []).reduce((s, i) => s + itemCost(i), 0);
      }
    }

    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthlyTrend.push({
        month: MONTHS_SR[d.getMonth()],
        yearMonth: key,
        ...(monthlyMap[key] || { revenue: 0, cost: 0, orders: 0 }),
      });
    }

    const financeData: FinanceData = {
      summary: {
        totalRevenue,
        pendingRevenue,
        materialCost,
        grossProfit,
        marginPercent,
        deliveredCount: delivered.length,
        cancelledValue,
        totalOrdersCount: periodOrders.length,
      },
      byStatus,
      byProductType,
      byMaterial,
      byPaymentMethod,
      byLocation,
      monthlyTrend,
    };

    return NextResponse.json(financeData);
  } catch (err) {
    console.error('[Finance GET] Error:', err);
    return NextResponse.json({ error: 'Interna greška servera' }, { status: 500 });
  }
}
