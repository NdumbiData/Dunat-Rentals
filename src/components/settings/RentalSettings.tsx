'use client';

import { useState } from 'react';

export default function RentalSettings({ settings, onUpdate }: { settings: any, onUpdate: any }) {
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        const result = await onUpdate(null, formData);
        setMessage(result.message);
    }

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Rental Configuration</h3>
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                    <label className="label">Default Terms & Conditions</label>
                    <textarea
                        name="termsAndConditions"
                        defaultValue={settings?.termsAndConditions || ''}
                        className="input"
                        rows={10}
                        placeholder="Enter the default terms and conditions for rental contracts..."
                    />
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        These terms will appear on invoices and contracts.
                    </p>
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Save Changes</button>
                {message && <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</p>}
            </form>
        </div>
    );
}
