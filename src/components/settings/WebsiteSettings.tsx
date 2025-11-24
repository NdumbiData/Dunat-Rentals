'use client';

import { useState } from 'react';
import { updateSystemSettings } from '@/app/actions/settings';

interface WebsiteSettingsProps {
    settings: any;
}

export default function WebsiteSettings({ settings }: WebsiteSettingsProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        wpUrl: settings.wpUrl || '',
        wpUsername: settings.wpUsername || '',
        wpAppPassword: settings.wpAppPassword || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formDataToSend = new FormData();
        Object.entries(formData).forEach(([key, value]) => {
            formDataToSend.append(key, value);
        });

        // Server action expects (prevState, formData)
        const result = await updateSystemSettings(null, formDataToSend);

        if (result.success) {
            alert('Website settings updated successfully!');
        } else {
            alert(result.message || 'Failed to update settings.');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Website Integration</h3>
            <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                Connect to your WordPress website to automatically import booking inquiries.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="label">WordPress Site URL</label>
                    <input
                        type="url"
                        name="wpUrl"
                        className="input"
                        placeholder="https://www.dunatcarhire.co.ke"
                        value={formData.wpUrl}
                        onChange={handleChange}
                    />
                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                        The base URL of your WordPress site.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Username</label>
                        <input
                            type="text"
                            name="wpUsername"
                            className="input"
                            placeholder="admin"
                            value={formData.wpUsername}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <label className="label">Application Password</label>
                        <input
                            type="password"
                            name="wpAppPassword"
                            className="input"
                            placeholder="xxxx xxxx xxxx xxxx"
                            value={formData.wpAppPassword}
                            onChange={handleChange}
                        />
                        <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                            Generate this in WP Admin &gt; Users &gt; Profile.
                        </p>
                    </div>
                </div>

                <div style={{ paddingTop: '1rem', borderTop: '1px solid var(--border)', marginTop: '1rem' }}>
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Saving...' : 'Save Credentials'}
                    </button>

                    <button
                        type="button"
                        className="btn btn-outline"
                        onClick={async () => {
                            if (confirm('Run manual sync now?')) {
                                try {
                                    const res = await fetch('/api/sync', { method: 'POST' });
                                    const data = await res.json();
                                    alert(data.message || 'Sync finished');
                                } catch (e) {
                                    alert('Sync failed');
                                }
                            }
                        }}
                        style={{ marginLeft: '1rem' }}
                    >
                        Run Manual Sync
                    </button>
                </div>
            </form>
        </div>
    );
}
