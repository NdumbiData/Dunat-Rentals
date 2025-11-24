'use client';

import { useState } from 'react';

export default function AppearanceSettings() {
    // Mock state for now, would connect to a ThemeContext in a real app
    const [theme, setTheme] = useState('light');

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Appearance</h3>
            <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                    onClick={() => setTheme('light')}
                    style={{
                        padding: '1rem',
                        border: theme === 'light' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: '#fff',
                        color: '#000',
                        cursor: 'pointer',
                        width: '100px',
                        textAlign: 'center'
                    }}
                >
                    Light
                </button>
                <button
                    onClick={() => setTheme('dark')}
                    style={{
                        padding: '1rem',
                        border: theme === 'dark' ? '2px solid var(--primary)' : '1px solid var(--border)',
                        borderRadius: 'var(--radius)',
                        backgroundColor: '#1e293b',
                        color: '#fff',
                        cursor: 'pointer',
                        width: '100px',
                        textAlign: 'center'
                    }}
                >
                    Dark
                </button>
            </div>
            <p style={{ marginTop: '1rem', color: '#94a3b8', fontSize: '0.875rem' }}>
                Note: Theme switching is currently simulated. Global theme support coming soon.
            </p>
        </div>
    );
}
