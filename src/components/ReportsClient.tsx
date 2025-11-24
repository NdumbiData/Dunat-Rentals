'use client';

import { useState, useEffect, useMemo } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Payment, Car, ServiceRecord, Expense } from '@prisma/client';

// Extended type to include parsed service history
type CarWithService = Omit<Car, 'serviceHistory'> & {
    serviceHistory: (Omit<ServiceRecord, 'partsReplaced'> & { partsReplaced: string[] })[];
};

interface ReportsClientProps {
    payments: Payment[];
    cars: CarWithService[];
    expenses: Expense[];
    bookings: import('@prisma/client').Booking[];
}

export default function ReportsClient({ payments, cars, expenses, bookings }: ReportsClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [selectedCarId, setSelectedCarId] = useState<string>('All');
    const [timeRange, setTimeRange] = useState<'Monthly' | 'Yearly'>('Yearly');

    // State for the year being viewed
    const [viewYear, setViewYear] = useState<number>(new Date().getFullYear());

    useEffect(() => {
        if (!user) {
            router.push('/login');
        }
    }, [user, router]);

    // Auto-detect the year with data on mount
    useEffect(() => {
        if (payments.length > 0 || expenses.length > 0) {
            const paymentDates = payments.map(p => new Date(p.dueDate).getTime());
            const expenseDates = expenses.map(e => new Date(e.date).getTime());
            const allDates = [...paymentDates, ...expenseDates];

            if (allDates.length > 0) {
                const maxDate = new Date(Math.max(...allDates));
                setViewYear(maxDate.getFullYear());
            }
        }
    }, [payments, expenses]);

    const analyticsData = useMemo(() => {
        if (!user) return null;

        const currentYear = viewYear;
        const currentMonth = new Date().getMonth(); // Still use current month for "Monthly" view context if needed, or maybe we should track viewMonth too? 
        // For now, let's assume "Monthly" means "Months of the selected Year" if we want to be consistent, 
        // BUT the previous logic was "Current Month of Current Year". 
        // If the user wants to see data, and we switch to a year with data, "Monthly" might show nothing if we stick to "Current Month".
        // Let's stick to "Yearly" as the default view which shows the whole year.

        // 1. Filter Cars based on User Role
        let myCars = user.role === 'Admin' ? cars : cars.filter(c => c.ownerId === user.id);
        if (selectedCarId !== 'All') {
            myCars = myCars.filter(c => c.id === selectedCarId);
        }
        const myCarIds = myCars.map(c => c.id);

        // 2. Filter Payments based on Car and Time Range
        let filteredPayments = payments.filter(p => p.status === 'Paid');

        if (selectedCarId !== 'All') {
            // @ts-ignore
            filteredPayments = filteredPayments.filter(p => p.booking?.carId === selectedCarId);
        } else {
            // @ts-ignore
            filteredPayments = filteredPayments.filter(p => p.booking && myCarIds.includes(p.booking.carId));
        }

        // Filter by Time Range for Totals (Using Bookings for Revenue - Accrual Basis)
        const bookingsInPeriod = bookings.filter(b => {
            const date = new Date(b.startDate);
            const isMyCar = myCarIds.includes(b.carId);
            if (!isMyCar) return false;

            // Only count Active or Completed bookings as Revenue
            if (b.status !== 'Active' && b.status !== 'Completed') return false;

            if (timeRange === 'Monthly') {
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }
            return date.getFullYear() === currentYear;
        });

        const totalRevenue = bookingsInPeriod.reduce((sum, b) => sum + b.totalAmount, 0);

        // 3. Filter Expenses based on Car and Time Range
        // Service History
        let serviceHistoryInPeriod: { date: Date, cost: number }[] = [];
        myCars.forEach(car => {
            car.serviceHistory.forEach(s => {
                const date = new Date(s.date);
                let include = false;
                if (timeRange === 'Monthly') {
                    include = date.getMonth() === currentMonth && date.getFullYear() === currentYear;
                } else {
                    include = date.getFullYear() === currentYear;
                }
                if (include) {
                    serviceHistoryInPeriod.push({ date, cost: s.cost });
                }
            });
        });

        // Ad-hoc Expenses
        let myExpenses = expenses.filter(e => myCarIds.includes(e.carId));
        const expensesInPeriod = myExpenses.filter(e => {
            const date = new Date(e.date);
            if (timeRange === 'Monthly') {
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            }
            return date.getFullYear() === currentYear;
        });

        const totalServiceCost = serviceHistoryInPeriod.reduce((sum, s) => sum + s.cost, 0);
        const totalExpenseCost = expensesInPeriod.reduce((sum, e) => sum + e.amount, 0);
        const totalMaintenance = totalServiceCost + totalExpenseCost;

        const netProfit = totalRevenue - totalMaintenance;
        const utilization = 78; // Still mock for now

        // 4. Generate Chart Data
        let revenueData: { label: string, value: number }[] = [];
        let maintenanceData: { label: string, value: number }[] = [];

        if (timeRange === 'Yearly') {
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            revenueData = months.map((month, index) => {
                const value = bookings
                    .filter(b => {
                        const d = new Date(b.startDate);
                        const isMyCar = myCarIds.includes(b.carId);
                        return isMyCar && (b.status === 'Active' || b.status === 'Completed') &&
                            d.getFullYear() === currentYear && d.getMonth() === index;
                    })
                    .reduce((sum, b) => sum + b.totalAmount, 0);
                return { label: month, value };
            });

            maintenanceData = months.map((month, index) => {
                let cost = 0;
                // Service
                myCars.forEach(c => c.serviceHistory.forEach(s => {
                    const d = new Date(s.date);
                    if (d.getFullYear() === currentYear && d.getMonth() === index) cost += s.cost;
                }));
                // Expenses
                myExpenses.forEach(e => {
                    const d = new Date(e.date);
                    if (d.getFullYear() === currentYear && d.getMonth() === index) cost += e.amount;
                });
                return { label: month, value: cost };
            });
        } else {
            // Monthly - Daily breakdown
            const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
            for (let i = 1; i <= daysInMonth; i++) {
                const label = `${i}`;

                const revenue = bookings
                    .filter(b => {
                        const d = new Date(b.startDate);
                        const isMyCar = myCarIds.includes(b.carId);
                        return isMyCar && (b.status === 'Active' || b.status === 'Completed') &&
                            d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === i;
                    })
                    .reduce((sum, b) => sum + b.totalAmount, 0);

                let cost = 0;
                myCars.forEach(c => c.serviceHistory.forEach(s => {
                    const d = new Date(s.date);
                    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === i) cost += s.cost;
                }));
                myExpenses.forEach(e => {
                    const d = new Date(e.date);
                    if (d.getFullYear() === currentYear && d.getMonth() === currentMonth && d.getDate() === i) cost += e.amount;
                });

                revenueData.push({ label, value: revenue });
                maintenanceData.push({ label, value: cost });
            }
        }

        return {
            totalRevenue,
            totalMaintenance,
            netProfit,
            utilization,
            revenueData,
            maintenanceData
        };

    }, [user, payments, cars, expenses, selectedCarId, timeRange, viewYear]);

    if (!user || !analyticsData) return null;

    // Calculate max value for scaling charts
    const maxRevenue = Math.max(...analyticsData.revenueData.map(d => d.value), 1000); // Minimum scale 1000
    const maxMaintenance = Math.max(...analyticsData.maintenanceData.map(d => d.value), 1000);

    return (
        <div style={{ padding: '0' }}>
            <header style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-main)' }}>Reports & Analytics</h2>
                    <p style={{ color: 'var(--text-muted)' }}>Performance metrics and financial insights for {viewYear}.</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <select
                        className="input"
                        style={{ width: '200px' }}
                        value={selectedCarId}
                        onChange={(e) => setSelectedCarId(e.target.value)}
                    >
                        <option value="All">All Vehicles</option>
                        {cars.map(car => (
                            <option key={car.id} value={car.id}>{car.make} {car.model} ({car.plate})</option>
                        ))}
                    </select>

                    <div style={{ display: 'flex', gap: '0.5rem', backgroundColor: 'var(--bg-card)', padding: '0.25rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                        <button onClick={() => setTimeRange('Monthly')} className={timeRange === 'Monthly' ? 'btn-primary' : ''} style={{ padding: '0.25rem 0.75rem', border: 'none', background: timeRange === 'Monthly' ? 'var(--primary)' : 'transparent', color: timeRange === 'Monthly' ? 'var(--primary-fg)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}>Monthly</button>
                        <button onClick={() => setTimeRange('Yearly')} className={timeRange === 'Yearly' ? 'btn-primary' : ''} style={{ padding: '0.25rem 0.75rem', border: 'none', background: timeRange === 'Yearly' ? 'var(--primary)' : 'transparent', color: timeRange === 'Yearly' ? 'var(--primary-fg)' : 'var(--text-muted)', borderRadius: '4px', cursor: 'pointer' }}>Yearly</button>
                    </div>
                </div>
            </header>

            <div className="grid-dashboard" style={{ marginBottom: '2rem' }}>
                <div className="card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Revenue ({timeRange})</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>KES {analyticsData.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Expenses ({timeRange})</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--text-main)' }}>KES {analyticsData.totalMaintenance.toLocaleString()}</p>
                </div>
                <div className="card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Net Profit ({timeRange})</h3>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', color: analyticsData.netProfit >= 0 ? 'var(--success)' : 'var(--destructive)' }}>
                        KES {analyticsData.netProfit.toLocaleString()}
                    </p>
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                <div className="card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Revenue Trend ({timeRange})</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '250px', gap: '0.5rem', overflowX: 'auto', paddingBottom: '10px' }}>
                        {analyticsData.revenueData.map((item, index) => (
                            <div key={index} style={{ flex: 1, minWidth: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div
                                    title={`KES ${item.value.toLocaleString()}`}
                                    style={{
                                        width: '100%',
                                        height: `${Math.max(1, (item.value / maxRevenue) * 100)}%`,
                                        backgroundColor: 'var(--primary)',
                                        borderRadius: '4px',
                                        transition: 'height 0.3s ease',
                                        minHeight: item.value > 0 ? '4px' : '0'
                                    }}></div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="card" style={{ backgroundColor: 'var(--bg-card)', borderRadius: 'var(--radius)', boxShadow: 'var(--shadow-card)', border: '1px solid var(--border)', padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1.5rem', color: 'var(--text-main)' }}>Maintenance Costs ({timeRange})</h3>
                    <div style={{ display: 'flex', alignItems: 'flex-end', height: '250px', gap: '0.5rem', overflowX: 'auto', paddingBottom: '10px' }}>
                        {analyticsData.maintenanceData.map((item, index) => (
                            <div key={index} style={{ flex: 1, minWidth: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                <div
                                    title={`KES ${item.value.toLocaleString()}`}
                                    style={{
                                        width: '100%',
                                        height: `${Math.max(1, (item.value / maxMaintenance) * 100)}%`,
                                        backgroundColor: 'var(--destructive)',
                                        borderRadius: '4px',
                                        transition: 'height 0.3s ease',
                                        minHeight: item.value > 0 ? '4px' : '0'
                                    }}></div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>

    );
}
