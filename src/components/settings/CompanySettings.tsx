'use client';

import { useState } from 'react';

export default function CompanySettings({ settings, onUpdate }: { settings: any, onUpdate: any }) {
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        const result = await onUpdate(null, formData);
        setMessage(result.message);
    }

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Company Information</h3>
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label className="label">Company Name</label>
                    <input name="companyName" defaultValue={settings?.companyName} className="input" required />
                </div>
                <div>
                    <label className="label">Company Email</label>
                    <input name="companyEmail" defaultValue={settings?.companyEmail || ''} className="input" type="email" />
                </div>
                <div>
                    <label className="label">Phone Number</label>
                    <input name="companyPhone" defaultValue={settings?.companyPhone || ''} className="input" />
                </div>
                <div>
                    <label className="label">Address</label>
                    <textarea name="companyAddress" defaultValue={settings?.companyAddress || ''} className="input" rows={3} />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Save Changes</button>
                {message && <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</p>}
            </form>
        </div>
    );
}
