export const dynamic = 'force-dynamic';

import db from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || 'daily'; // 'daily' or 'monthly'
        const startDateStr = searchParams.get('startDate');
        const endDateStr = searchParams.get('endDate');

        if (!startDateStr || !endDateStr) {
            return NextResponse.json({ error: 'Start and End dates are required' }, { status: 400 });
        }

        // Parse dates as WIB (UTC+7)
        // Start: 00:00:00 WIB -> -7 hours from UTC date
        const start = new Date(startDateStr);
        start.setUTCHours(-7, 0, 0, 0);

        // End: 23:59:59.999 WIB -> +16 hours 59 min 59 sec from start (or just set time relative to UTC)
        const end = new Date(endDateStr);
        end.setUTCHours(16, 59, 59, 999);

        // Fetch completed orders
        const [ordersRaw] = await db.execute(
            'SELECT * FROM \`Order\` WHERE createdAt >= ? AND createdAt <= ? AND status = "completed" ORDER BY createdAt ASC',
            [start, end]
        );

        let orders = ordersRaw;
        if (orders.length > 0) {
            const orderIds = orders.map(o => o.id);
            const [fetchedItems] = await db.query(
                `SELECT oi.*, p.name as productName, p.hpp as productHpp 
                FROM OrderItem oi 
                LEFT JOIN Product p ON oi.productId = p.id 
                WHERE oi.orderId IN (?)`,
                [orderIds]
            );

            // map items to orders
            orders = ordersRaw.map(order => {
                order.items = fetchedItems
                    .filter(i => i.orderId === order.id)
                    .map(i => ({
                        ...i,
                        product: { name: i.productName, hpp: i.productHpp }
                    }));
                return order;
            });
        }

        const [cancelledCountResult] = await db.execute(
            'SELECT COUNT(*) as count FROM \`Order\` WHERE createdAt >= ? AND createdAt <= ? AND status = "cancelled"',
            [start, end]
        );
        const cancelledCount = cancelledCountResult[0].count;

        // Initialize Metrics
        let totalGrossSales = 0; // Total Payment (Final Amount)
        let totalNetSales = 0; // Gross - Tax - Discount
        let totalTax = 0;
        let totalServiceCharge = 0;
        let totalTransactions = orders.length;
        let totalDiscount = 0;
        let totalHpp = 0;
        let paymentMethods = {
            'cash': 0,
            'qris': 0,
            'edc': 0
        };

        // Product Aggregation
        const productMap = new Map(); // name -> qty

        // For Chart
        const chartMap = new Map();

        const formatDateKey = (date) => {
            if (type === 'monthly') {
                return date.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
            } else {
                return date.toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: '2-digit',
                    year: '2-digit',
                    timeZone: 'Asia/Jakarta'
                });
            }
        };

        if (type === 'daily') {
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                chartMap.set(formatDateKey(d), 0);
            }
        } else if (type === 'monthly') {
            let currentStr = startDateStr.substring(0, 7); // YYYY-MM
            let endStr = endDateStr.substring(0, 7);

            let d = new Date(currentStr + '-01');
            let endD = new Date(endStr + '-01');

            while (d <= endD) {
                chartMap.set(formatDateKey(d), 0);
                d.setMonth(d.getMonth() + 1);
            }
        }

        orders.forEach(order => {
            const final = order.finalAmount || 0;
            const tax = order.taxAmount || 0;
            const disc = order.discountAmount || 0;
            const sc = order.serviceCharge || 0;

            totalGrossSales += final;
            totalDiscount += disc;
            totalTax += tax;
            totalServiceCharge += sc;

            // Payment method
            const pm = (order.paymentMethod || 'cash').toLowerCase();
            if (paymentMethods[pm] !== undefined) {
                paymentMethods[pm] += final;
            } else {
                if (pm.includes('debit') || pm.includes('card')) paymentMethods['edc'] += final;
                else paymentMethods['cash'] += final;
            }

            // Aggregate Products
            if (order.items) {
                order.items.forEach(item => {
                    const name = item.product ? item.product.name : 'Unknown';
                    const qty = item.qty || 0;
                    const currentQty = productMap.get(name) || 0;
                    productMap.set(name, currentQty + qty);

                    // Calculate HPP
                    const hpp = item.product ? (item.product.hpp || 0) : 0;
                    totalHpp += (hpp * qty);
                });
            }

            // Chart Data
            const key = formatDateKey(new Date(order.createdAt));
            const current = chartMap.get(key) || 0;
            chartMap.set(key, current + final);
        });

        // Calculate Net Sales
        // Net Sales = Gross Sales - HPP - PB1(Tax) - Service Charge
        totalNetSales = totalGrossSales - totalHpp - totalTax - totalServiceCharge;

        const chartLabels = Array.from(chartMap.keys());
        const chartValues = Array.from(chartMap.values());

        // Process Best Sellers (Top 5)
        const bestSellers = Array.from(productMap.entries())
            .map(([name, qty]) => ({ name, qty }))
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        return NextResponse.json({
            summary: {
                grossSales: totalGrossSales,
                netSales: totalNetSales,
                transactions: totalTransactions,
                discount: totalDiscount,
                serviceCharge: totalServiceCharge,
                cash: paymentMethods['cash'],
                qris: paymentMethods['qris'],
                debit: paymentMethods['edc'],
                cancelled: cancelledCount
            },
            bestSellers, // Return Top 5
            chart: {
                labels: chartLabels,
                datasets: [
                    {
                        label: 'Gross Sales',
                        data: chartValues,
                        backgroundColor: 'rgba(212, 175, 55, 0.8)', // Gold theme
                    }
                ]
            }
        });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
    }
}
