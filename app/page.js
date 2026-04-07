'use client';

import { useState } from 'react';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Dashboard from './components/Dashboard';
import History from './components/History';
import KitchenBar from './components/KitchenBar';
import Members from './components/Members';
import Reports from './components/Reports';
import Login from './components/Login';
import ProductForm from './components/ProductForm';
import MenuManagement from './components/MenuManagement';
import UserManagement from './components/UserManagement';
import { AppLayout } from './components/AppLayout';

export default function Home() {
    const [user, setUser] = useState(null); // { id, username, role, name }
    const [view, setView] = useState('pos');
    const [showAccessDenied, setShowAccessDenied] = useState(false);

    // Access Control Configuration
    const PERMISSIONS = {
        owner: ['pos', 'inventory', 'dashboard', 'history', 'report', 'kitchen-bar', 'members', 'menu-management', 'user-management'],
        admin: ['pos', 'inventory', 'dashboard', 'history', 'report', 'kitchen-bar', 'members', 'menu-management', 'user-management'],
        cashier: ['pos', 'history', 'members', 'report'],
        kitchen: ['kitchen-bar'],
        bar: ['kitchen-bar'],
        head_bar: ['pos', 'inventory', 'dashboard', 'history', 'report', 'kitchen-bar', 'members'],
        assisten_head: ['pos', 'inventory', 'dashboard', 'history', 'report', 'kitchen-bar', 'members']
    };

    const handleLogin = (userData) => {
        setUser(userData);
        // Redirect based on role
        if (userData.role === 'kitchen' || userData.role === 'bar') setView('kitchen-bar');
        else setView('pos');
    };

    const handleLogout = () => {
        setUser(null);
        setView('pos');
    };

    const changeView = (newView) => {
        if (!user) return;

        // Check Permission
        const allowedViews = PERMISSIONS[user.role] || [];
        if (allowedViews.includes(newView)) {
            setView(newView);
        } else {
            setShowAccessDenied(true);
        }
    };

    // If not logged in, show Login
    if (!user) {
        return <Login onLogin={handleLogin} />;
    }

    const renderView = () => {
        const goHome = () => {
            if (user?.role === 'kitchen' || user?.role === 'bar') setView('kitchen-bar');
            else setView('pos');
        };

        switch (view) {
            case 'pos': return <POS onHome={goHome} onHistory={() => setView('history')} user={user} />;
            case 'inventory': return <Inventory onHome={goHome} user={user} />;
            case 'dashboard': return <Dashboard onHome={goHome} onHistory={() => setView('history')} onPOS={() => setView('pos')} />;
            case 'history': return <History onHome={goHome} />;
            case 'report': return <Reports onHome={goHome} user={user} />;
            case 'kitchen-bar': return <KitchenBar onHome={goHome} user={user} />;
            case 'members': return <Members onHome={goHome} user={user} />;
            case 'menu-management': return <MenuManagement onHome={goHome} />;
            case 'user-management': return <UserManagement onHome={goHome} />;
            default: return null;
        }
    };

    return (
        <>
            <AppLayout activePage={view} setActivePage={changeView} handleLogout={handleLogout} user={user}>
                {renderView()}
            </AppLayout>

            {showAccessDenied && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(15, 52, 96, 0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                    backdropFilter: 'blur(4px)'
                }}>
                    <div style={{
                        background: '#ffffff', padding: 30, borderRadius: 16, width: '90%', maxWidth: 400,
                        border: '1px solid #cbd5e1', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center'
                    }}>
                        <div style={{ background: '#fef2f2', color: '#ef4444', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 32, fontWeight: 'bold' }}>
                            !
                        </div>
                        <h3 style={{ color: '#0f3460', fontSize: 20, fontWeight: 'bold', margin: '0 0 10px 0' }}>
                            Akses Ditolak
                        </h3>
                        <p style={{ color: '#64748b', marginBottom: 25, fontSize: 14 }}>
                            Maaf, Anda tidak memiliki izin untuk mengakses halaman ini.
                        </p>
                        <button
                            onClick={() => setShowAccessDenied(false)}
                            style={{ width: '100%', padding: '12px 15px', background: '#007bff', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', fontSize: 14 }}
                        >
                            TUTUP
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
