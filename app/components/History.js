'use client';
import { useState, useEffect } from 'react';

export default function History({ onHome }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);

    // Pagination & Search State
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Cancel Modal State
    const [cancelModal, setCancelModal] = useState({
        isOpen: false,
        orderId: null,
        reason: 'Customer Request',
        note: ''
    });

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 500);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        fetchHistory();
    }, [page, debouncedSearch]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams({
                page: page,
                limit: 25,
                search: debouncedSearch
            });
            const res = await fetch(`/api/orders?${params.toString()}`);
            const data = await res.json();

            if (data.data) {
                setHistory(data.data);
                setTotalPages(data.meta.lastPage);
            } else {
                setHistory([]);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCancelClick = (orderId) => {
        setCancelModal({
            isOpen: true,
            orderId,
            reason: 'Customer Request',
            note: ''
        });
    };

    const submitCancel = async () => {
        if (!cancelModal.orderId) return;

        try {
            const res = await fetch('/api/orders/cancel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId: cancelModal.orderId,
                    cancelReason: cancelModal.reason,
                    cancelNote: cancelModal.note
                })
            });
            const result = await res.json();

            if (result.success) {
                setCancelModal({ isOpen: false, orderId: null, reason: 'Customer Request', note: '' });
                fetchHistory(); // Refresh
            } else {
                alert(`Gagal: ${result.error}`);
            }
        } catch (err) {
            console.error(err);
            alert('Terjadi kesalahan saat membatalkan order');
        }
    };

    return (
        <div className="app">
            <div className="header">
                <h1>Riwayat Transaksi</h1>
                <button className="secondary" style={{ width: 'auto' }} onClick={onHome}>Home</button>
            </div>

            <div className="dashboard-controls" style={{ padding: '0 20px', marginBottom: 20 }}>
                <input
                    placeholder="Cari Order ID..."
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    style={{ padding: 10, background: 'white', border: '1px solid #ccc', color: 'black', borderRadius: 6, width: 250 }}
                />
            </div>

            <div style={{ padding: '0 20px', marginBottom: 30 }}>
                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                    <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600' }}>
                        Daftar Transaksi
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, borderBottom: '2px solid #007bff' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>ORDER ID</th>
                                    <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>DATE</th>
                                    <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>ITEMS</th>
                                    <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>TOTAL</th>
                                    <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>STATUS</th>
                                    <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>ACTION</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Loading...</td></tr>
                                ) : history.length === 0 ? (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Tidak ada data</td></tr>
                                ) : history.map((h, index) => (
                                    <tr key={h.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                        <td style={{ padding: '12px 20px', color: 'black', fontWeight: 'bold', fontSize: 13 }}>{h.id}</td>
                                        <td style={{ padding: '12px 20px', color: 'black', fontSize: 13 }}>{h.date}</td>
                                        <td style={{ padding: '12px 20px', color: 'black', fontSize: 13 }}>{h.itemsSummary || h.items}</td>
                                        <td style={{ padding: '12px 20px', color: 'black', fontWeight: 'bold', fontSize: 14 }}>Rp {parseInt(h.total).toLocaleString()}</td>
                                        <td style={{
                                            padding: '12px 20px',
                                            color: h.status === 'cancelled' ? '#ef4444' : h.status === 'completed' ? '#10b981' : '#f59e0b',
                                            fontWeight: 'bold',
                                            textTransform: 'capitalize',
                                            fontSize: 13
                                        }}>
                                            {h.status}
                                        </td>
                                        <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                            {h.status !== 'cancelled' && h.status !== 'completed' && (
                                                <button
                                                    onClick={() => handleCancelClick(h.id)}
                                                    style={{
                                                        background: '#ef4444',
                                                        color: '#fff',
                                                        border: 'none',
                                                        padding: '6px 12px',
                                                        borderRadius: 4,
                                                        fontSize: 11,
                                                        cursor: 'pointer',
                                                        fontWeight: 'bold'
                                                    }}
                                                >
                                                    BATALKAN
                                                </button>
                                            )}
                                            {h.status === 'cancelled' && (
                                                <div style={{ color: '#ef4444', fontSize: 12, display: 'flex', flexDirection: 'column' }}>
                                                    <strong>Dibatalkan</strong>
                                                    {h.cancelReason && <span style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>{h.cancelReason}</span>}
                                                    {h.cancelNote && <span style={{ fontSize: 11, color: '#6b7280', fontStyle: 'italic' }}>"{h.cancelNote}"</span>}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {cancelModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 52, 96, 0.6)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 1000,
                    paddingTop: '80px', backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#ffffff', padding: 30, borderRadius: 16, width: '90%', maxWidth: 450,
                        border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: 15, marginTop: 0, marginBottom: 20, color: '#0f3460', fontSize: 20, fontWeight: 'bold' }}>
                            Batalkan Pesanan?
                        </h3>
                        <p style={{ color: '#333333', marginBottom: 20, fontSize: 14 }}>
                            Stok untuk pesanan <strong style={{ color: '#0f3460' }}>{cancelModal.orderId}</strong> akan dikembalikan secara otomatis.
                        </p>

                        <div style={{ marginBottom: 15 }}>
                            <label style={{ display: 'block', color: '#0f3460', marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Alasan Pembatalan</label>
                            <select
                                value={cancelModal.reason}
                                onChange={(e) => setCancelModal({ ...cancelModal, reason: e.target.value })}
                                style={{
                                    width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1',
                                    background: '#f8fafc', color: '#333333', fontSize: 14
                                }}
                            >
                                <option value="Customer Request">Customer Request</option>
                                <option value="Salah Input Kasir">Salah Input Kasir</option>
                                <option value="Pesanan Double">Pesanan Double</option>
                                <option value="Perubahan Pesanan">Perubahan Pesanan</option>
                                <option value="Pembayaran Gagal">Pembayaran Gagal</option>
                            </select>
                        </div>

                        <div style={{ marginBottom: 25 }}>
                            <label style={{ display: 'block', color: '#0f3460', marginBottom: 5, fontSize: 13, fontWeight: 'bold' }}>Catatan Tambahan (Opsional)</label>
                            <textarea
                                value={cancelModal.note}
                                onChange={(e) => setCancelModal({ ...cancelModal, note: e.target.value })}
                                placeholder="Tulis catatan jika ada..."
                                style={{
                                    width: '100%', padding: 12, borderRadius: 8, border: '1px solid #cbd5e1',
                                    background: '#f8fafc', color: '#333333', minHeight: 80, resize: 'vertical', fontSize: 14
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: 15, justifyContent: 'flex-end', marginTop: 10 }}>
                            <button
                                onClick={() => setCancelModal({ ...cancelModal, isOpen: false })}
                                style={{ flex: 1, padding: '12px 15px', background: '#e2e8f0', color: '#333333', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
                            >
                                Kembali
                            </button>
                            <button
                                onClick={submitCancel}
                                style={{ flex: 1, padding: '12px 15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
                            >
                                Konfirmasi Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 20, paddingBottom: 20 }}>
                <button
                    disabled={page === 1}
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    style={{ padding: '8px 15px', background: page === 1 ? '#e5e7eb' : '#007bff', color: page === 1 ? '#9ca3af' : '#fff', border: 'none', borderRadius: 4, cursor: page === 1 ? 'default' : 'pointer', fontWeight: 'bold' }}
                >
                    Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', color: 'black', background: '#f0f4f8', padding: '0 15px', borderRadius: 4, fontWeight: 'bold', fontSize: 13 }}>
                    Page {page} of {totalPages}
                </span>
                <button
                    disabled={page >= totalPages}
                    onClick={() => setPage(p => p + 1)}
                    style={{ padding: '8px 15px', background: page >= totalPages ? '#e5e7eb' : '#007bff', color: page >= totalPages ? '#9ca3af' : '#fff', border: 'none', borderRadius: 4, cursor: page >= totalPages ? 'default' : 'pointer', fontWeight: 'bold' }}
                >
                    Next
                </button>
            </div>
        </div>
    );
}
