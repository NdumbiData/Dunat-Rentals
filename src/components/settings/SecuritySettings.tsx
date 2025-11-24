'use client';

import { useState } from 'react';
import { changePassword } from '@/app/actions/profile';

export default function SecuritySettings({ user }: { user: any }) {
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    async function handleSubmit(formData: FormData) {
        setMessage('');
        setError('');
        const result = await changePassword(null, formData);
        if (result.success) {
            setMessage(result.message);
            // Reset form manually or via ref if needed, but for now simple feedback is enough
        } else {
            setError(result.message);
        }
    }

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Security</h3>
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label className="label">Current Password</label>
                    <input name="currentPassword" type="password" className="input" required />
                </div>
                <div>
                    <label className="label">New Password</label>
                    <input name="newPassword" type="password" className="input" required minLength={6} />
                </div>
                <div>
                    <label className="label">Confirm New Password</label>
                    <input name="confirmPassword" type="password" className="input" required minLength={6} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Change Password</button>
                {message && <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</p>}
                {error && <p style={{ color: 'var(--destructive)', fontSize: '0.875rem' }}>{error}</p>}
            </form>
        </div>
    );
}
