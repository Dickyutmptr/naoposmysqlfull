'use client';
import { useState, useEffect } from 'react';
import { Trash2, Plus, ArrowLeft, Home, Edit } from 'lucide-react';
import ProductForm from './ProductForm';

export default function MenuManagement({ onHome }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [confirmDelete, setConfirmDelete] = useState({ isOpen: false, id: null, name: '' });

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products:', error);
            alert('Gagal mengambil data menu.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDeleteClick = (id, name) => {
        setConfirmDelete({ isOpen: true, id, name });
    };

    const submitDelete = async () => {
        const { id, name } = confirmDelete;
        if (!id) return;
        
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) {
                setConfirmDelete({ isOpen: false, id: null, name: '' });
                fetchProducts();
            } else {
                const err = await res.json();
                alert(`Gagal menghapus: ${err.error}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Terjadi kesalahan saat menghapus.');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setShowForm(true);
    };

    const handleFormClose = () => {
        setShowForm(false);
        setEditingProduct(null);
    };

    const handleFormSuccess = () => {
        handleFormClose();
        fetchProducts();
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category && p.category.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="app">
            <div className="header">
                <h2>📋 Management Menu</h2>
                <button className="secondary" style={{ width: 'auto' }} onClick={onHome}>
                    <Home size={16} style={{ marginRight: 5 }} /> Home
                </button>
            </div>

            <div className="section" style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <input
                            type="text"
                            placeholder="Cari menu..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ padding: '10px 15px', width: '300px', margin: 0, background: 'white', border: '1px solid #ccc', borderRadius: '6px', color: 'black' }}
                        />
                    </div>
                    <button
                        onClick={() => { setEditingProduct(null); setShowForm(true); }}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, background: '#007bff', color: 'white', fontWeight: 'bold', width: 'auto', padding: '10px 20px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        <Plus size={16} /> Tambah Menu
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <p>Loading data...</p>
                ) : (
                    <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
                        <h3 style={{ padding: '15px 20px', margin: 0, background: '#007bff', color: 'white', fontSize: '16px', fontWeight: '600' }}>
                            Daftar Menu Aktif
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 1, borderBottom: '2px solid #007bff' }}>
                                    <tr>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>ID</th>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>NAMA MENU</th>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>KATEGORI</th>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>HARGA JUAL</th>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>HPP</th>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'left', fontWeight: 'bold' }}>STATUS</th>
                                        <th style={{ padding: '12px 20px', color: '#007bff', fontSize: 13, textAlign: 'center', fontWeight: 'bold' }}>AKSI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product, index) => (
                                        <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                                            <td style={{ padding: '12px 20px', color: 'black', fontWeight: 'bold', fontSize: 13 }}>{product.id}</td>
                                            <td style={{ padding: '12px 20px', color: 'black', fontWeight: '600', fontSize: 14 }}>{product.name}</td>
                                            <td style={{ padding: '12px 20px', color: 'black', fontSize: 13 }}>{product.category?.name || '-'}</td>
                                            <td style={{ padding: '12px 20px', color: 'black', fontSize: 13, fontWeight: 'bold' }}>Rp {product.price.toLocaleString()}</td>
                                            <td style={{ padding: '12px 20px', color: product.hpp > 0 ? 'black' : '#9ca3af', fontSize: 13 }}>
                                                {product.hpp > 0 ? `Rp ${product.hpp.toLocaleString()}` : '-'}
                                            </td>
                                            <td style={{ padding: '12px 20px' }}>
                                                <span style={{ 
                                                    display: 'inline-block',
                                                    padding: '4px 10px', 
                                                    borderRadius: '20px', 
                                                    fontSize: '11px', 
                                                    fontWeight: 'bold',
                                                    background: product.isActive ? '#dcfce7' : '#fee2e2',
                                                    color: product.isActive ? '#166534' : '#991b1b',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {product.isActive ? 'Aktif' : 'Non-Aktif'}
                                                </span>
                                            </td>
                                            <td style={{ padding: '12px 20px', textAlign: 'center' }}>
                                                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                                                    <button
                                                        style={{ background: '#f59e0b', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                        onClick={() => handleEdit(product)}
                                                        title="Edit Menu"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '6px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                                        onClick={() => handleDeleteClick(product.id, product.name)}
                                                        title="Hapus Menu"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {filteredProducts.length === 0 && (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#6b7280', fontStyle: 'italic', fontSize: 14 }}>Tidak ada data menu.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

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
                                Apakah Anda yakin ingin menghapus menu <br />
                                <strong style={{ color: '#ef4444', fontSize: 16 }}>"{confirmDelete.name}"</strong>?<br />
                                <span style={{ fontSize: 12, color: '#64748b' }}>(Resep bahan baku juga akan terhapus)</span>
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

                {/* Modal Form */}
                {showForm && (
                    <ProductForm
                        initialData={editingProduct}
                        onClose={handleFormClose}
                        onSuccess={handleFormSuccess}
                    />
                )}
            </div>
        </div>
    );
}
