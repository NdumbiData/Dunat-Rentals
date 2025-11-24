'use client';

import { useState, useRef } from 'react';
import { createInspection } from '@/app/actions/inspections';
import { useRouter } from 'next/navigation';

interface InspectionFormProps {
    bookingId: string;
    carName: string;
}

export default function InspectionForm({ bookingId, carName }: InspectionFormProps) {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [damagePoints, setDamagePoints] = useState<{ x: number; y: number; note?: string }[]>([]);
    const [fuelLevel, setFuelLevel] = useState(0.5);
    const [mileage, setMileage] = useState(0);
    const [type, setType] = useState('Check-out');
    const [notes, setNotes] = useState('');
    const imageRef = useRef<HTMLImageElement>(null);

    const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
        if (!imageRef.current) return;

        const rect = imageRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width;
        const y = (e.clientY - rect.top) / rect.height;

        setDamagePoints([...damagePoints, { x, y }]);
    };

    const handleRemovePoint = (index: number) => {
        setDamagePoints(damagePoints.filter((_, i) => i !== index));
    };

    const handleSubmit = async (formData: FormData) => {
        setIsSubmitting(true);
        formData.append('bookingId', bookingId);
        formData.append('damagePoints', JSON.stringify(damagePoints));

        // Append other controlled inputs if not in form (though they are)
        // But we need to ensure they are correct.
        // Actually, if we use name attributes, they are in formData.

        const result = await createInspection(null, formData);

        if (result.success) {
            alert('Inspection saved successfully!');
            router.push(`/bookings`); // Or back to booking details
        } else {
            alert(result.error || 'Failed to save inspection');
        }
        setIsSubmitting(false);
    };

    return (
        <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>
                Vehicle Inspection: {carName}
            </h2>

            <form action={handleSubmit} className="space-y-6">
                <input type="hidden" name="bookingId" value={bookingId} />

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="label">Inspection Type</label>
                        <select
                            name="type"
                            className="input"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                        >
                            <option value="Check-out">Check-out (Departure)</option>
                            <option value="Check-in">Check-in (Return)</option>
                        </select>
                    </div>
                    <div>
                        <label className="label">Current Mileage (km)</label>
                        <input
                            type="number"
                            name="mileage"
                            className="input"
                            required
                            min="0"
                            value={mileage}
                            onChange={(e) => setMileage(Number(e.target.value))}
                        />
                    </div>
                </div>

                <div>
                    <label className="label">Fuel Level: {(fuelLevel * 100).toFixed(0)}%</label>
                    <input
                        type="range"
                        name="fuelLevel"
                        min="0"
                        max="1"
                        step="0.05"
                        className="w-full"
                        value={fuelLevel}
                        onChange={(e) => setFuelLevel(Number(e.target.value))}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b' }}>
                        <span>Empty</span>
                        <span>1/4</span>
                        <span>1/2</span>
                        <span>3/4</span>
                        <span>Full</span>
                    </div>
                </div>

                <div>
                    <label className="label">Mark Damage (Click on diagram)</label>
                    <div style={{ position: 'relative', width: '100%', maxWidth: '600px', margin: '0 auto' }}>
                        <img
                            ref={imageRef}
                            src="/car-outline.png"
                            alt="Car Diagram"
                            style={{ width: '100%', display: 'block', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}
                            onClick={handleImageClick}
                        />
                        {damagePoints.map((point, index) => (
                            <div
                                key={index}
                                style={{
                                    position: 'absolute',
                                    left: `${point.x * 100}%`,
                                    top: `${point.y * 100}%`,
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: 'red',
                                    borderRadius: '50%',
                                    transform: 'translate(-50%, -50%)',
                                    cursor: 'pointer',
                                    border: '2px solid white',
                                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                                }}
                                onClick={() => handleRemovePoint(index)}
                                title="Click to remove"
                            />
                        ))}
                    </div>
                    <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
                        {damagePoints.length} damage points marked. Click point to remove.
                    </p>
                </div>

                <div>
                    <label className="label">Upload Photos</label>
                    <input
                        type="file"
                        name="photos"
                        multiple
                        accept="image/*"
                        className="input"
                    />
                </div>

                <div>
                    <label className="label">Notes</label>
                    <textarea
                        name="notes"
                        className="input"
                        rows={3}
                        placeholder="Any additional observations..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                    ></textarea>
                </div>

                <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isSubmitting}
                >
                    {isSubmitting ? 'Saving...' : 'Save Inspection'}
                </button>
            </form>
        </div>
    );
}
