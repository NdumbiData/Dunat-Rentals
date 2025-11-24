'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Car, Expense, ServiceRecord } from '@prisma/client';
import { addExpense, deleteExpense, addServiceRecord, deleteServiceRecord } from '@/app/actions/expenses';
// We need actions for Service Records too if we want to add them here.
// Currently `fleet.ts` handles `addCar` but `editCar` handles service history?
// No, `fleet.ts` doesn't seem to have `addServiceRecord`.
// I need to check `fleet.ts` or create a new action.
// The user wants to "key in amounts related to service".
// I should probably create `addServiceRecord` in `src/app/actions/fleet.ts` or `expenses.ts`.
// I'll add it to `expenses.ts` for cohesion with this module.

type Tab = 'General' | 'Admin' | 'Fuel' | 'Garage' | 'Bodyshop';

interface MaintenanceClientProps {
    initialCars: Car[];
    initialExpenses: (Expense & { car: Car })[];
    initialServiceRecords: (ServiceRecord & { car: Car })[];
}

export default function MaintenanceClient({ initialCars, initialExpenses, initialServiceRecords }: MaintenanceClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('General');
    const [selectedCarId, setSelectedCarId] = useState<string>('ALL');

    // Data State
    const [expenses, setExpenses] = useState(initialExpenses);
    const [serviceRecords, setServiceRecords] = useState(initialServiceRecords);

    useEffect(() => {
        setExpenses(initialExpenses);
    }, [initialExpenses]);

    useEffect(() => {
        setServiceRecords(initialServiceRecords);
    }, [initialServiceRecords]);

    // Filter Logic
    const filteredExpenses = expenses.filter(e => {
        const matchesCar = selectedCarId === 'ALL' || e.carId === selectedCarId;
        const matchesType = activeTab === 'General' ? true :
            activeTab === 'Admin' ? e.type === 'Other' : // Assuming Admin = Other for now
                activeTab === 'Fuel' ? e.type === 'Fuel' :
                    false; // Garage/Bodyshop are ServiceRecords, not Expenses
        return matchesCar && matchesType;
    });

    const filteredServiceRecords = serviceRecords.filter(s => {
        const matchesCar = selectedCarId === 'ALL' || s.carId === selectedCarId;
        const matchesType = activeTab === 'General' ? true :
            activeTab === 'Garage' ? s.type !== 'Bodyshop' : // Assuming Garage is default service
                activeTab === 'Bodyshop' ? s.type === 'Bodyshop' :
                    false;
        return matchesCar && matchesType;
    });

    // Summary Calculations
    const totalCost = [...filteredExpenses, ...filteredServiceRecords].reduce((sum, item) => {
        return sum + ('amount' in item ? item.amount : item.cost);
    }, 0);

    // Highest/Least Service Amount (based on ServiceRecords)
    const serviceCosts = filteredServiceRecords.map(s => s.cost);
    const highestService = serviceCosts.length > 0 ? Math.max(...serviceCosts) : 0;
    const leastService = serviceCosts.length > 0 ? Math.min(...serviceCosts) : 0;


    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addType, setAddType] = useState<'Expense' | 'Service'>('Expense');

    const handleExport = (format: 'csv' | 'pdf') => {
        // Mock export for now
        alert(`Exporting to ${format.toUpperCase()}... (Feature coming soon)`);
    };

    const handleDeleteExpense = async (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            const result = await deleteExpense(id);
            alert(result.message);
            if (result.success) {
                router.refresh();
            }
        }
    };

    const handleDeleteServiceRecord = async (id: string) => {
        if (confirm('Are you sure you want to delete this service record?')) {
            const result = await deleteServiceRecord(id);
            alert(result.message);
            if (result.success) {
                router.refresh();
            }
        }
    };

    if (!user) return null;

    return (
        <main className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Maintenance & Expenses</h2>
                        <p className="text-gray-500">Track fleet maintenance, fuel, and operational costs.</p>
                    </div>
                    <div className="flex gap-4">
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setIsAddModalOpen(true)}>+ Add Record</button>
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleExport('csv')}>Export CSV</button>
                        <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors" onClick={() => handleExport('pdf')}>Export PDF</button>
                    </div>
                </header>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-blue-500">
                        <div className="text-gray-500 text-sm">Total Cost (Selected View)</div>
                        <div className="text-2xl font-bold text-gray-800">KES {totalCost.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-red-500">
                        <div className="text-gray-500 text-sm">Highest Service Cost</div>
                        <div className="text-2xl font-bold text-gray-800">KES {highestService.toLocaleString()}</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-green-500">
                        <div className="text-gray-500 text-sm">Least Service Cost</div>
                        <div className="text-2xl font-bold text-gray-800">KES {leastService.toLocaleString()}</div>
                    </div>
                </div>

                {/* Filters & Tabs */}
                <div className="mb-6 flex justify-between items-center">
                    <div className="flex gap-2">
                        {(['General', 'Admin', 'Fuel', 'Garage', 'Bodyshop'] as Tab[])
                            .filter(tab => user?.role === 'Admin' || tab !== 'Admin')
                            .map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                    </div>
                    <select
                        className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white min-w-[200px]"
                        value={selectedCarId}
                        onChange={(e) => setSelectedCarId(e.target.value)}
                    >
                        <option value="ALL">All Vehicles</option>
                        {initialCars.map(car => (
                            <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                        ))}
                    </select>
                </div>

                {/* Content Area */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <h3 className="text-xl font-bold text-gray-800">
                            {activeTab} Records
                        </h3>
                    </div>

                    {/* Table */}
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Vehicle</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Description / Garage</th>
                                <th className="p-4 font-semibold">Amount</th>
                                <th className="p-4 font-semibold">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {/* Render Expenses */}
                            {(activeTab === 'General' || activeTab === 'Admin' || activeTab === 'Fuel') && filteredExpenses.map(e => (
                                <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600">{e.date}</td>
                                    <td className="p-4 text-gray-800 font-medium">{e.car.make} {e.car.model}</td>
                                    <td className="p-4 text-gray-600">{e.type}</td>
                                    <td className="p-4 text-gray-600">{e.description}</td>
                                    <td className="p-4 font-bold text-gray-800">KES {e.amount.toLocaleString()}</td>
                                    <td className="p-4">
                                        <button
                                            className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                                            onClick={() => handleDeleteExpense(e.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* Render Service Records */}
                            {(activeTab === 'General' || activeTab === 'Garage' || activeTab === 'Bodyshop') && filteredServiceRecords.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600">{s.date}</td>
                                    <td className="p-4 text-gray-800 font-medium">{s.car.make} {s.car.model}</td>
                                    <td className="p-4 text-gray-600">{s.type}</td>
                                    <td className="p-4 text-gray-600">{s.garageName} ({s.description})</td>
                                    <td className="p-4 font-bold text-gray-800">KES {s.cost.toLocaleString()}</td>
                                    <td className="p-4">
                                        <button
                                            className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                                            onClick={() => handleDeleteServiceRecord(s.id)}
                                        >
                                            Delete
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && filteredServiceRecords.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">
                                        No records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Add Record Modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
                            <h3 className="text-2xl font-bold text-gray-800 mb-6">Add New Record</h3>

                            <div className="flex gap-4 mb-6">
                                <button
                                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${addType === 'Expense' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    onClick={() => setAddType('Expense')}
                                >
                                    Expense (Fuel/Admin)
                                </button>
                                <button
                                    className={`flex-1 py-2 rounded-lg font-medium transition-colors ${addType === 'Service' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                    onClick={() => setAddType('Service')}
                                >
                                    Service (Garage/Bodyshop)
                                </button>
                            </div>

                            {addType === 'Expense' ? (
                                <form action={async (formData) => {
                                    const result = await addExpense(null, formData);
                                    if (result.success) {
                                        alert(result.message);
                                        setIsAddModalOpen(false);
                                        router.refresh();
                                    } else {
                                        alert(result.message);
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                        <select name="carId" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                            <option value="">Select Vehicle</option>
                                            {initialCars.map(car => (
                                                <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input type="date" name="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required defaultValue={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select name="type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                            <option value="Fuel">Fuel</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Car Wash">Car Wash</option>
                                            <option value="Other">Other (Admin)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                                        <input type="number" name="amount" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea name="description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required placeholder="e.g. Shell Station, Office Rent..."></textarea>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Expense</button>
                                    </div>
                                </form>
                            ) : (
                                <form action={async (formData) => {
                                    const result = await addServiceRecord(null, formData);
                                    if (result.success) {
                                        alert(result.message);
                                        setIsAddModalOpen(false);
                                        router.refresh();
                                    } else {
                                        alert(result.message);
                                    }
                                }} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                        <select name="carId" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                            <option value="">Select Vehicle</option>
                                            {initialCars.map(car => (
                                                <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input type="date" name="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required defaultValue={new Date().toISOString().split('T')[0]} />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select name="type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                            <option value="Oil">Oil Change</option>
                                            <option value="Gearbox">Gearbox</option>
                                            <option value="Bodyshop">Bodyshop</option>
                                            <option value="Tyres">Tyres</option>
                                            <option value="Other">Other</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Garage Name</label>
                                        <input type="text" name="garageName" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required placeholder="e.g. AutoFix Garage" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Cost (KES)</label>
                                        <input type="number" name="cost" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0" step="0.01" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Parts Replaced (Optional)</label>
                                        <input type="text" name="partsReplaced" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="e.g. Oil Filter, Brake Pads" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                        <textarea name="description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required placeholder="Details of service..."></textarea>
                                    </div>
                                    <div className="flex gap-4 pt-4">
                                        <button type="button" className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                                        <button type="submit" className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Save Service Record</button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
