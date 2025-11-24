'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { editCar } from '@/app/actions/fleet';
import { Car } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';

const initialState = {
    success: false,
    message: '',
    errors: {},
};

function SubmitButton() {
    const { pending } = useFormStatus();

    return (
        <button
            type="submit"
            disabled={pending}
            className="btn btn-primary"
            style={{ width: '100%', opacity: pending ? 0.7 : 1 }}
        >
            {pending ? 'Updating Car...' : 'Update Car'}
        </button>
    );
}

export default function EditCarModal({ isOpen, onClose, car, owners = [] }: { isOpen: boolean; onClose: () => void; car: Car | null; owners?: { id: string; name: string; email?: string }[] }) {
    const { user } = useAuth();
    const [state, formAction] = useActionState(editCar, initialState);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        if (state.success) {
            setShowSuccess(true);
            const timer = setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [state.success, onClose]);

    if (!isOpen || !car) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        fontSize: '1.5rem',
                        cursor: 'pointer',
                        color: '#94a3b8'
                    }}
                >
                    &times;
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Edit Car</h2>

                {showSuccess ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--success)' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>✓ Car Updated!</p>
                    </div>
                ) : (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="hidden" name="id" value={car.id} />

                        {state.message && !state.success && (
                            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                {state.message}
                            </div>
                        )}

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Make</label>
                                <input name="make" type="text" className="input" defaultValue={car.make} required />
                                {state.errors?.make && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.make}</p>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Model</label>
                                <input name="model" type="text" className="input" defaultValue={car.model} required />
                                {state.errors?.model && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.model}</p>}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Year</label>
                                <input name="year" type="number" className="input" defaultValue={car.year} required min="1900" max={new Date().getFullYear() + 1} />
                                {state.errors?.year && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.year}</p>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>License Plate</label>
                                <input name="plate" type="text" className="input" defaultValue={car.plate} required />
                                {state.errors?.plate && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.plate}</p>}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Category</label>
                            <select name="category" className="input" defaultValue={car.category} required>
                                <option value="Sedan">Sedan</option>
                                <option value="Mid-SUV">Mid-SUV</option>
                                <option value="Full SUV">Full SUV</option>
                                <option value="Commercial">Commercial</option>
                            </select>
                            {state.errors?.category && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.category}</p>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Daily Rate (KES)</label>
                                <input name="dailyRate" type="number" className="input" defaultValue={car.dailyRate} required min="0" />
                                {state.errors?.dailyRate && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.dailyRate}</p>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Status</label>
                                <select name="status" className="input" defaultValue={car.status} required>
                                    <option value="Available">Available</option>
                                    <option value="Rented">Rented</option>
                                    <option value="Maintenance">Maintenance</option>
                                </select>
                                {state.errors?.status && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.status}</p>}
                            </div>
                        </div>

                        {user?.role === 'Admin' && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Assign Owner (Optional)</label>
                                <select name="ownerId" className="input" defaultValue={car.ownerId || ''}>
                                    <option value="">-- Select Owner --</option>
                                    {owners.map(owner => (
                                        <option key={owner.id} value={owner.id}>{owner.name} ({owner.email})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Update Image (Optional)</label>
                            <input name="image" type="file" accept="image/*" className="input" />
                        </div>

                        <div style={{ marginTop: '1rem' }}>
                            <SubmitButton />
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
