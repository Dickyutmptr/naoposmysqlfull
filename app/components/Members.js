'use client';

import { useState, useEffect } from 'react';

export default function Members({ onHome, user }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');
    const [newCategory, setNewCategory] = useState('member');
    const [newDiscount, setNewDiscount] = useState(0);
    const [editId, setEditId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });
    const [successModal, setSuccessModal] = useState({ isOpen: false, message: '' });
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalMembersCount, setTotalMembersCount] = useState(0);

    // Global Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [globalSettings, setGlobalSettings] = useState({ member: 5, owner: 100 });
    const [savingSettings, setSavingSettings] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        fetchMembers();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setGlobalSettings(data);
            }
        } catch (err) {
            console.error("Failed to fetch settings", err);
        }
    };

    const saveSettings = async (e) => {
        e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(globalSettings)
            });
            if (res.ok) {
                setSuccessModal({ isOpen: true, message: 'Pengaturan Diskon berhasil disimpan!' });
                setIsSettingsOpen(false);
            }
        } catch (err) {
            alert(err.message);
        } finally {
            setSavingSettings(false);
        }
    };

    const fetchMembers = async (query = '', page = 1) => {
        setLoading(true);
        try {
            const url = query ? `/api/members/search?q=${encodeURIComponent(query)}&page=${page}&limit=50` : `/api/members?page=${page}&limit=50`;
            const res = await fetch(url);
            if (!res.ok) throw new Error('Failed to fetch members');
            const data = await res.json();
            
            if (data.data) {
                setMembers(data.data);
                setTotalPages(data.totalPages);
                setTotalMembersCount(data.totalCount);
                setCurrentPage(data.page);
            } else {
                setMembers(data);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        setCurrentPage(1);
        fetchMembers(searchQuery, 1);
    };

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
            fetchMembers(searchQuery, newPage);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError('');

        try {
            const isEdit = !!editId;
            const res = await fetch('/api/members', {
                method: isEdit ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    id: editId,
                    name: newName, 
                    phoneNumber: newPhone,
                    category: newCategory
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || `Failed to ${isEdit ? 'update' : 'create'} member`);
            }

            const member = await res.json();
            
            // Perbarui data local agar tampil
            if (isEdit) {
                setMembers(members.map(m => m.id === member.id ? { ...m, ...member } : m));
                setSuccessModal({ isOpen: true, message: 'Member berhasil diperbarui!' });
            } else {
                if (!searchQuery) {
                    setMembers([member, ...members]);
                    setTotalMembersCount(prev => prev + 1);
                } else {
                    fetchMembers(searchQuery, currentPage);
                }
                setSuccessModal({ isOpen: true, message: 'Member berhasil ditambahkan!' });
            }

            resetForm();
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditId(null);
        setNewName('');
        setNewPhone('');
        setNewCategory('member');
        setNewDiscount(0);
        setError('');
    };

    const handleEditClick = (member) => {
        setEditId(member.id);
        setNewName(member.name);
        setNewPhone(member.phoneNumber);
        setNewCategory(member.category || 'member');
        setError('');
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
            setTotalMembersCount(prev => prev - 1);
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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                            <h3 style={{ margin: 0, color: '#0f3460', fontSize: '18px', fontWeight: 'bold' }}>
                                {editId ? 'Edit Member' : 'Tambah Member Baru'}
                            </h3>
                            {editId && (
                                <button type="button" onClick={resetForm} style={{ background: '#e2e8f0', color: '#333', border: 'none', padding: '4px 10px', borderRadius: 4, fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}>
                                    BATAL EDIT
                                </button>
                            )}
                        </div>

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
                            <div style={{ marginBottom: 15 }}>
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
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#64748b', fontSize: 12, fontWeight: 'bold' }}>KATEGORI</label>
                                <select
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    style={{ background: 'white', border: '1px solid #ccc', color: 'black', width: '100%', padding: '10px', borderRadius: '6px' }}
                                >
                                    <option value="member">Member</option>
                                    <option value="owner">Owner</option>
                                </select>
                            </div>
                            {isAdmin && (
                                <div style={{ marginBottom: 20 }}>
                                    <button 
                                        type="button" 
                                        onClick={() => setIsSettingsOpen(true)}
                                        className="secondary"
                                        style={{ 
                                            width: '100%',
                                            margin: 0,
                                            background: '#f1f5f9',
                                            color: '#334155',
                                            border: '1px solid #cbd5e1'
                                        }}
                                    >
                                        ⚙️ PENGATURAN DISKON KATEGORI
                                    </button>
                                </div>
                            )}
                            <button type="submit" disabled={submitting} className="gold-btn" style={{ width: '100%', margin: 0, background: '#007bff', color: 'white' }}>
                                {submitting ? 'MENYIMPAN...' : (editId ? 'UPDATE MEMBER' : 'SIMPAN MEMBER')}
                            </button>
                        </form>

                        <div style={{ marginTop: 30, padding: 15, background: '#f8fafc', borderRadius: 8, border: '1px solid #e5e7eb' }}>
                            <h4 style={{ margin: '0 0 10px 0', color: '#64748b', fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold' }}>INFO AKSES</h4>
                            <div style={{ fontSize: 13, color: '#1e293b' }}>
                                Logged in as: <span style={{ color: '#007bff', fontWeight: 'bold' }}>{user?.name} ({user?.role})</span>
                            </div>
                            <div style={{ fontSize: 11, color: '#64748b', marginTop: 5 }}>
                                * {isAdmin ? 'Admin bisa Tambah, Edit, Hapus, dan atur Diskon.' : 'Kasir hanya bisa Tambah member standar.'}
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
                                onClick={() => { setSearchQuery(''); setCurrentPage(1); fetchMembers('', 1); }}
                                style={{ width: 'auto' }}
                            >
                                RESET
                            </button>
                        )}
                    </div>

                    <div style={{ flex: 1, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span>Daftar Member Aktif</span>
                            <span style={{ background: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '20px', fontSize: '13px', fontWeight: 'normal' }}>
                                Total: {totalMembersCount || members.length} Member
                            </span>
                        </h3>
                        <div style={{ overflowX: 'auto', flex: 1 }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, borderBottom: '2px solid #007bff' }}>
                                    <tr>
                                        <th style={{ padding: '12px 10px', color: '#007bff', fontSize: 11, textAlign: 'left', fontWeight: 'bold' }}>NAMA</th>
                                        <th style={{ padding: '12px 10px', color: '#007bff', fontSize: 11, textAlign: 'left', fontWeight: 'bold' }}>NO. HP</th>
                                        <th style={{ padding: '12px 10px', color: '#007bff', fontSize: 11, textAlign: 'left', fontWeight: 'bold' }}>KATEGORI</th>
                                        <th style={{ padding: '12px 10px', color: '#007bff', fontSize: 11, textAlign: 'left', fontWeight: 'bold' }}>TOTAL ORDER</th>
                                        <th style={{ padding: '12px 10px', color: '#007bff', fontSize: 11, textAlign: 'left', fontWeight: 'bold' }}>TERDAFTAR</th>
                                        {isAdmin && <th style={{ padding: '12px 10px', color: '#007bff', fontSize: 11, textAlign: 'center', width: 120, fontWeight: 'bold' }}>AKSI</th>}
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
                                                <td style={{ padding: '12px 15px', color: 'black', fontSize: 13, textTransform: 'capitalize' }}>
                                                    <span style={{ padding: '3px 8px', background: member.category === 'owner' ? '#fef08a' : '#e0f2fe', color: member.category === 'owner' ? '#854d0e' : '#0369a1', borderRadius: 12, fontWeight: 'bold', fontSize: 11 }}>
                                                        {member.category || 'Member'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 15px', color: '#007bff', fontSize: 13, fontWeight: 'bold' }}>
                                                    {member._count?.orders || 0} Kali
                                                </td>
                                                <td style={{ padding: '12px 15px', color: 'black', fontSize: 13 }}>
                                                    {new Date(member.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                {isAdmin && (
                                                    <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                                                        <div style={{ display: 'inline-flex', gap: '5px' }}>
                                                            <button
                                                                onClick={() => handleEditClick(member)}
                                                                style={{ padding: '6px 12px', fontSize: 11, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                                                                title="Edit Member"
                                                            >
                                                                EDIT
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(member.id, member.name)}
                                                                className="danger"
                                                                style={{ padding: '6px 12px', fontSize: 11, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold' }}
                                                                title="Hapus Member"
                                                            >
                                                                HAPUS
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={isAdmin ? 6 : 5} style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>
                                                {searchQuery ? 'Data tidak ditemukan' : 'Belum ada member'}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        
                        {/* Pagination Controls */}
                        {totalPages > 0 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 20px', background: '#f8fafc', borderTop: '1px solid #e5e7eb' }}>
                                <span style={{ fontSize: 13, color: '#64748b', fontWeight: 'bold' }}>
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                <div style={{ display: 'flex', gap: 5 }}>
                                    <button 
                                        onClick={() => handlePageChange(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        style={{ padding: '6px 12px', background: currentPage === 1 ? '#e2e8f0' : '#007bff', color: currentPage === 1 ? '#94a3b8' : 'white', border: 'none', borderRadius: 4, cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 'bold' }}
                                    >
                                        Sebelumnya
                                    </button>
                                    <button 
                                        onClick={() => handlePageChange(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        style={{ padding: '6px 12px', background: currentPage === totalPages ? '#e2e8f0' : '#007bff', color: currentPage === totalPages ? '#94a3b8' : 'white', border: 'none', borderRadius: 4, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 'bold' }}
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
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

            {/* Global Settings Modal */}
            {isSettingsOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 52, 96, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1100,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#ffffff', padding: 30, borderRadius: 16, width: '90%', maxWidth: 400,
                        border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}>
                        <h3 style={{ marginTop: 0, marginBottom: 20, color: '#0f3460', fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>
                            Pengaturan Diskon Bawaan
                        </h3>
                        
                        <form onSubmit={saveSettings}>
                            <div style={{ marginBottom: 15 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#64748b', fontSize: 12, fontWeight: 'bold' }}>DISKON MEMBER (%)</label>
                                <input
                                    type="number"
                                    value={globalSettings.member}
                                    onChange={(e) => setGlobalSettings({...globalSettings, member: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                                    min="0"
                                    max="100"
                                    required
                                    style={{ background: 'white', border: '1px solid #ccc', color: 'black', width: '100%', padding: '10px', borderRadius: '6px' }}
                                />
                            </div>
                            
                            <div style={{ marginBottom: 25 }}>
                                <label style={{ display: 'block', marginBottom: 5, color: '#64748b', fontSize: 12, fontWeight: 'bold' }}>DISKON OWNER (%)</label>
                                <input
                                    type="number"
                                    value={globalSettings.owner}
                                    onChange={(e) => setGlobalSettings({...globalSettings, owner: e.target.value === '' ? '' : parseFloat(e.target.value)})}
                                    min="0"
                                    max="100"
                                    required
                                    style={{ background: 'white', border: '1px solid #ccc', color: 'black', width: '100%', padding: '10px', borderRadius: '6px' }}
                                />
                            </div>
                            
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button
                                    type="button"
                                    onClick={() => setIsSettingsOpen(false)}
                                    style={{ flex: 1, padding: '12px', background: '#e2e8f0', color: '#333', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingSettings}
                                    style={{ flex: 1, padding: '12px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 13 }}
                                >
                                    {savingSettings ? 'Menyimpan...' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
