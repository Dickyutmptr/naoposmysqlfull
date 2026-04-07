'use client';
import { useState, useEffect } from 'react';

export default function Inventory({ onHome, user }) {
    const [items, setItems] = useState([]);
    const [newItem, setNewItem] = useState({ sku: '', name: '', qty: '', unit: 'gr', minStockThreshold: 1000, category: 'minuman' });
    const [filter, setFilter] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editId, setEditId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
    const [confirmDelete, setConfirmDelete] = useState({ show: false, id: null, name: '' });

    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    useEffect(() => {
        fetchIngredients();
        const interval = setInterval(fetchIngredients, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchIngredients = async () => {
        try {
            const res = await fetch('/api/ingredients');
            const data = await res.json();
            setItems(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleAdd = async () => {
        if (!newItem.name || !newItem.qty) return showToast('Mohon lengkapi data', 'error');

        try {
            const url = '/api/ingredients';
            const method = editMode ? 'PUT' : 'POST';
            const body = {
                sku: newItem.sku,
                name: newItem.name,
                stock: newItem.qty,
                unit: newItem.unit,
                minStockThreshold: newItem.minStockThreshold,
                category: newItem.category
            };

            if (editMode) body.id = editId;

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                showToast(editMode ? 'Stok berhasil diupdate!' : 'Bahan berhasil ditambahkan!');
                setNewItem({ sku: '', name: '', qty: '', unit: 'gr', minStockThreshold: 1000, category: 'minuman' });
                setEditMode(false);
                setEditId(null);
                fetchIngredients();
            } else {
                showToast('Gagal menyimpan data', 'error');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleDeleteClick = (id, name) => {
        setConfirmDelete({ show: true, id, name });
        const section = document.getElementById('daftar-bahan');
        if (section) window.scrollTo({ top: section.offsetTop - 100, behavior: 'smooth' });
    };

    const confirmDeleteAction = async () => {
        const { id, name } = confirmDelete;
        setConfirmDelete({ show: false, id: null, name: '' });

        try {
            const res = await fetch(`/api/ingredients?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                showToast(`${name} berhasil dihapus!`);
                fetchIngredients();
            } else {
                const err = await res.json();
                showToast(err.error || 'Gagal menghapus', 'error');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleEdit = (item) => {
        setNewItem({
            sku: item.sku || '',
            name: item.name,
            qty: item.stock,
            unit: item.unit,
            minStockThreshold: item.minStockThreshold || 1000,
            category: item.category || 'minuman'
        });
        setEditMode(true);
        setEditId(item.id);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const cancelEdit = () => {
        setNewItem({ sku: '', name: '', qty: '', unit: 'gr', minStockThreshold: 1000, category: 'minuman' });
        setEditMode(false);
        setEditId(null);
    }

    const filteredItems = items.filter(i => i.name.toLowerCase().includes(filter.toLowerCase()));

    // Robust filtering: Handle casing and potential other category names
    const minumanItems = filteredItems.filter(i => {
        const cat = (i.category || 'minuman').toLowerCase();
        return ['minuman', 'coffee', 'non-coffee', 'drink'].includes(cat);
    });

    const makananItems = filteredItems.filter(i => {
        const cat = (i.category || '').toLowerCase();
        return ['makanan', 'cemilan', 'food', 'snack'].includes(cat);
    });

    const renderTable = (data, title, icon) => (
        <div style={{ marginBottom: 30, background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600' }}>
                {icon} {title}
            </h3>
            <div style={{ overflowX: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, borderBottom: '2px solid #007bff' }}>
                        <tr>
                            <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>SKU</th>
                            <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>NAMA BARANG</th>
                            <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>STOK</th>
                            <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'left', fontWeight: 'bold' }}>SATUAN</th>
                            <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>STATUS</th>
                            <th style={{ padding: '12px 15px', color: '#007bff', fontSize: 12, textAlign: 'center', fontWeight: 'bold' }}>AKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr><td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Tidak ada data</td></tr>
                        ) : (
                            data.map((item, index) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                    <td style={{ padding: '12px 15px', color: 'black', fontSize: 13 }}>{item.sku || '-'}</td>
                                    <td style={{ padding: '12px 15px', color: 'black', fontSize: 13, fontWeight: '500' }}>{item.name}</td>
                                    <td style={{ padding: '12px 15px', color: 'black', fontSize: 14, fontWeight: 'bold', textAlign: 'center' }}>{parseFloat(parseFloat(item.stock).toFixed(2))}</td>
                                    <td style={{ padding: '12px 15px', color: 'black', fontSize: 13 }}>{item.unit}</td>
                                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                        {item.stock <= (item.minStockThreshold || 1000) ?
                                            <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 'bold', display: 'inline-block' }}>Low Stock</span> :
                                            <span style={{ background: '#dcfce7', color: '#22c55e', padding: '4px 8px', borderRadius: '4px', fontSize: 11, fontWeight: 'bold', display: 'inline-block' }}>Available</span>
                                        }
                                    </td>
                                    <td style={{ padding: '12px 15px', textAlign: 'center' }}>
                                        {user?.role === 'admin' || user?.role === 'owner' ? (
                                            <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    style={{ padding: '6px 12px', fontSize: 11, background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    EDIT
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item.id, item.name)}
                                                    style={{ padding: '6px 12px', fontSize: 11, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                                                >
                                                    HAPUS
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: 11, fontStyle: 'italic', fontWeight: 'bold' }}>View Only</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );

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
                <h2>📦 Inventory</h2>
                <button className="secondary" style={{ width: 'auto' }} onClick={onHome}>Home</button>
            </div>

            {user?.role === 'admin' || user?.role === 'owner' ? (
                <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <h3>{editMode ? 'Edit Bahan Baku' : 'Tambah Stok Baru'}</h3>
                        {editMode && <button className="secondary" onClick={cancelEdit} style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}>Batal Edit</button>}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 12, color: 'black' }}>SKU (Opsional)</label>
                            <input
                                placeholder="Contoh: SK-123"
                                value={newItem.sku}
                                onChange={e => setNewItem({ ...newItem, sku: e.target.value })}
                                style={{ margin: 0, background: 'white', color: 'black', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ flex: 2 }}>
                            <label style={{ fontSize: 12, color: 'black' }}>Nama Bahan</label>
                            <input
                                placeholder="Contoh: Susu Cair"
                                value={newItem.name}
                                onChange={e => setNewItem({ ...newItem, name: e.target.value })}
                                style={{ margin: 0, background: 'white', color: 'black', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ width: 150 }}>
                            <label style={{ fontSize: 12, color: 'black' }}>Kategori</label>
                            <select
                                value={newItem.category}
                                onChange={e => setNewItem({ ...newItem, category: e.target.value })}
                                style={{ margin: 0, background: 'white', color: 'black', border: '1px solid #ccc' }}
                            >
                                <option value="minuman">Minuman</option>
                                <option value="makanan">Makanan</option>
                            </select>
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ fontSize: 12, color: 'black' }}>Jumlah (Stok)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={newItem.qty}
                                onChange={e => setNewItem({ ...newItem, qty: e.target.value })}
                                style={{ margin: 0, background: 'white', color: 'black', border: '1px solid #ccc' }}
                            />
                        </div>
                        <div style={{ width: 100 }}>
                            <label style={{ fontSize: 12, color: 'black' }}>Satuan</label>
                            <select
                                value={newItem.unit}
                                onChange={e => setNewItem({ ...newItem, unit: e.target.value })}
                                style={{ margin: 0, background: 'white', color: 'black', border: '1px solid #ccc' }}
                            >
                                <option value="gr">gr</option>
                                <option value="ml">ml</option>
                                <option value="pcs">pcs</option>
                            </select>
                        </div>
                        <button onClick={handleAdd} style={{ width: 'auto', height: '46px' }}>{editMode ? 'Update' : 'Simpan'}</button>
                    </div>
                </div>
            ) : null}

            <div id="daftar-bahan" style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
                    <h3 style={{ margin: 0 }}>Daftar Bahan Baku</h3>
                    
                    {confirmDelete.show && (
                        <div style={{
                            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
                            background: '#ffffff', border: '2px solid #ef4444', borderRadius: '8px', zIndex: 10,
                            padding: '8px 20px', display: 'flex', alignItems: 'center', gap: 15,
                            boxShadow: '0 10px 25px rgba(239, 68, 68, 0.2)'
                        }}>
                            <span style={{ color: '#0f3460', fontSize: 14, fontWeight: 'bold' }}>
                                Yakin hapus <span style={{ color: '#ef4444' }}>{confirmDelete.name}</span>?
                            </span>
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button onClick={() => setConfirmDelete({ show: false, id: null, name: '' })} style={{ background: '#e2e8f0', color: '#333333', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>Batal</button>
                                <button onClick={confirmDeleteAction} style={{ background: '#ef4444', color: 'white', border: 'none', padding: '6px 14px', borderRadius: '6px', fontSize: 12, cursor: 'pointer', fontWeight: 'bold' }}>Ya, Hapus</button>
                            </div>
                        </div>
                    )}
                    <input
                        placeholder="Cari bahan..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        style={{ width: 250, margin: 0, background: 'white', color: 'black', border: '1px solid #ccc' }}
                    />
                </div>

                <div className="inventory-grid">
                    {/* LEFT: MINUMAN */}
                    {renderTable(minumanItems, 'Bahan Baku Minuman', '🥤')}

                    {/* RIGHT: MAKANAN */}
                    {renderTable(makananItems, 'Bahan Baku Makanan', '🍔')}
                </div>
            </div>
        </div>
    );
}
