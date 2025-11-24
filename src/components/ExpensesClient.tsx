'use client';

import { useState, useEffect, useActionState } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Car, Expense } from '@prisma/client';
import { useFormStatus } from 'react-dom';
import { addExpense, deleteExpense } from '@/app/actions/expenses';

interface ExpensesClientProps {
    initialExpenses: (Expense & { car: Car })[];
    cars: Car[];
}

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
            {pending ? 'Saving...' : 'Save Expense'}
        </button>
    );
}

export default function ExpensesClient({ initialExpenses, cars }: ExpensesClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [expenses, setExpenses] = useState<(Expense & { car: Car })[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [state, formAction] = useActionState(addExpense, initialState);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }
        if (user) {
            const myCarIds = user.role === 'Admin' ? cars.map(c => c.id) : cars.filter(c => c.ownerId === user.id).map(c => c.id);
            const myExpenses = initialExpenses.filter(e => myCarIds.includes(e.carId));
            setExpenses(myExpenses);
        }
    }, [user, router, initialExpenses, cars]);

    useEffect(() => {
        if (state.success) {
            setIsModalOpen(false);
            // Reset form logic if needed, or just rely on revalidation
            alert(state.message);
        }
    }, [state.success, state.message]);

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this expense?')) {
            const result = await deleteExpense(id);
            alert(result.message);
        }
    };

    if (!user) return null;

    return (
        <main className="flex min-h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 ml-64 p-8">
                <header className="mb-8 flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Expenses</h2>
                        <p className="text-gray-500">Track vehicle maintenance and operational costs.</p>
                    </div>
                    {user.role === 'Admin' && (
                        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors" onClick={() => setIsModalOpen(true)}>
                            + Add Expense
                        </button>
                    )}
                </header>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-600">
                            <tr>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Vehicle</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold">Amount</th>
                                {user.role === 'Admin' && <th className="p-4 font-semibold">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {expenses.map(expense => (
                                <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 text-gray-600">{expense.date}</td>
                                    <td className="p-4 text-gray-800 font-medium">{expense.car.make} {expense.car.model} ({expense.car.plate})</td>
                                    <td className="p-4 text-gray-600">{expense.type}</td>
                                    <td className="p-4 text-gray-600">{expense.description}</td>
                                    <td className="p-4 font-bold text-red-600">
                                        KES {expense.amount.toLocaleString()}
                                    </td>
                                    {user.role === 'Admin' && (
                                        <td className="p-4">
                                            <button
                                                className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50 transition-colors"
                                                onClick={() => handleDelete(expense.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {expenses.length === 0 && (
                        <div className="p-8 text-center text-gray-500">
                            No expenses recorded.
                        </div>
                    )}
                </div>

                {isModalOpen && (
                    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                        <div className="bg-white rounded-xl shadow-xl w-full max-w-lg relative p-6">
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <span className="text-2xl">&times;</span>
                            </button>
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Expense</h2>

                            <form action={formAction} className="space-y-4">
                                {state.message && !state.success && (
                                    <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">{state.message}</div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle</label>
                                    <select name="carId" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                        <option value="">Select a vehicle...</option>
                                        {cars
                                            .filter(car => user.role === 'Admin' || (user.role === 'Owner' && car.ownerId === user.id))
                                            .map(car => (
                                                <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                                            ))}
                                    </select>
                                    {state.errors?.carId && <p className="text-red-500 text-xs mt-1">{state.errors.carId}</p>}
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                                        <input name="date" type="date" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required defaultValue={new Date().toISOString().split('T')[0]} />
                                        {state.errors?.date && <p className="text-red-500 text-xs mt-1">{state.errors.date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select name="type" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required>
                                            <option value="Fuel">Fuel</option>
                                            <option value="Service">Service</option>
                                            <option value="Insurance">Insurance</option>
                                            <option value="Car Wash">Car Wash</option>
                                            <option value="Other">Other</option>
                                        </select>
                                        {state.errors?.type && <p className="text-red-500 text-xs mt-1">{state.errors.type}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount (KES)</label>
                                    <input name="amount" type="number" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required min="0" step="10" />
                                    {state.errors?.amount && <p className="text-red-500 text-xs mt-1">{state.errors.amount}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea name="description" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" required rows={3} placeholder="e.g. Full tank at Shell, Oil change..." />
                                    {state.errors?.description && <p className="text-red-500 text-xs mt-1">{state.errors.description}</p>}
                                </div>

                                <div className="pt-4">
                                    <SubmitButton />
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
