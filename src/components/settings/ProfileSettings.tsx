'use client';

import { useState } from 'react';
import { updateProfile } from '@/app/actions/profile';

export default function ProfileSettings({ user }: { user: any }) {
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        const result = await updateProfile(null, formData);
        setMessage(result.message);
    }

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Profile Settings</h3>
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label className="label">Name</label>
                    <input name="name" defaultValue={user.name} className="input" required />
                </div>
                <div>
                    <label className="label">Email</label>
                    <input name="email" defaultValue={user.email} className="input" type="email" required />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Save Changes</button>
                {message && <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</p>}
            </form>
        </div>
    );
}
