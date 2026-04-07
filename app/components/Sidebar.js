import React from 'react';
import { Home, ShoppingBag, PieChart, Clock, Users, Settings, LogOut, Coffee, FileText, UserCog } from 'lucide-react';

export const Sidebar = ({ activePage, setActivePage, handleLogout, user }) => {
    // Menu definitions mapping to Nao-POS views
    const menus = [
        { id: 'pos', label: 'POS System', icon: <ShoppingBag size={20} />, active: ['pos'] },
        { id: 'inventory', label: 'Inventory', icon: <PieChart size={20} />, active: ['inventory'] },
        { id: 'dashboard', label: 'Dashboard', icon: <Home size={20} />, active: ['dashboard'] },
        { id: 'history', label: 'Riwayat', icon: <Clock size={20} />, active: ['history'] },
        { id: 'report', label: 'Laporan', icon: <FileText size={20} />, active: ['report'] },
        { id: 'members', label: 'Members', icon: <Users size={20} />, active: ['members'] },
        { id: 'kitchen-bar', label: 'Kitchen / Bar', icon: <Coffee size={20} />, active: ['kitchen-bar'] },
    ];

    if (user?.role === 'admin' || user?.role === 'owner') {
        menus.push({ id: 'menu-management', label: 'Management Menu', icon: <Settings size={20} />, active: ['menu-management'] });
        menus.push({ id: 'user-management', label: 'Management User', icon: <UserCog size={20} />, active: ['user-management'] });
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header">
                <div className="logo-icon">N</div>
                <h2>Nao POS</h2>
            </div>
            <nav className="sidebar-nav" style={{ overflowY: 'auto', flex: 1 }}>
                {menus.map((menu) => (
                    <button
                        key={menu.id}
                        className={`nav-item ${menu.active.includes(activePage) ? 'active' : ''}`}
                        onClick={() => setActivePage(menu.id)}
                    >
                        {menu.icon}
                        <span>{menu.label}</span>
                    </button>
                ))}
            </nav>
            <div className="sidebar-footer" style={{ marginTop: 'auto', paddingTop: '15px' }}>
                <button className="nav-item logout" onClick={handleLogout} style={{ width: '100%', marginBottom: '10px' }}>
                    <LogOut size={20} />
                    <span>Log Out</span>
                </button>
                <div style={{ textAlign: 'center', fontSize: '11px', color: 'rgba(255, 255, 255, 0.5)' }}>
                    &copy; {new Date().getFullYear()} DUP
                </div>
            </div>
        </aside>
    );
};
