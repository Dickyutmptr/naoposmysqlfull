'use client';

import { useState, useEffect } from 'react';

import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import * as ExcelJS from 'exceljs';
import { useRef } from 'react';
import { rupiah } from '../lib/utils'; // Assuming this utility exists

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

export const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: { color: '#1e293b', font: { family: 'Inter', size: 12 } }
        },
        title: {
            display: false
        },
    },
    scales: {
        y: { ticks: { color: '#64748b' }, grid: { color: '#f1f5f9' }, border: { display: false } },
        x: { ticks: { color: '#64748b' }, grid: { display: false }, border: { display: false } }
    }
};

const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const data = {
    labels,
    datasets: [
        {
            label: 'Omset',
            data: [1500000, 2300000, 1800000, 2500000, 3200000, 4500000, 3800000],
            backgroundColor: '#007bff',
            borderRadius: 6,
        },
    ],
};

export default function Dashboard({ onHome, onHistory, onPOS }) {
    const [reportType, setReportType] = useState('daily'); // 'daily' or 'monthly'
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [initialLoad, setInitialLoad] = useState(false);
    const [loading, setLoading] = useState(false);
    const [summary, setSummary] = useState({
        grossSales: 0,
        netSales: 0,
        transactions: 0,
        discount: 0,
        serviceCharge: 0,
        cash: 0,
        qris: 0,
        debit: 0,
        cancelled: 0
    });
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: []
    });
    const [bestSellers, setBestSellers] = useState([]);
    const chartRef = useRef(null);

    useEffect(() => {
        // Set default range: Today only (realtime)
        const today = new Date();

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        const todayStr = formatDate(today);
        setStartDate(todayStr);
        setEndDate(todayStr);
    }, []);

    useEffect(() => {
        if (startDate && endDate && !initialLoad) {
            fetchReport();
            setInitialLoad(true);
        }
    }, [startDate, endDate, initialLoad]);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/reports/sales?startDate=${startDate}&endDate=${endDate}&type=${reportType}`);
            const data = await res.json();

            if (data.summary) setSummary(data.summary);
            if (data.chart) setChartData(data.chart);
            if (data.bestSellers) setBestSellers(data.bestSellers);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        if (!summary || !chartData.datasets[0]) return;

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'Nao POS';
        workbook.created = new Date();

        // 1. SUMMARY SHEET
        const sheetSummary = workbook.addWorksheet('Summary');
        sheetSummary.columns = [
            { header: 'METRICS', key: 'metric', width: 20 },
            { header: 'VALUE', key: 'value', width: 20 }
        ];

        sheetSummary.addRows([
            ['LAPORAN PENJUALAN DASHBOARD'],
            ['Periode:', `${startDate} s/d ${endDate}`],
            ['Tipe:', reportType === 'daily' ? 'Harian' : 'Bulanan'],
            [], // Empty row
            ['Gross Sales', summary.grossSales],
            ['Service Charge', summary.serviceCharge],
            ['Net Sales', summary.netSales],
            ['Total Transaksi', summary.transactions],
            ['Total Diskon', summary.discount],
            ['Total Cancelled', summary.cancelled],
            [],
            ['QRIS', summary.qris],
            ['Debit', summary.debit]
        ]);

        // Style header
        sheetSummary.getRow(1).font = { bold: true, size: 14 };

        // 2. CHART DATA SHEET (Sales Trend) + IMAGE
        const sheetChart = workbook.addWorksheet('Grafik (Data)');
        sheetChart.columns = [
            { header: 'TANGGAL', key: 'date', width: 15 },
            { header: 'OMSET', key: 'value', width: 15 }
        ];

        chartData.labels.forEach((label, index) => {
            const val = chartData.datasets[0].data[index] || 0;
            sheetChart.addRow([label, val]);
        });

        // Add Chart Image if ref exists
        if (chartRef.current) {
            const base64Image = chartRef.current.toBase64Image();
            const imageId = workbook.addImage({
                base64: base64Image,
                extension: 'png',
            });

            // Add image to sheet (position: C2:H20)
            sheetChart.addImage(imageId, {
                tl: { col: 3, row: 1 },
                ext: { width: 600, height: 350 }
            });
        }

        // 3. BEST SELLERS SHEET
        const sheetProducts = workbook.addWorksheet('Produk Terlaris');
        sheetProducts.columns = [
            { header: 'RANK', key: 'rank', width: 10 },
            { header: 'NAMA PRODUK', key: 'name', width: 30 },
            { header: 'TERJUAL (QTY)', key: 'qty', width: 15 }
        ];

        bestSellers.forEach((item, index) => {
            sheetProducts.addRow([index + 1, item.name, item.qty]);
        });

        // Generate File (Buffer -> Blob)
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `Laporan_Dashboard_${startDate}_${endDate}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
    };

    return (
        <div className="app">
            <div className="header" style={{ marginBottom: 30 }}>
                <h1 className="dashboard-title">Sales Summary</h1>
                <button className="secondary" style={{ width: 'auto' }} onClick={onHome}>Home</button>
            </div>

            <div className="dashboard-controls">
                <div className="filter-item">
                    <select
                        className="filter-control"
                        value={reportType}
                        onChange={e => setReportType(e.target.value)}
                    >
                        <option value="daily">Harian / Custom</option>
                        <option value="monthly">Bulanan</option>
                    </select>
                </div>

                {reportType === 'daily' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="filter-item">
                            <input
                                type="date"
                                className="filter-control"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                            />
                        </div>
                        <span style={{ color: '#ffffff', fontSize: 24, padding: '0 8px' }}>-</span>
                        <div className="filter-item">
                            <input
                                type="date"
                                className="filter-control"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="filter-item">
                            <input
                                title="Bulan Mulai"
                                type="month"
                                className="filter-control"
                                value={startDate.substring(0, 7)}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val) {
                                        const [y, m] = val.split('-');
                                        setStartDate(`${y}-${m}-01`);
                                        // Auto-adjust end date if it's earlier than new start date
                                        if (endDate && new Date(val + '-01') > new Date(endDate)) {
                                            const end = new Date(y, m, 0);
                                            setEndDate(`${y}-${m}-${String(end.getDate()).padStart(2, '0')}`);
                                        }
                                    }
                                }}
                            />
                        </div>
                        <span style={{ color: '#ffffff', fontSize: 24, padding: '0 8px' }}>-</span>
                        <div className="filter-item">
                            <input
                                title="Bulan Akhir"
                                type="month"
                                className="filter-control"
                                value={endDate.substring(0, 7)}
                                onChange={e => {
                                    const val = e.target.value;
                                    if (val) {
                                        const [y, m] = val.split('-');
                                        const end = new Date(y, m, 0);
                                        setEndDate(`${y}-${m}-${String(end.getDate()).padStart(2, '0')}`);
                                    }
                                }}
                            />
                        </div>
                    </div>
                )}

                <button className="gold-btn" onClick={fetchReport}>
                    {loading ? 'LOADING...' : 'TAMPILKAN DATA'}
                </button>
                <button className="gold-btn" onClick={handleExport} style={{ background: '#22c55e', color: '#fff', marginLeft: 'auto' }}>
                    EXPORT EXCEL
                </button>

            </div>

            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Gross Sales</h4>
                    <div className="value" style={{ color: '#0f3460', fontSize: '28px', fontWeight: 'bold' }}>{rupiah(summary.grossSales)}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Net Sales</h4>
                    <div className="value" style={{ color: '#166534', fontSize: '28px', fontWeight: 'bold' }}>{rupiah(summary.netSales)}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Transaksi</h4>
                    <div className="value" style={{ color: '#007bff', fontSize: '28px', fontWeight: 'bold' }}>{summary.transactions}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Service Charge</h4>
                    <div className="value" style={{ color: '#f59e0b', fontSize: '28px', fontWeight: 'bold' }}>{rupiah(summary.serviceCharge)}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Diskon</h4>
                    <div className="value" style={{ color: '#ef4444', fontSize: '28px', fontWeight: 'bold' }}>{rupiah(summary.discount)}</div>
                </div>

                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>QRIS</h4>
                    <div className="value" style={{ color: '#007bff', fontSize: '28px', fontWeight: 'bold' }}>{rupiah(summary.qris)}</div>
                </div>
                <div className="stat-card" style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h4 style={{ color: '#64748b', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Debit (EDC)</h4>
                    <div className="value" style={{ color: '#007bff', fontSize: '28px', fontWeight: 'bold' }}>{rupiah(summary.debit)}</div>
                </div>
                <div className="stat-card" onClick={onHistory} style={{ background: '#fef2f2', cursor: 'pointer', borderRadius: '12px', padding: '20px', alignSelf: 'stretch', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #fca5a5', display: 'flex', flexDirection: 'column', justifyContent: 'center', transition: '0.2s' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
                    <h4 style={{ color: '#ef4444', margin: '0 0 8px 0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 'bold' }}>Cancelled Order</h4>
                    <div className="value" style={{ color: '#991b1b', fontSize: '28px', fontWeight: 'bold' }}>{summary.cancelled}</div>
                </div>
            </div>

            <div className="chart-wrap" style={{ marginTop: 20, background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', minHeight: '350px' }}>
                <h3 style={{ color: '#0f3460', margin: '0 0 20px 0', fontSize: '16px', fontWeight: 'bold' }}>Tren Penjualan (Sales Trend)</h3>
                <div style={{ position: 'relative', height: '300px' }}>
                    {chartData.labels.length > 0 ? (
                        <Bar ref={chartRef} options={options} data={chartData} />
                    ) : (
                        <div style={{ padding: 40, textAlign: 'center', color: '#64748b', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Tidak ada data untuk periode ini</div>
                    )}
                </div>
            </div>

            {/* Best Sellers Section */}
            <div style={{ marginTop: 30, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600' }}>
                    Produk Terlaris
                </h3>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', borderBottom: '2px solid #007bff' }}>
                            <tr>
                                <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'center', width: '60px', fontWeight: 'bold' }}>#</th>
                                <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>NAMA PRODUK</th>
                                <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'right', fontWeight: 'bold' }}>TERJUAL (QTY)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bestSellers.length > 0 ? (
                                bestSellers.map((item, index) => (
                                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td style={{ padding: '12px 20px', color: 'black', fontWeight: 'bold', textAlign: 'center', fontSize: 13 }}>{index + 1}</td>
                                        <td style={{ padding: '12px 20px', color: 'black', fontWeight: '500', fontSize: 13 }}>{item.name}</td>
                                        <td style={{ padding: '12px 20px', color: '#0f3460', fontWeight: 'bold', textAlign: 'right', fontSize: '15px' }}>{item.qty}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="3" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Belum ada data penjualan</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
}
