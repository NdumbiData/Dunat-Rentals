'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Car,
    CalendarDays,
    Wallet,
    Wrench,
    BarChart3,
    Settings,
    LogOut,
    Users
} from 'lucide-react';
import { logout } from '@/app/actions/auth';

export default function Sidebar() {
    const pathname = usePathname();

    const navItems = [
        { name: 'Dashboard', href: '/', icon: LayoutDashboard },
        { name: 'Cars', href: '/fleet', icon: Car },
        { name: 'Clients', href: '/clients', icon: Users },
        { name: 'Rentals', href: '/bookings', icon: CalendarDays },
        { name: 'Payments', href: '/payments', icon: Wallet },
        { name: 'Maintenance', href: '/maintenance', icon: Wrench },
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Settings', href: '/settings', icon: Settings },
    ];

    return (
        <aside className="w-64 bg-[#1e1e2d] text-gray-400 min-h-screen flex flex-col fixed left-0 top-0 font-sans z-50 border-r border-[#2d303e]">
            {/* Logo Section */}
            <div className="p-8 flex items-center gap-3 mb-2">
                <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-900/20">
                    <Car className="text-white" size={24} strokeWidth={2.5} />
                </div>
                <h1 className="text-xl font-bold text-white tracking-wide">Car Rental</h1>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-4">
                <ul className="space-y-1.5">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group font-medium ${isActive
                                        ? 'bg-[#2d303e] text-white shadow-sm'
                                        : 'hover:bg-[#2d303e] hover:text-white text-gray-400'
                                        }`}
                                >
                                    <item.icon
                                        size={20}
                                        className={`transition-colors duration-200 ${isActive ? 'text-blue-500' : 'text-gray-500 group-hover:text-white'}`}
                                    />
                                    <span>{item.name}</span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            {/* Logout Section */}
            <div className="p-4 mt-auto border-t border-[#2d303e]">
                <button
                    onClick={() => logout()}
                    className="flex items-center gap-4 px-4 py-3.5 w-full text-left text-gray-400 hover:bg-[#2d303e] hover:text-white rounded-xl transition-all duration-200 group font-medium"
                >
                    <LogOut size={20} className="text-gray-500 group-hover:text-white" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
