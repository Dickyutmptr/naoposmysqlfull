'use client';

import { useState, useEffect } from 'react';

const mockOrders = [
    { id: 'NB100226-004', table: 'Meja 5', type: 'dine-in', items: [{ name: 'Nasi Goreng', qty: 2, note: 'Pedas' }, { name: 'Ice Tea', qty: 2 }], status: 'pending' },
    { id: 'NB100226-005', table: 'Take Away', type: 'take-away', items: [{ name: 'Kopi Susu', qty: 1 }, { name: 'Roti Bakar', qty: 1 }], status: 'pending' }
];

export default function KitchenBar({ onHome, user = {} }) {
    const role = user?.role || 'admin';
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [printedOrders, setPrintedOrders] = useState(new Set());

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    const fetchOrders = async () => {
        try {
            // Fetch with high limit to see all active orders
            const res = await fetch('/api/orders?limit=100');
            const result = await res.json();

            // Handle pagination structure { data: [...], meta: ... }
            if (result.data && Array.isArray(result.data)) {
                setOrders(result.data);
            } else if (Array.isArray(result)) {
                setOrders(result); // Fallback for safety
            } else {
                setOrders([]);
            }
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch orders', err);
        }
    };

    const handleUpdateStatus = async (orderId, type) => {
        try {
            const res = await fetch('/api/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ orderId, type })
            });
            if (res.ok) {
                fetchOrders(); // Refresh immediately
            } else {
                alert('Gagal update status');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Helper to filter items for specific station
    const getStationItems = (orderItems, station) => {
        return orderItems.filter(item => {
            // Safety check for product/category existence
            const cat = item.product?.category?.name?.toLowerCase() || item.product?.kategori?.toLowerCase() || '';
            const catName = cat.trim();

            if (station === 'kitchen') {
                // Makanan, Snack, Cemilan
                return ['makanan', 'snack', 'cemilan'].includes(catName);
            } else if (station === 'bar') {
                // Coffee Series, Coconut Series, Matcha Series, Chocolate Series, Non-Coffee, Minuman
                return catName.includes('coffee') || catName.includes('matcha') || catName.includes('chocolate') || catName.includes('choco') || catName.includes('coconut') || ['non-coffee', 'minuman'].includes(catName);
            }
            return false;
        });
    };

    const handlePrintSticker = (order, relevantItems) => {
        // Build the HTML for printing
        let printHtml = `
            <html>
                <head>
                    <title>Print Stiker Bar</title>
                    <style>
                        @page {
                            size: 105mm 148mm; /* A6 size */
                            margin: 0;
                        }
                        body {
                            margin: 0;
                            padding: 0;
                            font-family: monospace; /* Monospace fits receipt style best */
                            font-weight: bold;
                            color: #000000;
                        }
                        .sticker-page {
                            width: 105mm;
                            height: 148mm;
                            box-sizing: border-box;
                            padding: 5mm;
                            page-break-after: always;
                            display: flex;
                            flex-direction: column;
                            line-height: 1.4;
                            /* border: 1px dashed #ccc; Optional debug boundary */
                        }
                        .header-row {
                            display: flex;
                            justify-content: space-between;
                            font-size: 18px;
                            margin-bottom: 5px;
                        }
                        .header-row .left { text-align: left; }
                        .header-row .right { text-align: right; }
                        
                        .item-name {
                            font-size: 24px;
                            margin-top: 10px;
                            /* Allows wrapping for long names */
                            word-wrap: break-word;
                        }
                        .item-note {
                            font-size: 16px;
                            margin-top: 5px;
                        }
                    </style>
                </head>
                <body>
        `;

        const printDate = new Date();
        const formattedDate = printDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + '. ' + printDate.getFullYear();

        const totalItems = relevantItems.reduce((acc, item) => acc + item.qty, 0);
        let currentItemIndex = 1;

        relevantItems.forEach(item => {
            for (let i = 0; i < item.qty; i++) {
                // Ensure customer name is uppercase and truncated if needed
                const custName = (order.customerName || 'GUEST').toUpperCase();
                // Extract just the numerical queue, removing the order prefix
                let queueNo = "-";
                if (order.queueNumber) {
                    queueNo = order.queueNumber;
                } else if (order.orderId) {
                    const parts = order.orderId.split('-');
                    if (parts.length > 1) {
                        const parsed = parseInt(parts[1], 10);
                        queueNo = isNaN(parsed) ? parts[1] : parsed;
                    }
                } else if (order.id) {
                    const parts = order.id.split('-');
                    if (parts.length > 1) {
                        const parsed = parseInt(parts[1], 10);
                        queueNo = isNaN(parsed) ? parts[1] : parsed;
                    }
                }

                printHtml += `
                    <div class="sticker-page">
                        <div class="header-row">
                            <div class="left">No: ${queueNo}</div>
                            <div class="right">${currentItemIndex}/${totalItems}</div>
                        </div>
                        <div class="header-row">
                            <div class="left">${formattedDate}</div>
                            <div class="right">${custName}</div>
                        </div>
                        <div class="item-name">${item.product?.name || item.name}</div>
                        ${item.note ? `<div class="item-note">${item.note}</div>` : ''}
                    </div>
                `;
                currentItemIndex++;
            }
        });

        printHtml += `
                </body>
                <script>
                    window.onload = function() {
                        window.print();
                        setTimeout(function() { window.close(); }, 500);
                    };
                </script>
            </html>
        `;

        const printWindow = window.open('', '_blank', 'width=400,height=600');
        printWindow.document.write(printHtml);
        printWindow.document.close();

        // Mark as printed
        setPrintedOrders(prev => {
            const next = new Set(prev);
            next.add(order.orderId || order.id);
            return next;
        });
    };

    const renderOrderCard = (order, station) => {
        const relevantItems = getStationItems(order.items || [], station);
        if (relevantItems.length === 0) return null;

        const isDone = station === 'kitchen' ? order.kitchenStatus === 'done' : order.barStatus === 'done';

        return (
            <div key={order.orderId || order.id} className="kb-card" style={{ background: 'white', border: '1px solid #ccc', borderRadius: '10px', padding: '15px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', opacity: isDone ? 0.6 : 1, order: isDone ? 1 : 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="kb-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #007bff', paddingBottom: '10px', marginBottom: '5px' }}>
                    <span className="kb-ord-id" style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>{order.orderId || order.id}</span>
                    <span className="kb-table" style={{ fontSize: '14px', background: '#0f3460', color: 'white', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>{order.tableNumber || 'No Table'}</span>
                </div>
                <div className="kb-sub" style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: '13px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                    <span>{order.customerName}</span>
                    <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <ul className="kb-items" style={{ listStyle: 'none', padding: 0, margin: '10px 0', border: '1px solid #e5e7eb', borderRadius: '6px', overflow: 'hidden' }}>
                    {relevantItems.map((item, idx) => (
                        <li key={idx} className="kb-item" style={{ padding: '12px 15px', borderBottom: idx < relevantItems.length - 1 ? '1px solid #e5e7eb' : 'none', display: 'flex', gap: '15px', alignItems: 'center', background: idx % 2 === 0 ? 'white' : '#f8fafc' }}>
                            <span className="kb-item-qty" style={{ background: '#007bff', color: 'white', minWidth: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', fontWeight: 'bold', fontSize: '16px' }}>{item.qty}</span>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <span style={{ color: 'black', fontWeight: 'bold', fontSize: '15px' }}>{item.product?.name || item.name}</span>
                                {item.note && <span className="kb-item-note" style={{ color: '#ef4444', fontStyle: 'italic', fontSize: '13px', marginTop: '4px', fontWeight: '500' }}>* Note: {item.note}</span>}
                            </div>
                        </li>
                    ))}
                </ul>
                <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                    {station === 'bar' && !isDone && (
                        <button
                            onClick={() => handlePrintSticker(order, relevantItems)}
                            style={{
                                flex: 1,
                                background: '#f59e0b',
                                color: 'white',
                                padding: '12px',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontSize: '14px'
                            }}
                        >
                            PRINT STIKER
                        </button>
                    )}
                    <button
                        className="kb-btn-done"
                        onClick={() => handleUpdateStatus(order.orderId || order.id, station)}
                        disabled={isDone || (station === 'bar' && !printedOrders.has(order.orderId || order.id))}
                        style={{
                            flex: station === 'bar' && !isDone ? 2 : 1,
                            background: isDone ? '#e5e7eb' : (station === 'bar' && !printedOrders.has(order.orderId || order.id) ? '#9ca3af' : '#22c55e'),
                            cursor: isDone || (station === 'bar' && !printedOrders.has(order.orderId || order.id)) ? 'not-allowed' : 'pointer',
                            color: isDone ? '#9ca3af' : 'white',
                            padding: '12px',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: 'bold',
                            fontSize: '15px',
                            textTransform: 'uppercase'
                        }}
                    >
                        {isDone ? 'SELESAI ✅' : 'SELESAI'}
                    </button>
                </div>
            </div>
        );
    };

    const isBarRole = role === 'bar' || role === 'Head Bar' || role === 'Assisten Head';
    const isKitchenRole = role === 'kitchen';

    return (
        <div className="app">
            <div className="header">
                <h1>Kitchen & Bar Monitor</h1>
                <button className="secondary" style={{ width: 'auto' }} onClick={onHome}>Home</button>
            </div>

            <div className="kb-layout" style={{ display: 'grid', gridTemplateColumns: (isKitchenRole || isBarRole) ? '1fr' : '1fr 1fr', gap: '30px', minHeight: 'calc(100vh - 120px)', padding: '0 20px', paddingBottom: '30px' }}>
                {/* KITCHEN */}
                {!isBarRole && (
                    <div className="kb-col kb-kitchen" style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <div className="kb-header" style={{ background: '#0f3460', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>👨‍🍳 Kitchen (Makanan)</div>
                        <div className="kb-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                            {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.kitchenStatus !== 'done').map(order => renderOrderCard(order, 'kitchen'))}
                        </div>
                    </div>
                )}

                {/* BAR */}
                {!isKitchenRole && (
                    <div className="kb-col kb-bar" style={{ background: '#f8fafc', borderRadius: '12px', padding: '20px', border: '1px solid var(--border-color)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <div className="kb-header" style={{ background: '#0f3460', color: 'white', padding: '15px', borderRadius: '8px', marginBottom: '20px', fontSize: '18px', fontWeight: 'bold', textAlign: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>🍷 Bar (Minuman)</div>
                        <div className="kb-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px', overflowY: 'auto' }}>
                            {orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled' && o.barStatus !== 'done').map(order => renderOrderCard(order, 'bar'))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
