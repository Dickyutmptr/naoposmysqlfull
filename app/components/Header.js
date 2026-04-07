import React, { useState, useEffect } from 'react';
import { Search, Bell, User, Menu, AlertTriangle } from 'lucide-react';

export const Header = ({ activePageName = 'pos', user, toggleSidebar }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [alerts, setAlerts] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        
        const checkStock = async () => {
            try {
                const res = await fetch('/api/ingredients');
                const data = await res.json();
                if (Array.isArray(data)) {
                    // Filter ingredients with low stock
                    const lowStock = data.filter(i => {
                        const threshold = i.minStockThreshold > 0 ? i.minStockThreshold : 5; // Default threshold 5
                        return typeof i.stock === 'number' && i.stock <= threshold;
                    });
                    setAlerts(lowStock);
                }
            } catch (err) {
                console.error("Failed to check ingredient stock", err);
            }
        };

        checkStock();
        const stockTimer = setInterval(checkStock, 15000); // Check every 15s

        return () => {
            clearInterval(timer);
            clearInterval(stockTimer);
        };
    }, []);

    const formattedDate = currentTime.toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    const formattedTime = currentTime.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const getTitle = () => {
        switch (activePageName) {
            case 'pos': return 'Point of Sale';
            case 'inventory': return 'Inventory Management';
            case 'dashboard': return 'Dashboard';
            case 'history': return 'Transaction History';
            case 'members': return 'Member Management';
            case 'kitchen-bar': return 'Kitchen / Bar Monitor';
            case 'menu-management': return 'Menu Management';
            default: return 'Nao POS';
        }
    };

    return (
        <header className="header-layout">
            <div className="header-left" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '1rem' }}>
                {toggleSidebar && (
                    <button className="icon-btn" onClick={toggleSidebar} style={{ color: 'var(--primary-blue)' }}>
                        <Menu size={24} />
                    </button>
                )}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <h1 className="page-title">{getTitle()}</h1>
                    <div className="current-datetime">
                        <span className="date">{formattedDate}</span>
                        <span className="delimiter">•</span>
                        <span className="time">{formattedTime}</span>
                    </div>
                </div>
            </div>

            <div className="header-right">
                <div style={{ position: 'relative' }}>
                    <button className="icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                        <Bell size={20} />
                        {alerts.length > 0 && <span className="badge-alert">{alerts.length}</span>}
                    </button>
                    {showNotifications && (
                        <div style={{ position: 'absolute', top: '50px', right: '-10px', width: '320px', background: 'white', borderRadius: '12px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', zIndex: 100, padding: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '10px', marginBottom: '10px' }}>
                                <h4 style={{ margin: 0, color: '#0f3460', fontSize: '14px', fontWeight: 600 }}>Notifikasi Stok</h4>
                                {alerts.length > 0 && <span style={{ fontSize: '12px', background: '#ef4444', color: 'white', padding: '2px 8px', borderRadius: '10px' }}>{alerts.length} Item</span>}
                            </div>
                            
                            {alerts.length === 0 ? (
                                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center', margin: '20px 0' }}>Stok kondisi aman.</p>
                            ) : (
                                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {alerts.map(item => (
                                        <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', background: item.stock === 0 ? '#fee2e2' : '#fef3c7', borderRadius: '8px', padding: '10px' }}>
                                            <AlertTriangle size={18} color={item.stock === 0 ? '#ef4444' : '#d97706'} style={{ flexShrink: 0 }} />
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b' }}>{item.name}</div>
                                                <div style={{ fontSize: '11px', color: item.stock === 0 ? '#ef4444' : '#d97706', marginTop: '2px' }}>
                                                    {item.stock === 0 ? 'Stok Habis!' : `Sisa stok: ${item.stock} ${item.unit || ''}`}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="user-profile">
                    <div className="avatar">
                        <User size={20} />
                    </div>
                    <div className="user-info">
                        <span className="user-name">{user?.name || 'User'}</span>
                        <span className="user-role">{user?.role || 'Staff'}</span>
                    </div>
                </div>
            </div>
        </header>
    );
};
