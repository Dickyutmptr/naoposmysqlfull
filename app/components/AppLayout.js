import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export const AppLayout = ({ children, activePage, setActivePage, handleLogout, user }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    return (
        <div className="padel-theme-active">
            <div className="app-layout">
                {isSidebarOpen && <Sidebar activePage={activePage} setActivePage={setActivePage} handleLogout={handleLogout} user={user} />}
                <div className="main-content">
                    <Header activePageName={activePage} user={user} toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
                    <main className="page-container">
                        {children}
                    </main>
                </div>
            </div>
        </div>
    );
};
