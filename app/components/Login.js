'use client';

import { useState } from 'react';

export default function Login({ onLogin }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            onLogin(data); // Pass user data to parent
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container" style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '100vh',
            background: '#0f3460',
            color: '#333333',
            fontFamily: "'Inter', sans-serif"
        }}>
            <style jsx global>{`
                @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&display=swap');
            `}</style>
            <form onSubmit={handleSubmit} style={{
                maxWidth: '400px',
                width: '100%',
                margin: '0 20px',
                textAlign: 'center',
                padding: '40px',
                background: '#9CD5FF',
                borderRadius: '28px',
                border: '1px solid #7bbbee',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.05)'
            }}>
                <h1 style={{
                    marginBottom: '10px',
                    fontSize: '48px',
                    color: '#ffffff',
                    fontFamily: "'Didot', 'Bodoni MT', 'Playfair Display', serif",
                    fontWeight: 700,
                    margin: 0
                }}>NAO POS</h1>

                <h3 style={{
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 300,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    fontSize: '14px',
                    marginTop: '5px',
                    marginBottom: '40px',
                    color: '#ffffff'
                }}>Login Access</h3>

                {error && (
                    <div style={{
                        background: 'rgba(239, 68, 68, 0.2)',
                        border: '1px solid #ef4444',
                        color: '#ef4444',
                        padding: 10,
                        borderRadius: 6,
                        marginBottom: 20,
                        fontSize: 14,
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                <div style={{ marginBottom: '15px' }}>
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#000000',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#38bdf8';
                            e.target.style.boxShadow = '0 0 0 1px #38bdf8';
                            e.target.style.background = '#f8fafc';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                            e.target.style.background = '#ffffff';
                        }}
                    />
                </div>

                <div style={{ marginBottom: '30px' }}>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{
                            width: '100%',
                            padding: '14px 16px',
                            background: '#ffffff',
                            border: '1px solid #e2e8f0',
                            color: '#000000',
                            borderRadius: '8px',
                            fontSize: '14px',
                            outline: 'none',
                            transition: 'all 0.3s'
                        }}
                        onFocus={(e) => {
                            e.target.style.borderColor = '#38bdf8';
                            e.target.style.boxShadow = '0 0 0 1px #38bdf8';
                            e.target.style.background = '#f8fafc';
                        }}
                        onBlur={(e) => {
                            e.target.style.borderColor = '#e2e8f0';
                            e.target.style.boxShadow = 'none';
                            e.target.style.background = '#ffffff';
                        }}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: '100%',
                        padding: '14px 16px',
                        background: '#0f3460',
                        color: '#ffffff',
                        fontWeight: 700,
                        border: '1px solid #0a2444',
                        borderRadius: '8px',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        opacity: loading ? 0.7 : 1,
                        fontSize: '12px',
                        letterSpacing: '1px',
                        textTransform: 'uppercase',
                        transition: 'transform 0.2s, background 0.2s',
                        boxShadow: '0 4px 12px rgba(15, 52, 96, 0.4)'
                    }}
                    onMouseOver={(e) => {
                        if (!loading) {
                            e.target.style.transform = 'translateY(-2px)';
                            e.target.style.background = '#007bff';
                        }
                    }}
                    onMouseOut={(e) => {
                        if (!loading) {
                            e.target.style.transform = 'translateY(0)';
                            e.target.style.background = '#0f3460';
                        }
                    }}
                >
                    {loading ? 'Authenticating...' : 'Masuk'}
                </button>
            </form>
        </div>
    );
}
