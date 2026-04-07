'use client';

import { useState, useEffect } from 'react';

export default function Reports({ onHome, user }) {
    const getLocalDateStr = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const getFirstDateOfMonth = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        return `${y}-${m}-01`;
    };

    const [activeTab, setActiveTab] = useState('create');
    const [date, setDate] = useState(getLocalDateStr()); // For creation (locked)
    const [startDate, setStartDate] = useState(getFirstDateOfMonth()); // Admin view
    const [endDate, setEndDate] = useState(getLocalDateStr()); // Admin view
    const [category, setCategory] = useState('Kitchen');
    const [description, setDescription] = useState('');
    const [imageFile, setImageFile] = useState(null); // File upload
    const [submitting, setSubmitting] = useState(false);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [successMsg, setSuccessMsg] = useState('');

    const isAdmin = user?.role === 'admin';

    // Fetch reports when tab changes to 'view' or date range changes
    useEffect(() => {
        if (activeTab === 'view' && isAdmin) {
            fetchReports();
        }
    }, [activeTab, startDate, endDate]); 

    const fetchReports = async () => {
        // Validate max 31 days
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays > 31) {
            alert('Rentang tanggal maksimal adalah 31 hari.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch(`/api/reports/daily?startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Failed to fetch reports', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            const formData = new FormData();
            formData.append('date', new Date(date).toISOString());
            formData.append('category', category);
            formData.append('description', description);
            formData.append('userId', user.id);
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const res = await fetch('/api/reports/daily', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) throw new Error('Failed to create report');

            setSuccessMsg('Laporan berhasil dikirim!');
            setTimeout(() => setSuccessMsg(''), 3000); // Clear after 3s
            setDescription('');
            setImageFile(null);
            // Reset the file input visually
            document.getElementById('fotoBukti').value = '';
        } catch (error) {
            alert(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = () => {
        // Simple CSV Export
        const headers = ['Tanggal', 'Pelapor', 'Role', 'Bagian', 'Keterangan', 'Image URL'];
        const csvContent = [headers, ...reports.map(r => [
            new Date(r.date).toLocaleDateString('id-ID'),
            r.user?.name || 'Unknown',
            r.user?.role || '-',
            r.category,
            `"${r.description.replace(/"/g, '""')}"`, // Escape quotes
            r.imageUrl || '-'
        ])].map(e => e.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Daily_Report_${startDate}_to_${endDate}.csv`;
        link.click();
    };

    return (
        <div className="app">
            <div className="header" style={{ marginBottom: 20 }}>
                <h1>Daily Report</h1>
                <button className="secondary" onClick={onHome} style={{ width: 'auto' }}>Kembali</button>
            </div>

            {/* TABS */}
            <div className="chart-tabs" style={{ marginBottom: 20, display: 'flex', gap: 10 }}>
                <button
                    className={activeTab === 'create' ? 'active' : ''}
                    onClick={() => setActiveTab('create')}
                    style={{
                        padding: '10px 20px',
                        borderRadius: '20px',
                        border: 'none',
                        background: activeTab === 'create' ? '#0f3460' : '#007bff',
                        color: '#ffffff',
                        opacity: activeTab === 'create' ? 1 : 0.7,
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'all 0.3s'
                    }}
                >
                    Buat Laporan
                </button>
                {isAdmin && (
                    <button
                        className={activeTab === 'view' ? 'active' : ''}
                        onClick={() => setActiveTab('view')}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '20px',
                            border: 'none',
                            background: activeTab === 'view' ? '#0f3460' : '#007bff',
                            color: '#ffffff',
                            opacity: activeTab === 'view' ? 1 : 0.7,
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: 'all 0.3s'
                        }}
                    >
                        Data Laporan (Admin)
                    </button>
                )}
            </div>

            {/* CONTENT */}
            <div style={{ background: '#ffffff', padding: 25, borderRadius: 16, border: '1px solid #cbd5e1' }}>

                {/* CREATE FORM */}
                {activeTab === 'create' && (
                    <div style={{ maxWidth: 600 }}>
                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#0f3460', fontSize: 13, fontWeight: 'bold' }}>TANGGAL</label>
                                <input
                                    type="date"
                                    value={date}
                                    readOnly
                                    style={{ background: '#e2e8f0', border: '1px solid #cbd5e1', padding: 10, width: '100%', borderRadius: 8, color: '#64748b', cursor: 'not-allowed' }}
                                />
                                <small style={{ color: '#64748b', fontSize: 11, marginTop: 4, display: 'block' }}>Tanggal laporan otomatis sesuai hari ini.</small>
                            </div>

                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#0f3460', fontSize: 13, fontWeight: 'bold' }}>BAGIAN (CATEGORY)</label>
                                <select
                                    value={category}
                                    onChange={e => setCategory(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 10, width: '100%', borderRadius: 8, color: '#333333' }}
                                >
                                    <option value="Kitchen">Kitchen</option>
                                    <option value="Bar">Bar</option>
                                    <option value="Kasir">Kasir</option>
                                    <option value="Operational">Operational</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#0f3460', fontSize: 13, fontWeight: 'bold' }}>KETERANGAN / MASALAH</label>
                                <textarea
                                    rows="5"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Jelaskan masalah atau laporan hari ini..."
                                    required
                                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 10, width: '100%', borderRadius: 8, color: '#333333', fontFamily: 'Inter' }}
                                />
                            </div>

                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#0f3460', fontSize: 13, fontWeight: 'bold' }}>FOTO BUKTI (Upload)</label>
                                <input
                                    type="file"
                                    id="fotoBukti"
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: 10, width: '100%', borderRadius: 8, color: '#333333' }}
                                />
                            </div>

                            <button type="submit" disabled={submitting} className="btn-primary" style={{ width: 'auto', padding: '12px 30px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                {submitting ? 'MENGIRIM...' : 'KIRIM LAPORAN'}
                            </button>
                            {successMsg && <div style={{ marginTop: 10, color: '#22c55e', fontSize: 14, fontWeight: 'bold' }}>{successMsg}</div>}
                        </form>
                    </div>
                )}

                {/* VIEW DATA (ADMIN ONLY) */}
                {activeTab === 'view' && isAdmin && (
                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <span style={{ color: '#0f3460', fontWeight: 'bold' }}>Periode:</span>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8, color: '#333333' }}
                                />
                                <span style={{ color: '#0f3460', fontWeight: 'bold' }}>s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    style={{ background: '#f8fafc', border: '1px solid #cbd5e1', padding: '8px 12px', borderRadius: 8, color: '#333333' }}
                                />
                            </div>
                            <button onClick={handleExport} className="secondary" style={{ width: 'auto', background: '#10b981', color: '#ffffff', border: 'none', padding: '10px 16px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
                                Export Excel (CSV)
                            </button>
                        </div>

                        <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                            <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600' }}>
                                Daftar Laporan
                            </h3>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, borderBottom: '2px solid #007bff' }}>
                                        <tr>
                                            <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>TANGGAL</th>
                                            <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>PELAPOR</th>
                                            <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>BAGIAN</th>
                                            <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>KETERANGAN</th>
                                            <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>FOTO</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Loading data...</td></tr>
                                        ) : reports.length > 0 ? (
                                            reports.map((r, index) => (
                                                <tr key={r.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                    <td style={{ padding: '12px 20px', color: 'black', fontSize: 13 }}>
                                                        {new Date(r.date).toLocaleDateString('id-ID')}
                                                    </td>
                                                    <td style={{ padding: '12px 20px', color: 'black', fontSize: 14, fontWeight: 'bold' }}>
                                                        {r.user?.name}
                                                        <div style={{ fontSize: 11, color: '#6b7280', fontWeight: 'normal' }}>{r.user?.role}</div>
                                                    </td>
                                                    <td style={{ padding: '12px 20px' }}>
                                                        <span style={{
                                                            background: r.category === 'Kitchen' ? 'rgba(239, 68, 68, 0.1)' : r.category === 'Bar' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 52, 96, 0.1)',
                                                            color: r.category === 'Kitchen' ? '#ef4444' : r.category === 'Bar' ? '#3b82f6' : '#0f3460',
                                                            padding: '6px 10px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', display: 'inline-block'
                                                        }}>
                                                            {r.category}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '12px 20px', color: 'black', fontSize: 13, maxWidth: 300 }}>
                                                        {r.description}
                                                    </td>
                                                    <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                        {r.imageUrl ? (
                                                            <a href={r.imageUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', fontSize: 12, textDecoration: 'underline', fontWeight: 'bold' }}>
                                                                Lihat
                                                            </a>
                                                        ) : <span style={{ color: '#9ca3af', fontStyle: 'italic', fontSize: 12 }}>-</span>}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Belum ada laporan pada periode ini</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
