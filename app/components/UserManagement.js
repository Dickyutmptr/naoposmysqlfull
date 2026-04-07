'use client';

import { useState, useEffect } from 'react';

export default function UserManagement({ onHome }) {
    const [users, setUsers] = useState([]);
    const [newUser, setNewUser] = useState({ name: '', username: '', password: '', role: 'cashier' });
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, username: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/users');
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error('Failed fetching users', err);
        }
    };

    const handleAdd = async () => {
        if (!newUser.name || !newUser.username || (!editMode && !newUser.password)) {
            return showToast('Mohon lengkapi semua data wajib', 'error');
        }

        try {
            const url = '/api/users';
            const method = editMode ? 'PUT' : 'POST';
            const body = {
                name: newUser.name,
                username: newUser.username,
                password: newUser.password,
                role: newUser.role
            };

            if (editMode) body.id = editId;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast(editMode ? 'Data user berhasil diupdate' : 'User baru berhasil dibuat');
                setNewUser({ name: '', username: '', password: '', role: 'cashier' });
                setEditMode(false);
                setEditId(null);
                fetchUsers();
            } else {
                const err = await res.json();
                showToast(err.error || 'Terjadi kesalahan sistem', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Koneksi bermasalah', 'error');
        }
    };

    const handleEdit = (u) => {
        setNewUser({
            name: u.name,
            username: u.username,
            password: '', // leave empty so it won't overwrite unless typed
            role: u.role
        });
        setEditMode(true);
        setEditId(u.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setNewUser({ name: '', username: '', password: '', role: 'cashier' });
        setEditMode(false);
        setEditId(null);
    };

    const handleDeleteClick = (id, username) => {
        setConfirmDelete({ show: true, id, username });
        const section = document.getElementById('daftar-user');
        if (section) window.scrollTo({ top: section.offsetTop - 100, behavior: 'smooth' });
    };

    const confirmDeleteAction = async () => {
        const { id, username } = confirmDelete;
        setConfirmDelete({ show: false, id: null, username: '' });

        try {
            const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast(`User ${username} berhasil dihapus!`);
                fetchUsers();
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menghapus', 'error');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const roleColors = {
        'owner': '#0f172a',
        'admin': '#ef4444', 
        'head_bar': '#f59e0b', 
        'assisten_head': '#8b5cf6', 
        'cashier': '#007bff', 
        'kitchen': '#10b981', 
        'bar': '#06b6d4'
    };

    const roleNames = {
        'owner': 'Owner',
        'admin': 'Admin',
        'head_bar': 'Head Bar',
        'assisten_head': 'Assisten Head',
        'cashier': 'Cashier',
        'kitchen': 'Kitchen',
        'bar': 'Bar'
    };

    return (
        <div className="app" style={{ color: 'black' }}>
            {toast.show && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: toast.type === 'success' ? '#10b981' : '#ef4444',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 9999,
                    fontWeight: 'bold',
                    transition: 'opacity 0.3s ease-in-out'
                }}>
                    {toast.message}
                </div>
            )}
            <div className="header">
                <h2>👥 Management User</h2>
                <button className="secondary" style={{ width: 'auto' }} onClick={onHome}>Home</button>
            </div>

            <div style={{ marginBottom: 30, background: 'white', padding: 20, borderRadius: 12, boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3 style={{ margin: 0 }}>{editMode ? 'Edit User' : 'Tambah User Baru'}</h3>
                    {editMode && <button className="secondary" onClick={cancelEdit} style={{ width: 'auto', padding: '4px 10px', fontSize: 12, margin: 0 }}>Batal Edit</button>}
                </div>

                <div style={{ display: 'flex', gap: 15, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 13, color: 'black', fontWeight: 600, display: 'block', marginBottom: 5 }}>Nama Lengkap</label>
                        <input
                            placeholder="Contoh: Budi Santoso"
                            value={newUser.name}
                            onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                            style={{ width: '100%', margin: 0, background: 'white', color: 'black', border: '1px solid #cbd5e1', padding: '10px 12px' }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 13, color: 'black', fontWeight: 600, display: 'block', marginBottom: 5 }}>Username Login</label>
                        <input
                            placeholder="Contoh: budi123"
                            value={newUser.username}
                            onChange={e => setNewUser({ ...newUser, username: e.target.value })}
                            style={{ width: '100%', margin: 0, background: 'white', color: 'black', border: '1px solid #cbd5e1', padding: '10px 12px' }}
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 200 }}>
                        <label style={{ fontSize: 13, color: 'black', fontWeight: 600, display: 'block', marginBottom: 5 }}>Password</label>
                        <input
                            type="password"
                            placeholder={editMode ? "(Kosongkan jika tak ingin ganti)" : "Minimal 4 huruf/angka"}
                            value={newUser.password}
                            onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                            style={{ width: '100%', margin: 0, background: 'white', color: 'black', border: '1px solid #cbd5e1', padding: '10px 12px' }}
                        />
                    </div>
                    <div style={{ width: 150 }}>
                        <label style={{ fontSize: 13, color: 'black', fontWeight: 600, display: 'block', marginBottom: 5 }}>Hak Akses (Role)</label>
                        <select
                            value={newUser.role}
                            onChange={e => setNewUser({ ...newUser, role: e.target.value })}
                            style={{ width: '100%', margin: 0, background: 'white', color: 'black', border: '1px solid #cbd5e1', padding: '10px 12px' }}
                        >
                            <option value="owner">Owner</option>
                            <option value="admin">Admin</option>
                            <option value="head_bar">Head Bar</option>
                            <option value="assisten_head">Assisten Head</option>
                            <option value="cashier">Cashier</option>
                            <option value="kitchen">Kitchen</option>
                            <option value="bar">Bar</option>
                        </select>
                    </div>
                    <div>
                        <button onClick={handleAdd} style={{ width: '100%', margin: 0, height: '42px', padding: '0 25px', background: editMode ? '#10b981' : '#007bff' }}>{editMode ? 'Update User' : 'Simpan User'}</button>
                    </div>
                </div>
            </div>

            <div id="daftar-user" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3 style={{ margin: 0 }}>Daftar Pengguna Sistem</h3>
                    
                    {confirmDelete.show && (
                        <div style={{
                            position: 'absolute', right: 0, top: -50,
                            background: '#ffffff', border: '2px solid #ef4444', borderRadius: '8px', zIndex: 10,
                            padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 15,
                            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)'
                        }}>
                            <span style={{ color: '#0f3460', fontSize: 14, fontWeight: 'bold' }}>
                                Yakin hapus user <span style={{ color: '#ef4444' }}>{confirmDelete.username}</span>?
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setConfirmDelete({ show: false, id: null, username: '' })} style={{ background: '#e2e8f0', color: '#333333', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
                                <button onClick={confirmDeleteAction} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>Ya, Hapus</button>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: '2px solid #007bff' }}>
                                <tr>
                                    <th style={{ padding: '15px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>USERNAME</th>
                                    <th style={{ padding: '15px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>NAMA LENGKAP</th>
                                    <th style={{ padding: '15px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>PASSWORD</th>
                                    <th style={{ padding: '15px 20px', color: '#007bff', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>HAK AKSES</th>
                                    <th style={{ padding: '15px 20px', color: '#007bff', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>AKSI</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="5" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Belum ada data user</td></tr>
                                ) : (
                                    users.map((u, index) => (
                                        <tr key={u.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                            <td style={{ padding: '12px 20px', color: 'black', fontSize: 14, fontWeight: 'bold' }}>{u.username}</td>
                                            <td style={{ padding: '12px 20px', color: 'black', fontSize: 14 }}>{u.name}</td>
                                            <td style={{ padding: '12px 20px', color: '#64748b', fontSize: 14, fontFamily: 'monospace' }}>
                                                {/* Sensor Password - Requested by user */}
                                                {'*'.repeat(Math.max(4, u.password.length))}
                                            </td>
                                            <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                <span style={{ 
                                                    background: roleColors[u.role] || '#64748b', 
                                                    color: 'white', 
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: 12, 
                                                    fontWeight: 'bold', 
                                                    display: 'inline-block' 
                                                }}>
                                                    {roleNames[u.role] || u.role}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleEdit(u)}
                                                        style={{ padding: '6px 12px', fontSize: 11, background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        EDIT
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteClick(u.id, u.username)}
                                                        style={{ padding: '6px 12px', fontSize: 11, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                    >
                                                        HAPUS
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
