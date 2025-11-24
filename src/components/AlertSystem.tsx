'use client';

import { useState, useEffect } from 'react';

export default function AlertSystem() {
    const [notifications, setNotifications] = useState<{ id: number; message: string; type: 'sms' | 'email' }[]>([]);

    const sendAlert = (message: string, type: 'sms' | 'email') => {
        const id = Date.now();
        setNotifications(prev => [...prev, { id, message, type }]);

        // Auto dismiss
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // Expose sendAlert globally for demo purposes (in a real app, use Context)
    useEffect(() => {
        (window as any).sendAlert = sendAlert;
    }, []);

    return (
        <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem', zIndex: 1000 }}>
            {notifications.map(n => (
                <div key={n.id} className="card" style={{
                    padding: '1rem',
                    backgroundColor: 'var(--card)',
                    borderLeft: `4px solid ${n.type === 'sms' ? 'var(--info)' : 'var(--warning)'}`,
                    minWidth: '300px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.25rem' }}>{n.type === 'sms' ? '📱' : '📧'}</span>
                        <span style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>{n.type === 'sms' ? 'SMS Sent' : 'Email Sent'}</span>
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{n.message}</p>
                </div>
            ))}
        </div>
    );
}
