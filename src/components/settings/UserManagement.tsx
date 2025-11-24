'use client';

import { useState } from 'react';
import { User } from '@prisma/client';

export default function UserManagement({ users, onUpdateRole }: { users: User[], onUpdateRole: any }) {
    const [message, setMessage] = useState('');

    async function handleRoleChange(userId: string, newRole: string) {
        if (confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            const result = await onUpdateRole(userId, newRole);
            setMessage(result.message);
            // In a real app, we'd optimistically update the UI or re-fetch
            window.location.reload(); // Simple reload for now
        }
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>User Management</h3>
                <button className="btn btn-primary" onClick={() => alert('Invite flow coming soon!')}>+ Invite User</button>
            </div>

            {message && <p style={{ color: 'var(--success)', marginBottom: '1rem' }}>{message}</p>}

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ backgroundColor: '#f1f5f9' }}>
                    <tr>
                        <th style={{ padding: '0.75rem' }}>Name</th>
                        <th style={{ padding: '0.75rem' }}>Email</th>
                        <th style={{ padding: '0.75rem' }}>Role</th>
                        <th style={{ padding: '0.75rem' }}>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '0.75rem' }}>{user.name}</td>
                            <td style={{ padding: '0.75rem' }}>{user.email}</td>
                            <td style={{ padding: '0.75rem' }}>
                                <span className={`badge badge-${user.role === 'Admin' ? 'primary' : 'secondary'}`}>
                                    {user.email === 'admin@rentals.com' ? 'SuperAdmin' : user.role === 'Admin' ? 'Fleet Manager' : 'Car Owner'}
                                </span>
                            </td>
                            <td style={{ padding: '0.75rem' }}>
                                {user.email !== 'admin@rentals.com' && (
                                    <select
                                        className="input"
                                        style={{ padding: '0.25rem', fontSize: '0.875rem' }}
                                        value={user.role}
                                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                    >
                                        <option value="Admin">Fleet Manager</option>
                                        <option value="Owner">Car Owner</option>
                                    </select>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
