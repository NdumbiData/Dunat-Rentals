'use client';

import { useState } from 'react';

export default function NotificationSettings() {
    const [emailAlerts, setEmailAlerts] = useState(true);
    const [systemAlerts, setSystemAlerts] = useState(true);

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Notifications</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: '500' }}>Email Alerts</p>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Receive notifications via email.</p>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <p style={{ fontWeight: '500' }}>System Alerts</p>
                        <p style={{ fontSize: '0.875rem', color: '#94a3b8' }}>Receive in-app notifications.</p>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={systemAlerts} onChange={(e) => setSystemAlerts(e.target.checked)} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>
            <style jsx>{`
                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 24px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background-color: #ccc;
                    transition: .4s;
                    border-radius: 34px;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 16px;
                    width: 16px;
                    left: 4px;
                    bottom: 4px;
                    background-color: white;
                    transition: .4s;
                    border-radius: 50%;
                }
                input:checked + .slider {
                    background-color: var(--primary);
                }
                input:checked + .slider:before {
                    transform: translateX(26px);
                }
            `}</style>
        </div>
    );
}
