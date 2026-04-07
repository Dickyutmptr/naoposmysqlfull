'use client';

import { useState, useEffect } from 'react';

export default function Members({ onHome, user }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async (query = '') => {
        setLoading(true);
        try {
            const url = query ? `/api/members/search?q=${encodeURIComponent(query)}` : '/api/members';
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch members');
            const data = await res.json();
            setMembers(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchMembers(searchQuery);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const res = await fetch('/api/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, phoneNumber: newPhone }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to create member');
            }

            const member = await res.json();
            if (!searchQuery) {
                setMembers([member, ...members]);
            } else {
                fetchMembers(searchQuery);
            }

            setNewName('');
            setNewPhone('');
            setSuccessModal({ isOpen: true, message: 'Member berhasil ditambahkan!' });
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteClick = (id, name) => {
        setConfirmDelete({ isOpen: true, id, name });
    };

    const submitDelete = async () => {
        const { id } = confirmDelete;
        if (!id) return;

        try {
            const res = await fetch(`/api/members?id=${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) {
                throw new Error('Failed to delete member');
            }

            setMembers(members.filter(m => m.id !== id));
            setConfirmDelete({ isOpen: false, id: null, name: '' });
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="app">
            <div className="header" style={{ marginBottom: 20 }}>
                <h1>Member Management</h1>
                <button className="secondary" onClick={onHome} style={{ width: 'auto' }}>Kembali</button>
            </div>

            <div className="pos-layout" style={{ height: 'calc(100vh - 140px)', overflow: 'hidden', gridTemplateColumns: '2fr 3fr' }}>
                {/* LEFT: Add Member Form */}
                <div className="pos-left" style={{ paddingRight: 20, borderRight: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ background: 'white', borderRadius: '12px', padding: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--border-color)' }}>
                        <h3 style={{ marginBottom: 20, color: '#0f3460', fontSize: '18px', fontWeight: 'bold' }}>Tambah Member Baru</h3>

                        {error && <div style={{ color: '#ef4444', marginBottom: 15, fontSize: 13, background: '#fee2e2', padding: 10, borderRadius: 6, fontWeight: 'bold' }}>{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#64748b', fontSize: 12, fontWeight: 'bold' }}>NAMA PELANGGAN</label>
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    required
                                    placeholder="Nama Lengkap"
                                    style={{ background: 'white', border: '1px solid #ccc', color: 'black', width: '100%' }}
                                />
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#64748b', fontSize: 12, fontWeight: 'bold' }}>NOMOR HANDPHONE</label>
                                <input
                                    type="tel"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                    required
                                    placeholder="08..."
                                    style={{ background: 'white', border: '1px solid #ccc', color: 'black', width: '100%' }}
                                />
                            </div>
                            <button type="submit" disabled={submitting} className="gold-btn" style={{ width: '100%', margin: 0, background: '#007bff', color: 'white' }}>
                                {submitting ? 'MENYIMPAN...' : 'SIMPAN MEMBER'}
                            </button>
                        </form>

                        <div style={{ marginTop: 30, padding: 15, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>INFO AKSES</h4>
                            <div style={{ fontSize: 13, color: '#1e293b' }}>
                                Logged in as: <span style={{ color: '#007bff', fontWeight: 'bold' }}>{user?.name} ({user?.role})</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>
                                * {isAdmin ? 'Admin can Add & Delete members.' : 'Cashier can only Add members.'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Member List */}
                <div className="pos-right" style={{ background: 'transparent', border: 'none', boxShadow: 'none', overflow: 'hidden', display: 'flex', flexDirection: 'column', paddingLeft: 20 }}>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                        <input
                            type="text"
                            placeholder="Cari Nama / No. HP..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ margin: 0, flex: 1, background: 'white', border: '1px solid #ccc', color: 'black' }}
                        />
                        <button type="button" onClick={handleSearch} style={{ width: 'auto', background: '#007bff', color: 'white', fontWeight: 'bold', padding: '0 20px', borderRadius: 6, border: 'none', cursor: 'pointer' }}>CARI</button>
                        {searchQuery && (
                            <button
                                type="button"
                                className="secondary"
                                onClick={() => { setSearchQuery(''); fetchMembers(''); }}
                                style={{ width: 'auto' }}
                            >
                                RESET
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600' }}>
                            Daftar Member Aktif
                        </h3>
                        <div style={{ overflowX: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, borderBottom: '2px solid #007bff' }}>
                                    <tr>
                                        <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>NAMA</th>
                                        <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>NO. HANDPHONE</th>
                                        <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>TOTAL ORDER</th>
                                        <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>TERDAFTAR</th>
                                        {isAdmin && <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'center', width: 80, fontWeight: 'bold' }}>AKSI</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={isAdmin ? 5 : 4} style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Loading data...</td>
                                        </tr>
                                    ) : members.length > 0 ? (
                                        members.map((member, index) => (
                                            <tr key={member.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                                <td style={{ padding: '12px 15px', color: 'black', fontSize: 13, fontWeight: 'bold' }}>{member.name}</td>
                                                <td style={{ padding: '12px 15px', color: 'black', fontSize: 13 }}>{member.phoneNumber}</td>
                                                <td style={{ padding: '12px 15px', color: '#007bff', fontSize: 13, fontWeight: 'bold' }}>
                                                    {member._count?.orders || 0} Kali
                                                </td>
                                                <td style={{ padding: '12px 15px', color: 'black', fontSize: 13 }}>
                                                    {new Date(member.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                {isAdmin && (
                                                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                                        <button
                                                            onClick={() => handleDeleteClick(member.id, member.name)}
                                                            className="danger"
                                                            style={{ padding: '6px 12px', fontSize: 11, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                                                            title="Hapus Member"
                                                        >
                                                            HAPUS
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isAdmin ? 5 : 4} style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>
                                                {searchQuery ? 'Data tidak ditemukan' : 'Belum ada member'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {confirmDelete.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 52, 96, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#ffffff', padding: 30, borderRadius: 16, width: '90%', maxWidth: 400,
                        border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: 15, color: '#0f3460', fontSize: 20, fontWeight: 'bold' }}>
                            Konfirmasi Hapus
                        </h3>
                        <p style={{ color: '#333333', marginBottom: 25, fontSize: 14, lineHeight: '1.5' }}>
                            Apakah Anda yakin ingin menghapus member <br />
                            <strong style={{ color: '#ef4444', fontSize: 16 }}>"{confirmDelete.name}"</strong>?
                        </p>
                        
                        <div style={{ display: 'flex', gap: 15, justifyContent: 'center' }}>
                            <button
                                onClick={() => setConfirmDelete({ isOpen: false, id: null, name: '' })}
                                style={{ flex: 1, padding: '12px 15px', background: '#e2e8f0', color: '#333333', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
                            >
                                Batal
                            </button>
                            <button
                                onClick={submitDelete}
                                style={{ flex: 1, padding: '12px 15px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Success Modal */}
            {successModal.isOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 52, 96, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#ffffff', padding: 30, borderRadius: 16, width: '90%', maxWidth: 400,
                        border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center'
                    }}>
                        <div style={{
                            width: 60, height: 60, borderRadius: '50%', background: '#dcfce7', color: '#16a34a',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 15px', fontSize: 30
                        }}>
                            ✓
                        </div>
                        <h3 style={{ marginTop: 0, marginBottom: 15, color: '#0f3460', fontSize: 20, fontWeight: 'bold' }}>
                            Berhasil!
                        </h3>
                        <p style={{ color: '#333333', marginBottom: 25, fontSize: 15, lineHeight: '1.5' }}>
                            {successModal.message}
                        </p>
                        
                        <button
                            onClick={() => setSuccessModal({ isOpen: false, message: '' })}
                            style={{ width: '100%', padding: '12px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
                        >
                            Tutup
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
