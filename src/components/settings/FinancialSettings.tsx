'use client';

import { useState } from 'react';

export default function FinancialSettings({ settings, onUpdate }: { settings: any, onUpdate: any }) {
    const [message, setMessage] = useState('');

    async function handleSubmit(formData: FormData) {
        const result = await onUpdate(null, formData);
        setMessage(result.message);
    }

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>Financial Configuration</h3>
            <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label className="label">Currency Code</label>
                        <input name="currency" defaultValue={settings?.currency} className="input" required />
                    </div>
                    <div>
                        <label className="label">VAT Rate (%)</label>
                        <input name="vatRate" type="number" step="0.1" defaultValue={settings?.vatRate} className="input" required />
                    </div>
                </div>
                <div>
                    <label className="label">M-Pesa Paybill / Till Number</label>
                    <input name="mpesaPaybill" defaultValue={settings?.mpesaPaybill || ''} className="input" placeholder="e.g., Paybill 123456" />
                </div>
                <div>
                    <label className="label">Bank Account Details</label>
                    <textarea name="bankDetails" defaultValue={settings?.bankDetails || ''} className="input" rows={3} placeholder="Bank Name, Account Number, Branch" />
                </div>
                <button type="submit" className="btn btn-primary" style={{ width: 'fit-content' }}>Save Changes</button>
                {message && <p style={{ color: 'var(--success)', fontSize: '0.875rem' }}>{message}</p>}
            </form>
        </div>
    );
}
