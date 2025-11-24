'use client';

import { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { createBooking } from '@/app/actions/bookings';
import { Car } from '@prisma/client';

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
            {pending ? 'Creating Booking...' : 'Create Booking'}
        </button>
    );
}

export default function NewBookingModal({ isOpen, onClose, cars }: { isOpen: boolean; onClose: () => void; cars: Car[] }) {
    const [state, formAction] = useActionState(createBooking, initialState);
    const [showSuccess, setShowSuccess] = useState(false);

    // Filter only available cars or cars that can be booked (logic can be enhanced)
    // For now, show all cars, server validates availability
    const availableCars = cars.filter(c => c.status !== 'Maintenance');

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

    if (!isOpen) return null;

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

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>New Booking</h2>

                {showSuccess ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--success)' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                        <p style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>Booking Created Successfully!</p>
                    </div>
                ) : (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {state.message && !state.success && (
                            <div className="alert alert-error">
                                {state.message}
                            </div>
                        )}

                        {/* Customer Section */}
                        <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Customer Details</h3>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Full Name</label>
                                <input name="customerName" type="text" className="input" required placeholder="e.g. John Doe" />
                                {state.errors?.customerName && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{state.errors.customerName}</p>}
                            </div>
                        </div>

                        {/* Vehicle Section */}
                        <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Vehicle Selection</h3>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Select Car</label>
                                <select name="carId" className="input" required>
                                    <option value="">-- Choose a Vehicle --</option>
                                    {availableCars.map(car => (
                                        <option key={car.id} value={car.id}>
                                            {car.make} {car.model} ({car.plate}) - KES {car.dailyRate.toLocaleString()}/day
                                        </option>
                                    ))}
                                </select>
                                {state.errors?.carId && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{state.errors.carId}</p>}
                            </div>
                        </div>

                        {/* Schedule Section */}
                        <div style={{ backgroundColor: 'var(--background)', padding: '1rem', borderRadius: 'var(--radius)' }}>
                            <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#64748b', marginBottom: '0.75rem', textTransform: 'uppercase' }}>Schedule & Pricing</h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Start Date</label>
                                    <input
                                        name="startDate"
                                        type="datetime-local"
                                        className="input"
                                        required
                                        onChange={(e) => {
                                            // ... existing logic ...
                                            const newStart = e.target.value;
                                            const endDateInput = document.querySelector('input[name="endDate"]') as HTMLInputElement;
                                            if (newStart && endDateInput) {
                                                const startDateObj = new Date(newStart);
                                                const currentEndVal = endDateInput.value;
                                                if (!currentEndVal) {
                                                    const nextDay = new Date(startDateObj.getTime() + 24 * 60 * 60 * 1000);
                                                    const year = nextDay.getFullYear();
                                                    const month = String(nextDay.getMonth() + 1).padStart(2, '0');
                                                    const day = String(nextDay.getDate()).padStart(2, '0');
                                                    const hours = String(nextDay.getHours()).padStart(2, '0');
                                                    const minutes = String(nextDay.getMinutes()).padStart(2, '0');
                                                    endDateInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
                                                }
                                            }
                                        }}
                                    />
                                    {state.errors?.startDate && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{state.errors.startDate}</p>}
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>End Date</label>
                                    <input name="endDate" type="datetime-local" className="input" required />
                                    {state.errors?.endDate && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{state.errors.endDate}</p>}
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontSize: '0.875rem', fontWeight: '500' }}>Discount (KES/day)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>KES</span>
                                    <input name="discountPerDay" type="number" min="0" step="0.01" className="input" placeholder="0.00" style={{ paddingLeft: '3rem' }} />
                                </div>
                                {state.errors?.discountPerDay && <p style={{ color: 'var(--destructive)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{state.errors.discountPerDay}</p>}
                            </div>
                        </div>

                        <div style={{ marginTop: '0.5rem' }}>
                            <SubmitButton />
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
