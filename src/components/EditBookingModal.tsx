'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { updateBooking } from '@/app/actions/bookings';
import { Booking, Car } from '@prisma/client';

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
            {pending ? 'Updating Booking...' : 'Update Booking'}
        </button>
    );
}

export default function EditBookingModal({ isOpen, onClose, booking, cars }: { isOpen: boolean; onClose: () => void; booking: Booking | null; cars: Car[] }) {
    const [state, formAction] = useActionState(updateBooking, initialState);
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

    if (!isOpen || !booking) return null;

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
            <div className="card" style={{ width: '100%', maxWidth: '500px', position: 'relative' }}>
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

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Edit Booking</h2>

                {showSuccess ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--success)' }}>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>✓ Booking Updated!</p>
                    </div>
                ) : (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="hidden" name="id" value={booking.id} />

                        {state.message && !state.success && (
                            <div style={{ padding: '0.75rem', backgroundColor: '#fee2e2', color: '#ef4444', borderRadius: '0.5rem', fontSize: '0.875rem' }}>
                                {state.message}
                            </div>
                        )}

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Customer Name</label>
                            <input name="customerName" type="text" className="input" defaultValue={booking.customerName} required />
                            {state.errors?.customerName && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.customerName}</p>}
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Select Car</label>
                            <select name="carId" className="input" defaultValue={booking.carId} required>
                                {cars.map(car => (
                                    <option key={car.id} value={car.id}>
                                        {car.make} {car.model} ({car.plate})
                                    </option>
                                ))}
                            </select>
                            {state.errors?.carId && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.carId}</p>}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Start Date & Time</label>
                                <input name="startDate" type="datetime-local" className="input" defaultValue={booking.startDate} required />
                                {state.errors?.startDate && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.startDate}</p>}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>End Date & Time</label>
                                <input name="endDate" type="datetime-local" className="input" defaultValue={booking.endDate} required />
                                {state.errors?.endDate && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.endDate}</p>}
                            </div>
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Discount (KES/day)</label>
                            <input name="discountPerDay" type="number" min="0" step="0.01" className="input" defaultValue={booking.discountPerDay} placeholder="0" />
                            {state.errors?.discountPerDay && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem' }}>{state.errors.discountPerDay}</p>}
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
