'use client';

import { Car, Booking, Payment } from '@prisma/client';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import {
    ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend
} from 'recharts';
import { getExpiringDocuments } from '@/app/actions/documents';
import Sidebar from './Sidebar';
import {
    Bell,
    Car as CarIcon,
    Wrench,
    Search,
    ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';

interface DashboardProps {
    cars: Car[];
    bookings: (Booking & { car: Car })[];
    payments: Payment[];
}

export default function Dashboard({ cars, bookings, payments }: DashboardProps) {
    const { user } = useAuth();
    const [alerts, setAlerts] = useState<{ expiring: any[], expired: any[] }>({ expiring: [], expired: [] });
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if (user) {
            getExpiringDocuments().then(setAlerts);
        }
    }, [user]);

    const stats = useMemo(() => {
        const totalCars = cars.length;
        const availableCars = cars.filter(c => c.status === 'Available').length;
        const rentedCars = cars.filter(c => c.status === 'Rented').length;
        const maintenanceCars = cars.filter(c => c.status === 'Maintenance').length;

        // Revenue Data (Monthly)
        const monthlyRevenueMap: Record<string, number> = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        months.forEach(m => monthlyRevenueMap[m] = 0);

        payments.forEach(p => {
            const date = new Date(p.createdAt);
            const month = format(date, 'MMM');
            if (monthlyRevenueMap[month] !== undefined) {
                monthlyRevenueMap[month] += p.amount;
            }
        });

        const revenueData = Object.entries(monthlyRevenueMap).map(([name, value]) => ({ name, value }));

        // Daily Earnings (Last 7 days)
        const dailyEarningsMap: Record<string, number> = {};
        const today = new Date();
        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const key = format(d, 'MMM d');
            dailyEarningsMap[key] = 0;
        }

        payments.forEach(p => {
            const date = new Date(p.createdAt);
            const key = format(date, 'MMM d');
            if (dailyEarningsMap[key] !== undefined) {
                dailyEarningsMap[key] += p.amount;
            }
        });

        const dailyEarningsData = Object.entries(dailyEarningsMap).map(([name, value]) => ({ name, value }));

        // Payment Status
        const pendingPayments = payments.filter(p => p.status === 'Pending');
        const paidPayments = payments.filter(p => p.status === 'Paid');
        const overduePayments = payments.filter(p => p.status === 'Overdue');

        const paymentStatusData = [
            { name: 'Paid', value: paidPayments.length, color: '#3b82f6' }, // Blue
            { name: 'Pending', value: pendingPayments.length, color: '#fbbf24' }, // Amber
            { name: 'Overdue', value: overduePayments.length, color: '#ef4444' }, // Red
        ].filter(d => d.value > 0);

        // Recent Activity
        const recentActivity = [
            ...payments.map(p => ({
                id: p.id,
                type: 'Payment',
                description: `Payment of KES ${p.amount.toLocaleString()}`,
                date: new Date(p.createdAt),
                status: p.status === 'Paid' ? 'Success' : p.status,
                statusColor: p.status === 'Paid' ? 'text-green-500' : 'text-yellow-500'
            })),
            ...bookings.map(b => ({
                id: b.id,
                type: 'Booking',
                description: `Rental by ${b.customerName}`,
                date: new Date(b.createdAt),
                status: b.status === 'Completed' ? 'Completed' : b.status,
                statusColor: b.status === 'Completed' ? 'text-blue-500' : 'text-gray-500'
            }))
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 5);

        return {
            totalCars,
            availableCars,
            rentedCars,
            maintenanceCars,
            revenueData,
            dailyEarningsData,
            paymentStatusData,
            recentActivity
        };
    }, [cars, bookings, payments]);

    return (
        <div className="flex min-h-screen bg-[#f3f4f6] min-w-[1440px]">
            <Sidebar />
            <main className="flex-1 ml-64 p-8 font-sans">
                {/* Header */}
                <div className="flex justify-between items-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-800">Dashboard</h2>

                    <div className="flex items-center gap-6">
                        <div className="relative">
                            <Bell
                                className="text-gray-600 cursor-pointer hover:text-gray-800 transition-colors"
                                size={24}
                                onClick={() => setShowNotifications(!showNotifications)}
                            />
                            {(alerts.expired.length > 0 || alerts.expiring.length > 0) && (
                                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#f3f4f6]"></span>
                            )}
                        </div>

                        <div className="flex items-center gap-3 bg-white pl-4 pr-2 py-1.5 rounded-full shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                {user?.name?.[0] || 'U'}
                            </div>
                            <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
                            <ChevronDown size={16} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-6 mb-8">
                    <SummaryCard
                        title="Total Cars"
                        value={stats.totalCars}
                        icon={<CarIcon size={28} className="text-blue-500" />}
                    />
                    <SummaryCard
                        title="Cars Available"
                        value={stats.availableCars}
                        icon={<CarIcon size={28} className="text-emerald-500" />}
                    />
                    <SummaryCard
                        title="Cars Rented"
                        value={stats.rentedCars}
                        icon={<CarIcon size={28} className="text-orange-500" />}
                    />
                    <SummaryCard
                        title="Under Maintenance"
                        value={stats.maintenanceCars}
                        icon={<Wrench size={28} className="text-red-500" />}
                    />
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    {/* Total Revenue */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Total Revenue</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.revenueData} barSize={24}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip
                                        cursor={{ fill: '#f3f4f6' }}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 6, 6]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Daily Earnings */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Daily Earnings</h3>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.dailyEarningsData}>
                                    <defs>
                                        <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} dy={10} interval={1} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={(value) => `$${value}`} />
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="grid grid-cols-3 gap-6">
                    {/* Recent Activity */}
                    <div className="col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-gray-800">Recent Activity</h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-gray-400 text-sm border-b border-gray-100">
                                        <th className="pb-4 font-medium pl-4">Date</th>
                                        <th className="pb-4 font-medium">Description</th>
                                        <th className="pb-4 font-medium text-right pr-4">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {stats.recentActivity.map((activity) => (
                                        <tr key={`${activity.type}-${activity.id}`} className="hover:bg-gray-50 transition-colors">
                                            <td className="py-4 pl-4 text-gray-500">{format(activity.date, 'dd MMM yyyy')}</td>
                                            <td className="py-4 font-medium text-gray-800">{activity.description}</td>
                                            <td className={`py-4 pr-4 text-right font-medium ${activity.statusColor}`}>
                                                {activity.status}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pending Payments */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-800 mb-6">Pending Payments</h3>
                        <div className="flex items-center justify-center h-[250px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.paymentStatusData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={0}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {stats.paymentStatusData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend
                                        layout="vertical"
                                        verticalAlign="middle"
                                        align="right"
                                        iconType="circle"
                                        iconSize={8}
                                        formatter={(value, entry: any) => <span className="text-gray-600 text-sm ml-2">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

function SummaryCard({ title, value, icon }: { title: string; value: number; icon: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between h-32 transition-transform hover:scale-[1.02] cursor-default">
            <div className="flex justify-between items-start">
                <p className="text-gray-500 text-sm font-medium">{title}</p>
                {icon}
            </div>
            <h3 className="text-3xl font-bold text-gray-800 mt-2">{value}</h3>
        </div>
    );
}
