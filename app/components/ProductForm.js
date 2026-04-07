'use client';
import { useState, useEffect } from 'react';

export default function ProductForm({ onClose, onSuccess, initialData = null }) {
    const [ingredients, setIngredients] = useState([]);
    const [categories, setCategories] = useState([]);
    const [notification, setNotification] = useState({ isOpen: false, title: '', message: '', type: 'success' });
    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        price: initialData?.price || '',
        hpp: initialData?.hpp || '',
        categoryId: initialData?.categoryId || (initialData?.category?.id) || '',
        image: initialData?.image || '',
        recipes: initialData?.recipes ? initialData.recipes.map(r => ({
            ingredientId: r.ingredientId,
            amount: r.amount
        })) : []
    });

    // Fetch ingredients & categories
    useEffect(() => {
        fetch('/api/ingredients')
            .then(res => res.json())
            .then(data => setIngredients(data))
            .catch(err => console.error('Failed to fetch ingredients:', err));

        fetch('/api/categories')
            .then(res => res.json())
            .then(data => {
                setCategories(data);
                // Set default categoryId only if adding new product
                if (!initialData && data.length > 0) {
                    setFormData(prev => ({ ...prev, categoryId: data[0].id }));
                }
            })
            .catch(err => console.error('Failed to fetch categories:', err));
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddIngredient = () => {
        setFormData(prev => ({
            ...prev,
            recipes: [...prev.recipes, { ingredientId: '', amount: '' }]
        }));
    };

    const handleRemoveIngredient = (index) => {
        setFormData(prev => ({
            ...prev,
            recipes: prev.recipes.filter((_, i) => i !== index)
        }));
    };

    const handleRecipeChange = (index, field, value) => {
        const newRecipes = [...formData.recipes];
        newRecipes[index][field] = value;
        setFormData(prev => ({ ...prev, recipes: newRecipes }));
    };

    const closeNotification = () => {
        setNotification({ isOpen: false, title: '', message: '', type: 'success' });
    };

    const showNotification = (title, message, type) => {
        setNotification({ isOpen: true, title, message, type });
        if (type === 'success') {
            setTimeout(() => {
                onSuccess();
                onClose();
            }, 700);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Validation
            if (!formData.name || !formData.price) return showNotification('Data Tidak Lengkap', 'Nama Produk dan Harga Jual wajib diisi.', 'error');
            if (!formData.categoryId) return showNotification('Kategori Kosong', 'Kategori produk wajib dipilih.', 'error');

            const payload = {
                name: formData.name,
                price: parseFloat(formData.price),
                hpp: parseFloat(formData.hpp) || 0,
                categoryId: parseInt(formData.categoryId),
                image: formData.image,
                recipes: formData.recipes.filter(r => r.ingredientId && r.amount)
            };

            let url = '/api/products';
            let method = 'POST';

            if (initialData) {
                url = `/api/products/${initialData.id}`;
                method = 'PUT';
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Gagal menyimpan menu');
            }

            showNotification(
                initialData ? 'Berhasil Diupdate' : 'Berhasil Ditambahkan',
                initialData ? `Menu "${formData.name}" berhasil diperbarui.` : `Menu "${formData.name}" berhasil ditambahkan ke daftar.`,
                'success'
            );
        } catch (err) {
            showNotification('Terjadi Kesalahan', err.message, 'error');
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(15, 52, 96, 0.6)', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', paddingTop: '80px', zIndex: 1000, backdropFilter: 'blur(4px)'
        }}>
            <div style={{
                background: '#ffffff', padding: 30, borderRadius: 16, width: 550, maxWidth: '90%',
                maxHeight: '85vh', overflowY: 'auto', border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
            }}>
                <h2 style={{ borderBottom: '2px solid #cbd5e1', paddingBottom: 15, marginTop: 0, color: '#0f3460', fontSize: 22, fontWeight: 'bold' }}>
                    {initialData ? 'Edit Menu' : 'Tambah Menu Baru'}
                </h2>

                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#0f3460', fontWeight: 'bold', marginBottom: 5 }}>Nama Produk</label>
                        <input
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="Contoh: Kopi Susu"
                            style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 8, fontSize: 14 }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 15, marginBottom: 15 }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 13, color: '#0f3460', fontWeight: 'bold', marginBottom: 5 }}>Harga Jual</label>
                            <input
                                name="price"
                                type="number"
                                value={formData.price}
                                onChange={handleChange}
                                placeholder="0"
                                style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 8, fontSize: 14 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 13, color: '#0f3460', fontWeight: 'bold', marginBottom: 5 }}>HPP (Modal)</label>
                            <input
                                name="hpp"
                                type="number"
                                value={formData.hpp}
                                onChange={handleChange}
                                placeholder="0"
                                style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 8, fontSize: 14 }}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: 13, color: '#0f3460', fontWeight: 'bold', marginBottom: 5 }}>Kategori</label>
                            <select
                                name="categoryId"
                                value={formData.categoryId}
                                onChange={handleChange}
                                style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 8, fontSize: 14 }}
                            >
                                <option value="">-- Pilih Kategori --</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: 15 }}>
                        <label style={{ display: 'block', fontSize: 13, color: '#0f3460', fontWeight: 'bold', marginBottom: 5 }}>URL Gambar (Opsional)</label>
                        <input
                            name="image"
                            value={formData.image}
                            onChange={handleChange}
                            placeholder="https://..."
                            style={{ width: '100%', padding: 12, background: '#f8fafc', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 8, fontSize: 14 }}
                        />
                    </div>

                    <div style={{ marginBottom: 25, padding: 15, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                            <label style={{ fontSize: 13, color: '#0f3460', fontWeight: 'bold', margin: 0 }}>Resep / Bahan Baku</label>
                            <button type="button" onClick={handleAddIngredient} style={{ fontSize: 12, padding: '6px 12px', background: '#e2e8f0', color: '#0f3460', border: 'none', borderRadius: 6, fontWeight: 'bold', cursor: 'pointer' }}>+ Tambah Bahan</button>
                        </div>

                        {formData.recipes.map((recipe, index) => (
                            <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                                <select
                                    value={recipe.ingredientId}
                                    onChange={(e) => handleRecipeChange(index, 'ingredientId', e.target.value)}
                                    style={{ flex: 2, padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 6, fontSize: 13 }}
                                >
                                    <option value="">Pilih Bahan...</option>
                                    {ingredients.map(ing => (
                                        <option key={ing.id} value={ing.id}>{ing.name} ({ing.unit})</option>
                                    ))}
                                </select>
                                <input
                                    type="number"
                                    placeholder="Jml"
                                    value={recipe.amount}
                                    onChange={(e) => handleRecipeChange(index, 'amount', e.target.value)}
                                    style={{ flex: 1, padding: '10px 12px', background: '#ffffff', border: '1px solid #cbd5e1', color: '#333333', borderRadius: 6, fontSize: 13 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => handleRemoveIngredient(index)}
                                    style={{ background: '#ef4444', color: '#fff', width: 40, border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 'bold' }}
                                >×</button>
                            </div>
                        ))}
                        {formData.recipes.length === 0 && <div style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 10 }}>Tidak ada resep (Stok akan manual 999)</div>}
                    </div>

                    <div style={{ display: 'flex', gap: 15, marginTop: 30 }}>
                        <button type="button" onClick={onClose} style={{ flex: 1, padding: '14px 20px', background: '#e2e8f0', color: '#333333', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}>
                            Batal
                        </button>
                        <button type="submit" style={{ flex: 2, padding: '14px 20px', background: '#007bff', color: '#ffffff', border: 'none', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', fontSize: 14 }}>
                            {initialData ? 'Update Menu' : 'Simpan Menu'}
                        </button>
                    </div>
                </form>

                {/* Notification Modal */}
                {notification.isOpen && (
                    <div style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(15, 52, 96, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1200,
                        backdropFilter: 'blur(4px)'
                    }}>
                        <div style={{
                            background: '#ffffff', padding: 35, borderRadius: 20, width: '90%', maxWidth: 350,
                            border: `2px solid ${notification.type === 'success' ? '#10b981' : '#ef4444'}`, 
                            boxShadow: '0 10px 35px rgba(0,0,0,0.2)', textAlign: 'center'
                        }}>
                            <div style={{ 
                                width: 70, height: 70, borderRadius: '50%', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: notification.type === 'success' ? '#dcfce7' : '#fee2e2',
                                color: notification.type === 'success' ? '#16a34a' : '#dc2626',
                                fontSize: 36, fontWeight: 'bold'
                            }}>
                                {notification.type === 'success' ? '✓' : '!'}
                            </div>
                            <h3 style={{ marginTop: 0, marginBottom: 10, color: '#0f3460', fontSize: 22, fontWeight: 'bold' }}>
                                {notification.title}
                            </h3>
                            <p style={{ color: '#475569', marginBottom: 25, fontSize: 14, lineHeight: '1.6' }}>
                                {notification.message}
                            </p>
                            
                            {notification.type !== 'success' && (
                                <button
                                    onClick={closeNotification}
                                    style={{ 
                                        width: '100%', padding: '14px 15px', 
                                        background: '#ef4444', 
                                        color: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 'bold', fontSize: 15,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                    }}
                                >
                                    OK, Mengerti
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
