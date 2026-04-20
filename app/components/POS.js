'use client';

import { useState, useEffect } from 'react';
import { rupiah } from '../lib/utils';
import { ShoppingCart, LayoutGrid, Coffee, Utensils, Zap, Search, User } from 'lucide-react'; // Example icons

export default function POS({ onHome, onHistory, user }) {
    const [items, setItems] = useState([]);
    const [cart, setCart] = useState([]);
    const [category, setCategory] = useState('all');
    const [search, setSearch] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [qty, setQty] = useState(1);
    const [notes, setNotes] = useState([]);
    const [serviceType, setServiceType] = useState('dine-in');
    const [paymentMethod, setPaymentMethod] = useState('qris');

    // Member State
    const [memberQuery, setMemberQuery] = useState('');
    const [member, setMember] = useState(null);
    const [isSearchingMember, setIsSearchingMember] = useState(false);

    // Customer Info State
    const [customerName, setCustomerName] = useState('');
    const [tableNumber, setTableNumber] = useState('');

    // Global Settings State
    const [globalSettings, setGlobalSettings] = useState({ member: 5, owner: 100 });

    // Success Modal State
    const [successReceipt, setSuccessReceipt] = useState(null);

    // Initial Fetch
    useEffect(() => {
        fetchProducts();
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

    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            const data = await res.json();
            if (Array.isArray(data)) {
                setItems(data);
            } else {
                console.error('Data format error:', data);
                alert('Gagal mengambil data produk (Format Error)');
            }
        } catch (err) {
            console.error('Failed to fetch products', err);
            alert('Gagal mengambil data produk (Network/Server Error)');
        }
    };

    // Filter Items
    const filteredItems = items.filter(i => {
        const itemCat = i.kategori || '';

        // Sembunyikan Add-on dari tampilan POS utama
        if (itemCat === 'Add-on') return false;

        const matchCat = category === 'all' || itemCat === category;
        const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
        return matchCat && matchSearch;
    });

    const handleSelect = (item) => {
        if (!item.isAvailable) return;
        setSelectedItem(item);
        setQty(1);
        setNotes([]);
    };

    const addToCart = () => {
        if (!selectedItem) return;

        // Check stock locally (simple check, backend does real validation)
        if (selectedItem.stock < qty) {
            return alert(`Stok tidak cukup! Tersisa ${selectedItem.stock}`);
        }

        // Identifikasi Add-on dari notes
        const addonNames = ['Matcha Foam', 'Coconut Foam', 'Strawberry Foam', 'Cream Cheese', 'Coffee Foam'];
        const selectedAddonNames = notes.filter(n => addonNames.includes(n));

        // Cari objek product aslinya dari state items untuk add-on yang dipilih
        const addonProducts = selectedAddonNames.map(name => {
            const found = items.find(i => i.name.toUpperCase() === name.toUpperCase() && i.kategori === 'Add-on');
            if (found) {
                return { ...found, qty: qty };
            }
            return { id: `fallback-${Date.now()}-${Math.random()}`, name, price: 10000, qty };
        });

        const addonsTotal = addonProducts.reduce((sum, p) => sum + p.price, 0);

        const newItem = {
            ...selectedItem,
            productId: selectedItem.id, // Store real ID
            qty,
            notes: [...notes],
            realAddons: addonProducts, // Simpan add-ons asli ke cart item
            price: selectedItem.price, // Harga asli minuman (tanpa add-on)
            total: (selectedItem.price + addonsTotal) * qty, // Total termasuk add-on
            id: Date.now() // unique id for UI key
        };
        setCart([...cart, newItem]);
        setSelectedItem(null);
    };

    const removeFromCart = (cartId) => {
        setCart(cart.filter(c => c.id !== cartId));
    };

    // Calculation Logic
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    // Hitung diskon secara dinamis mengambil dari Global Settings dan Kategori Member
    const discountRate = member ? (member.category === 'owner' ? globalSettings.owner : globalSettings.member) : 0;
    const discountMember = member ? Math.round(subtotal * (discountRate / 100)) : 0;
    const categoryName = member ? (member.category === 'owner' ? 'Owner' : 'Member') : '';
    const afterDiscount = subtotal - discountMember;

    // 3% Service Charge
    const serviceChargeAmt = Math.round(afterDiscount * 0.03);

    // 10% PB1 applied after discount AND service charge
    const ppn = Math.round((afterDiscount + serviceChargeAmt) * 0.10);

    const grandTotal = afterDiscount + serviceChargeAmt + ppn;

    const searchMember = async () => {
        if (!memberQuery) return;
        setIsSearchingMember(true);
        try {
            const res = await fetch(`/api/members/search?q=${memberQuery}`);
            const result = await res.json();
            const items = result.data || result; // Backward compatibility

            if (items && items.length > 0) {
                setMember(items[0]);
                setMemberQuery('');
                let name = items[0].name;
                setCustomerName(name); // Auto-fill customer name
                console.log(`Member Found: ${name}`);
            } else {
                alert('Member not found');
                setMember(null);
            }
        } catch (err) {
            console.error(err);
            alert('Error searching member');
        } finally {
            setIsSearchingMember(false);
        }
    };

    const handleRemoveMember = () => {
        setMember(null);
        // Optional: Clear customer name when member is removed? 
        // setCustomerName(''); 
        // Leaving it might be better if they just want to remove the discount but keep name.
    }

    // === START PRINT KOMPUTER / LAPTOP ===
    const printReceipt = (orderData, isCopy = false) => {
        const getReceiptHTML = (isCopy = false) => `
            <div style="font-family: 'Courier New', monospace; font-size: 14px; font-weight: bold; width: 100%; max-width: 58mm; margin: 0 auto; padding: 0; color: #000; background: #fff;">
                <div style="text-align: center; margin-bottom: 5px;">
                    <h2 style="margin: 0; font-size: 18px; font-weight: bold;">NAO COFFEE & WRAP</h2>
                    <p style="margin: 0; font-size: 13px;">Jl. Boni, RT 001/RW 004, Parigi</p>
                    <p style="margin: 0; font-size: 13px;">Pd. Aren, Tangerang Selatan</p>
                    ${isCopy ? `<p style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">*** COPY ***</p>` : ''}
                </div>
                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="text-align: center; margin: 5px 0;">
                    <div style="font-size: 13px;">ANTRIAN</div>
                    <div style="font-size: 28px; font-weight: bold;">${orderData.queueNumber || orderData.orderId.split('-')[1]}</div>
                </div>

                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    <span>${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>Order ID</span>
                    <span>${orderData.orderId}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>Kasir</span>
                    <span>${user?.name || 'Cashier'}</span> 
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>Pelanggan</span>
                    <span>${orderData.customerName || 'Guest'}</span>
                </div>
                ${orderData.tableNumber ? `
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>Meja</span>
                    <span>${orderData.tableNumber}</span>
                </div>` : ''}
                
                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="margin-bottom: 5px;">
                    ${orderData.items.map(item => `
                        <div style="margin-bottom: 3px;">
                            <div style="font-weight: bold; font-size: 14px;">${item.name}</div>
                            <div style="display: flex; justify-content: space-between; font-size: 13px;">
                                <span>${item.qty}x ${rupiah(item.price)}</span>
                                <span>${rupiah(item.price * item.qty)}</span>
                            </div>
                            ${item.note ? `<div style="font-size: 12px; font-style: italic;">(${item.note})</div>` : ''}
                        </div>
                    `).join('')}
                </div>
                
                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>Subtotal</span>
                    <span>${rupiah(orderData.totalAmount || 0)}</span>
                </div>
                ${orderData.discountAmount > 0 ? `
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>Disc. ${orderData.categoryName || 'Member'} (${orderData.discountRate || 5}%)</span>
                    <span>-${rupiah(orderData.discountAmount)}</span>
                </div>` : ''}
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>SC (3%)</span>
                    <span>${rupiah(orderData.serviceCharge || 0)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 13px;">
                    <span>PB1 (10%)</span>
                    <span>${rupiah(orderData.taxAmount || 0)}</span>
                </div>
                
                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 16px;">
                    <span>TOTAL</span>
                    <span>${rupiah(orderData.finalAmount)}</span>
                </div>
                
                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="text-align: center; margin: 5px 0; font-weight: bold; font-size: 14px;">
                    ${orderData.paymentMethod.toUpperCase()}
                </div>
                
                <div style="border-bottom: 1px dashed #000; margin: 5px 0;"></div>
                
                <div style="text-align: center; margin-top: 5px;">
                    <p style="margin: 0; font-size: 13px;">Terima Kasih</p>
                </div>
            </div>
        `;

        const printSingle = (copyFlag) => {
            const html = `
                <html>
                <head>
                    <title>Receipt ${copyFlag ? '(Copy)' : ''}</title>
                    <style>
                        @page { margin: 0; size: 58mm auto; }
                        body { margin: 0; padding: 0; width: 58mm; background: white; color: black; }
                    </style>
                </head>
                <body>
                    ${getReceiptHTML(copyFlag)}
                </body>
                </html>
            `;

            const iframe = document.createElement('iframe');
            iframe.style.display = 'none';
            document.body.appendChild(iframe);

            iframe.contentWindow.document.open();
            iframe.contentWindow.document.write(html);
            iframe.contentWindow.document.close();

            setTimeout(() => {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                setTimeout(() => {
                    document.body.removeChild(iframe);
                }, 1000);
            }, 500);
        };

        printSingle(isCopy);
    };
    // === END PRINT KOMPUTER / LAPTOP ===

    // === START PRINT ANDROID RAWBT ===
    function printKeRawBT(base64Data) {
        // Menggunakan window.location.href kembali agar izin intent tidak di-blokir oleh browser Android
        window.location.href = "intent:base64," + base64Data + "#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;";
    }
    // === END PRINT ANDROID RAWBT ===

    // === OUTPUT TEKS PRINT ANDROID ===
    const padCenter = (str, len = 32) => {
        if (str.length >= len) return str.substring(0, len);
        const p = Math.floor((len - str.length) / 2);
        return " ".repeat(p) + str + " ".repeat(len - str.length - p);
    };

    const padLR = (l, r, len = 32) => {
        const strL = String(l);
        const strR = String(r);
        if (strL.length + strR.length >= len) {
            return strL.substring(0, len - strR.length - 1) + " " + strR;
        }
        return strL + " ".repeat(len - strL.length - strR.length) + strR;
    };

    const generatePlainTextReceipt = (receiptData, isCopy = false) => {
        let txt = "";
        txt += padCenter("NAO COFFEE & WRAP") + "\n";
        txt += padCenter("Jl. Boni, RT 001/RW 004, Parigi") + "\n";
        txt += padCenter("Pd. Aren, Tangerang Selatan") + "\n";
        if (isCopy) txt += padCenter("*** COPY ***") + "\n";
        txt += "--------------------------------\n";

        txt += padCenter("ANTRIAN") + "\n";
        txt += padCenter(String(receiptData.queueNumber || receiptData.orderId.split('-')[1])) + "\n";
        txt += "--------------------------------\n";

        txt += padLR(new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }),
            new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false })) + "\n";
        txt += padLR("Order ID", receiptData.orderId) + "\n";
        txt += padLR("Kasir", user?.name || "Cashier") + "\n";
        txt += padLR("Pelanggan", receiptData.customerName || "Guest") + "\n";
        if (receiptData.tableNumber) {
            txt += padLR("Meja", receiptData.tableNumber) + "\n";
        }
        txt += "--------------------------------\n";

        receiptData.items.forEach(item => {
            txt += item.name + "\n";
            if (item.note) {
                txt += "  (" + item.note + ")\n";
            }
            const qtyStr = `${item.qty}x ${rupiah(item.price)}`;
            txt += padLR(qtyStr, rupiah(item.price * item.qty)) + "\n";
        });

        txt += "--------------------------------\n";
        txt += padLR("Subtotal", rupiah(receiptData.totalAmount || 0)) + "\n";
        if (receiptData.discountAmount > 0) {
            const discLabel = `Disc. ${receiptData.categoryName || 'Mbr'}`;
            txt += padLR(discLabel, `-${rupiah(receiptData.discountAmount)}`) + "\n";
        }
        txt += padLR("SC (3%)", rupiah(receiptData.serviceCharge || 0)) + "\n";
        txt += padLR("PB1 (10%)", rupiah(receiptData.taxAmount || 0)) + "\n";
        txt += "--------------------------------\n";
        txt += padLR("TOTAL", rupiah(receiptData.finalAmount)) + "\n";
        txt += "--------------------------------\n";
        txt += padCenter(receiptData.paymentMethod.toUpperCase()) + "\n";
        txt += "--------------------------------\n";
        txt += padCenter("Terima Kasih") + "\n\n\n";


        return txt;
    };
    // === END OUTPUT TEKS PRINT ANDROID ===


    const handleCheckout = async () => {
        if (cart.length === 0) return alert('Keranjang kosong');

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cart: cart.flatMap(c => {
                        const payload = [{
                            id: c.productId,
                            qty: c.qty,
                            price: c.price,
                            notes: c.notes,
                            nama: c.name
                        }];
                        if (c.realAddons && c.realAddons.length > 0) {
                            c.realAddons.forEach(addon => {
                                payload.push({
                                    id: String(addon.id).startsWith('fallback') ? 1 : addon.id,
                                    qty: c.qty,
                                    price: addon.price,
                                    notes: [`Untuk: ${c.name}`],
                                    nama: addon.name
                                });
                            });
                        }
                        return payload;
                    }),
                    subtotal,
                    tax: ppn,
                    discount: discountMember,
                    serviceCharge: serviceChargeAmt,
                    finalTotal: grandTotal,
                    memberId: member ? member.id : null,
                    paymentMethod,
                    serviceType,
                    cashGiven: grandTotal,
                    customerName: customerName || 'Guest',
                    tableNumber: tableNumber || null,
                    userId: user?.id || 1
                })
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error || 'Transaction failed');
            }

            const order = await res.json();
            const receiptData = {
                orderId: order.orderId,
                queueNumber: order.queueNumber,
                items: cart.map(c => {
                    const addonSum = c.realAddons ? c.realAddons.reduce((s, a) => s + a.price, 0) : 0;
                    return {
                        name: c.name,
                        qty: c.qty,
                        price: c.price + addonSum,
                        note: c.notes.join(', ')
                    };
                }),
                totalAmount: subtotal,
                discountAmount: discountMember,
                categoryName: categoryName,
                discountRate: discountRate,
                serviceCharge: serviceChargeAmt,
                taxAmount: ppn,
                finalAmount: grandTotal,
                paymentMethod,
                cashGiven: grandTotal,
                customerName: customerName || 'Guest',
                tableNumber: tableNumber
            };

            // --- Panggil Fungsi Print Utama ---
            const isAndroid = /android/i.test(navigator.userAgent);
            if (isAndroid) {
                const plainText = generatePlainTextReceipt(receiptData, false);
                const base64Data = btoa(plainText);
                printKeRawBT(base64Data);
            } else {
                printReceipt(receiptData, false);
            }
            // --- Tampilkan Output Berhasil ---
            setSuccessReceipt(receiptData);

            // Reset
            setCart([]);
            setMember(null);
            setCustomerName('');
            setTableNumber('');
            fetchProducts();

        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="pos-layout">
            <div className="pos-left">
                {/* Products Section */}
                <div className="section glass-panel">
                    <div style={{ display: 'flex', gap: 10, marginBottom: 15 }}>
                        <input
                            placeholder="Cari menu..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            style={{ margin: 0, flex: 2, background: 'var(--background-color)', border: '1px solid var(--border-color)', color: 'var(--text-main)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: 5, marginBottom: 15, flexWrap: 'wrap' }}>
                        {['all', 'Makanan', 'Coffee Series', 'Coconut Series', 'Matcha Series', 'Chocolate Series', 'Snack'].map(cat => (
                            <button
                                key={cat}
                                className={`btn ${category === cat ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setCategory(cat)}
                                style={{ flex: 1, padding: '8px', fontSize: '11px' }}
                            >
                                {cat.toUpperCase()}
                            </button>
                        ))}
                    </div>

                    <div className="product-grid">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className={`product-card ${selectedItem?.id === item.id ? 'active' : ''}`}
                                onClick={() => handleSelect(item)}
                                style={{
                                    opacity: item.isAvailable ? 1 : 0.8,
                                    padding: '1rem',
                                    pointerEvents: item.isAvailable ? 'auto' : 'none',
                                    position: 'relative'
                                }}
                            >
                                <div style={{ position: 'relative', width: '100%', height: '100px', marginBottom: '0.5rem' }}>
                                    <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                                    {!item.isAvailable && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 52, 96, 0.7)', backdropFilter: 'blur(1.5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-sm)', zIndex: 10 }}>
                                            <span style={{ fontFamily: '"Playfair Display", "Lora", "Georgia", serif', fontSize: '13px', fontWeight: '600', letterSpacing: '1px', color: '#ffffff', textShadow: '0 2px 4px rgba(0,0,0,0.8)', textAlign: 'center', textTransform: 'uppercase' }}>Out Of Stock</span>
                                        </div>
                                    )}
                                </div>
                                <h3 style={{ fontSize: '13px', margin: '5px 0', wordWrap: 'break-word', lineHeight: '1.2' }}>{item.name}</h3>
                                <div className="price" style={{ color: 'white', fontWeight: 600, fontSize: '13px' }}>{rupiah(item.price)}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Selected Item Modal */}
                {selectedItem && (
                    <div style={{
                        position: 'fixed',
                        top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        zIndex: 9999,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <div className="section glass-panel animate-fade-in" style={{ width: '480px', maxWidth: '90vw', background: 'var(--primary)', border: '1px solid #1e40af', padding: '20px', borderRadius: '16px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                            <div className="section-header" style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                                <img src={selectedItem.image} style={{ width: 60, height: 60, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0 }}>{selectedItem.name}</h3>
                                    <span style={{ color: 'var(--primary-blue)', fontWeight: 600 }}>{rupiah(selectedItem.price)}</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', background: 'white', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                                    <button className="btn-ghost" onClick={() => setQty(Math.max(1, qty - 1))} style={{ padding: '0.5rem', border: 'none', color: 'black', fontWeight: 'bold' }}>-</button>
                                    <input type="number" value={qty} onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 40, background: 'transparent', border: 'none', textAlign: 'center', color: 'black', padding: 0, fontWeight: 'bold' }} />
                                    <button className="btn-ghost" onClick={() => setQty(qty + 1)} style={{ padding: '0.5rem', border: 'none', color: 'black', fontWeight: 'bold' }}>+</button>
                                </div>
                            </div>

                            <div style={{ marginBottom: 15 }}>
                                {(selectedItem.kategori === 'Makanan') && (
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: 13, color: 'black', display: 'block', marginBottom: 5, fontWeight: 600 }}>Tingkat Pedas</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {['Tidak Pedas', 'Sedang', 'Pedas'].map(opt => (
                                                <button key={opt} className={`btn ${notes.includes(opt) ? 'btn-primary' : 'btn-outline'}`} onClick={() => {
                                                    const newNotes = notes.filter(n => !['Tidak Pedas', 'Sedang', 'Pedas'].includes(n));
                                                    setNotes([...newNotes, opt]);
                                                }}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {['Coffee Series', 'Coconut Series', 'Matcha Series', 'Chocolate Series'].includes(selectedItem.kategori) ? (
                                    <div style={{ display: 'flex', gap: '1rem', marginBottom: 10, alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ marginBottom: 15 }}>
                                                <label style={{ fontSize: 13, color: 'black', display: 'block', marginBottom: 5, fontWeight: 600 }}>Level Gula</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', gridAutoRows: '1fr' }}>
                                                    {['No Sugar', 'Less Sugar', 'Normal Sugar', 'Extra Sugar'].map(opt => (
                                                        <button key={opt} className={`btn ${notes.includes(opt) ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '11px', padding: '6px 4px', width: '100%', height: '100%' }} onClick={() => {
                                                            const newNotes = notes.filter(n => !['No Sugar', 'Less Sugar', 'Normal Sugar', 'Extra Sugar'].includes(n));
                                                            setNotes([...newNotes, opt]);
                                                        }}>{opt}</button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <label style={{ fontSize: 13, color: 'black', display: 'block', marginBottom: 5, fontWeight: 600 }}>Level Ice</label>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', gridAutoRows: '1fr' }}>
                                                    {['No Ice', 'Less Ice', 'Normal Ice', 'Extra Ice'].map(opt => (
                                                        <button key={opt} className={`btn ${notes.includes(opt) ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '11px', padding: '6px 4px', width: '100%', height: '100%' }} onClick={() => {
                                                            const newNotes = notes.filter(n => !['No Ice', 'Less Ice', 'Normal Ice', 'Extra Ice'].includes(n));
                                                            setNotes([...newNotes, opt]);
                                                        }}>{opt}</button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label style={{ fontSize: 13, color: 'black', display: 'block', marginBottom: 5, fontWeight: 600 }}>Add-on</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', gridAutoRows: '1fr' }}>
                                                {['Matcha Foam', 'Coconut Foam', 'Strawberry Foam', 'Cream Cheese', 'Coffee Foam'].map(opt => {
                                                    const addonObj = items.find(i => i.name.toUpperCase() === opt.toUpperCase() && i.kategori === 'Add-on');
                                                    const addonPrice = addonObj ? addonObj.price : 10000;

                                                    return (
                                                        <button key={opt} className={`btn ${notes.includes(opt) ? 'btn-primary' : 'btn-outline'}`} style={{ fontSize: '11px', padding: '6px 4px', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: '1.2' }} onClick={() => {
                                                            if (notes.includes(opt)) {
                                                                setNotes(notes.filter(n => n !== opt));
                                                            } else {
                                                                setNotes([...notes, opt]);
                                                            }
                                                        }}>
                                                            <span>{opt}</span>
                                                            <span style={{ fontSize: '9px', marginTop: '4px', opacity: 0.9 }}>+{rupiah(addonPrice)}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                {(selectedItem.kategori === 'Snack') && (
                                    <div style={{ marginBottom: 10 }}>
                                        <label style={{ fontSize: 13, color: 'black', display: 'block', marginBottom: 5, fontWeight: 600 }}>Varian Rasa</label>
                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                            {['Original', 'Barbeque', 'Jagung', 'Balado'].map(opt => (
                                                <button key={opt} className={`btn ${notes.includes(opt) ? 'btn-primary' : 'btn-outline'}`} onClick={() => {
                                                    const newNotes = notes.filter(n => !['Original', 'Barbeque', 'Jagung', 'Balado'].includes(n));
                                                    setNotes([...newNotes, opt]);
                                                }}>{opt}</button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button className="btn btn-primary w-full" onClick={addToCart}>Tambahkan ke Pesanan</button>
                            <button className="btn btn-outline w-full" style={{ marginTop: '10px' }} onClick={() => setSelectedItem(null)}>Batal</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Cart Sidebar */}
            <div className="pos-right glass-panel">
                <div className="pos-right-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0, color: 'white' }}>Current Order</h3>
                    <span className="item-count" style={{ color: 'white' }}>{cart.reduce((a, c) => a + c.qty, 0)} items</span>
                </div>

                <div style={{ padding: '1rem', borderBottom: '1px solid var(--border-color)' }}>
                    {/* Customer Inputs */}
                    <input
                        placeholder="Nama Customer"
                        value={customerName}
                        onChange={e => setCustomerName(e.target.value)}
                        style={{ width: '100%', marginBottom: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)' }}
                    />
                    <select
                        value={tableNumber}
                        onChange={e => setTableNumber(e.target.value)}
                        style={{ width: '100%', marginBottom: '0.5rem', padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-main)' }}
                    >
                        <option value="">Pilih Nomor Meja</option>
                        {[...Array(20)].map((_, i) => (<option key={i + 1} value={i + 1}>Meja {i + 1}</option>))}
                    </select>

                    {/* Member */}
                    {member ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--secondary-blue)', padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)', color: 'white' }}>
                            <div>
                                <div style={{ fontWeight: 600 }}>{member.name}</div>
                                <div style={{ fontSize: '0.8rem' }}>{member.phoneNumber}</div>
                            </div>
                            <button
                                onClick={handleRemoveMember}
                                style={{
                                    background: '#ef4444',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: 'var(--radius-sm)',
                                    width: '28px',
                                    height: '28px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                    padding: 0
                                }}
                            >
                                ×
                            </button>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 5, width: '100%' }}>
                            <input
                                placeholder="Cari Member (No. HP)..."
                                value={memberQuery}
                                onChange={(e) => setMemberQuery(e.target.value)}
                                style={{ flex: 1, minWidth: 0, padding: '0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', background: 'white', color: 'black' }}
                            />
                            <button
                                className="btn btn-primary"
                                onClick={searchMember}
                                disabled={isSearchingMember}
                                style={{ flex: 'none', width: 'auto', padding: '0 15px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            >
                                <Search size={18} />
                            </button>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <button className={`btn w-full ${serviceType === 'dine-in' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setServiceType('dine-in')}>Dine In</button>
                        <button className={`btn w-full ${serviceType === 'take-away' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setServiceType('take-away')}>Take Away</button>
                    </div>
                </div>

                <div className="cart-body" style={{ padding: '3rem', background: 'white' }}>
                    {cart.length === 0 ? (
                        <div className="empty-cart">
                            <p>No items in order</p>
                        </div>
                    ) : (
                        <div className="cart-items">
                            {cart.map(item => (
                                <div key={item.id} className="cart-item-new">
                                    <div className="item-details">
                                        <span className="item-name">{item.name} {item.qty > 1 && <span className="qty-badge">x{item.qty}</span>}</span>
                                        {item.notes?.length > 0 && <span className="item-meta">{item.notes.join(', ')}</span>}
                                        <span className="item-price">{rupiah(item.total)}</span>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        style={{
                                            background: '#fee2e2',
                                            color: '#ef4444',
                                            border: '1px solid #fca5a5',
                                            borderRadius: 'var(--radius-sm)',
                                            width: '28px',
                                            height: '28px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            flexShrink: 0,
                                            fontWeight: 'bold',
                                            fontSize: '16px'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="cart-footer">
                    <div className="summary-row">
                        <span>Subtotal</span>
                        <span>{rupiah(subtotal)}</span>
                    </div>
                    {member && (
                        <div className="summary-row">
                            <span>Diskon {categoryName} ({discountRate}%)</span>
                            <span>-{rupiah(discountMember)}</span>
                        </div>
                    )}
                    <div className="summary-row">
                        <span>Service Charge (3%)</span>
                        <span>{rupiah(serviceChargeAmt)}</span>
                    </div>
                    <div className="summary-row">
                        <span>PB1 (10%)</span>
                        <span>{rupiah(ppn)}</span>
                    </div>

                    <div className="summary-row total">
                        <span>Total Tagihan</span>
                        <span>{rupiah(grandTotal)}</span>
                    </div>

                    <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                        {['qris', 'edc'].map(m => (
                            <button key={m} className={`btn w-full ${paymentMethod === m ? 'btn-primary' : 'btn-outline'}`} onClick={() => setPaymentMethod(m)}>{m.toUpperCase()}</button>
                        ))}
                    </div>

                    <button className="btn btn-primary checkout-btn" onClick={handleCheckout} disabled={cart.length === 0}>
                        PROSES BAYAR
                    </button>
                </div>
            </div>

            {/* Success Print Popup Modal */}
            {successReceipt && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 52, 96, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div className="animate-fade-in" style={{
                        background: '#ffffff', padding: '30px 40px', borderRadius: 20, width: '90%', maxWidth: 450,
                        border: '1px solid #cbd5e1', boxShadow: '0 15px 35px rgba(0,0,0,0.15)', textAlign: 'center'
                    }}>
                        <div style={{ background: '#dcfce7', color: '#22c55e', width: 70, height: 70, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 36 }}>
                            ✓
                        </div>
                        <h3 style={{ color: '#0f3460', fontSize: 24, fontWeight: 'bold', margin: '0 0 10px 0' }}>
                            Transaksi Berhasil!
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: 25, fontSize: 16 }}>
                            Struk asli telah dikirim ke printer. Apakah Anda ingin mencetak struk kedua (Copy)?
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '15px' }}>
                            <button
                                onClick={() => {
                                    const isAndroid = /android/i.test(navigator.userAgent);
                                    if (isAndroid) {
                                        const plainText = generatePlainTextReceipt(successReceipt, true);
                                        const base64Data = btoa(plainText);
                                        printKeRawBT(base64Data);
                                    } else {
                                        printReceipt(successReceipt, true);
                                    }
                                }}
                                style={{
                                    padding: '16px', background: 'var(--primary-blue)', color: '#fff', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                }}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
                                PRINT COPY
                            </button>

                            <button
                                onClick={() => setSuccessReceipt(null)}
                                style={{
                                    padding: '14px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 12, cursor: 'pointer', fontWeight: 'bold', fontSize: 15
                                }}
                            >
                                SELESAI
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
