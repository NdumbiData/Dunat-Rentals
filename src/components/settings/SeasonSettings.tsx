'use client';

import { useState, useEffect } from 'react';
import { createSeason, getSeasons, deleteSeason } from '@/app/actions/pricing';
import { Season } from '@prisma/client';

export default function SeasonSettings() {
    const [seasons, setSeasons] = useState<Season[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Form
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [multiplier, setMultiplier] = useState('1.0');

    const fetchSeasons = async () => {
        const data = await getSeasons();
        setSeasons(data);
        setLoading(false);
    };

    useEffect(() => {
        fetchSeasons();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData();
        formData.append('name', name);
        formData.append('startDate', startDate);
        formData.append('endDate', endDate);
        formData.append('priceMultiplier', multiplier);

        const result = await createSeason(formData);
        if (result.success) {
            alert("Season added!");
            setName('');
            setStartDate('');
            setEndDate('');
            setMultiplier('1.0');
            fetchSeasons();
        } else {
            alert(result.message);
        }
        setIsSubmitting(false);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Delete this season?")) {
            await deleteSeason(id);
            fetchSeasons();
        }
    };

    if (loading) return <div>Loading seasons...</div>;

    return (
        <div className="space-y-6">
            <div className="card">
                <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Dynamic Pricing (Seasons)</h3>
                <p style={{ color: '#64748b', marginBottom: '1.5rem' }}>
                    Define date ranges where prices should be multiplied (e.g., 1.5x for holidays).
                </p>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="label">Season Name</label>
                        <input
                            type="text"
                            className="input"
                            placeholder="e.g. December Holidays"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">Multiplier</label>
                        <input
                            type="number"
                            step="0.1"
                            className="input"
                            placeholder="e.g. 1.5"
                            value={multiplier}
                            onChange={e => setMultiplier(e.target.value)}
                            required
                        />
                        <p className="text-xs text-slate-400 mt-1">1.0 = Normal Price, 1.5 = +50%</p>
                    </div>
                    <div>
                        <label className="label">Start Date</label>
                        <input
                            type="date"
                            className="input"
                            value={startDate}
                            onChange={e => setStartDate(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="label">End Date</label>
                        <input
                            type="date"
                            className="input"
                            value={endDate}
                            onChange={e => setEndDate(e.target.value)}
                            required
                        />
                    </div>
                    <div className="md:col-span-2">
                        <button type="submit" className="btn btn-primary w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Adding...' : 'Add Season'}
                        </button>
                    </div>
                </form>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 text-sm">
                                <th className="p-3">Name</th>
                                <th className="p-3">Dates</th>
                                <th className="p-3">Multiplier</th>
                                <th className="p-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {seasons.length === 0 ? (
                                <tr><td colSpan={4} className="p-4 text-center text-slate-400">No seasons defined.</td></tr>
                            ) : (
                                seasons.map(season => (
                                    <tr key={season.id} className="border-b border-slate-100">
                                        <td className="p-3 font-medium">{season.name}</td>
                                        <td className="p-3">
                                            {new Date(season.startDate).toLocaleDateString()} - {new Date(season.endDate).toLocaleDateString()}
                                        </td>
                                        <td className="p-3 font-bold text-blue-600">x{season.priceMultiplier}</td>
                                        <td className="p-3 text-right">
                                            <button onClick={() => handleDelete(season.id)} className="text-red-600 hover:text-red-800 text-sm">
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
