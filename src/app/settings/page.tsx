'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { User } from '@prisma/client';
import { getSystemSettings, updateSystemSettings } from '@/app/actions/settings';
import { getUsers, updateUserRole } from '@/app/actions/users';

// Sub-components
import ProfileSettings from '@/components/settings/ProfileSettings';
import CompanySettings from '@/components/settings/CompanySettings';
import FinancialSettings from '@/components/settings/FinancialSettings';
import RentalSettings from '@/components/settings/RentalSettings';
import WebsiteSettings from '@/components/settings/WebsiteSettings';
import SecuritySettings from '@/components/settings/SecuritySettings';
import AppearanceSettings from '@/components/settings/AppearanceSettings';
import NotificationSettings from '@/components/settings/NotificationSettings';
import UserManagement from '@/components/settings/UserManagement';

export default function SettingsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('general');
    const [settings, setSettings] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const isSuperAdmin = user?.email === 'admin@rentals.com';

    const tabs = [
        { id: 'general', label: 'Profile', icon: '👤' },
        { id: 'company', label: 'Company', icon: '🏢' },
        { id: 'financials', label: 'Financials', icon: '💰' },
        { id: 'rental', label: 'Rental Rules', icon: '🚗' },
        { id: 'website', label: 'Website', icon: '🌐' },
        { id: 'security', label: 'Security', icon: '🔒' },
        { id: 'appearance', label: 'Appearance', icon: '🎨' },
        { id: 'notifications', label: 'Notifications', icon: '🔔' },
    ];

    if (isSuperAdmin) {
        tabs.push({ id: 'users', label: 'User Management', icon: '👥' });
    }

    useEffect(() => {
        if (!user) {
            // router.push('/login'); // Handled by AuthContext usually, but safe to keep
            return;
        }

        const fetchData = async () => {
            try {
                const [settingsData, usersData] = await Promise.all([
                    getSystemSettings(),
                    isSuperAdmin ? getUsers() : Promise.resolve([])
                ]);
                setSettings(settingsData);
                setUsers(usersData as any);
            } catch (error) {
                console.error("Failed to fetch data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [user, router, isSuperAdmin]);

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
    }

    return (
        <main className="flex h-screen bg-slate-50">
            <Sidebar />
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-slate-800">Settings</h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-slate-600">Welcome, {user?.name}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-auto p-8">
                    <div className="flex gap-8 max-w-7xl mx-auto">
                        {/* Settings Navigation */}
                        <div className="w-64 flex-shrink-0">
                            <nav className="flex flex-col gap-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '0.75rem 1rem',
                                            borderRadius: 'var(--radius)',
                                            border: 'none',
                                            backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                            color: activeTab === tab.id ? 'white' : 'var(--foreground)',
                                            cursor: 'pointer',
                                            textAlign: 'left',
                                            fontWeight: '500',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <span>{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </nav>
                        </div>

                        {/* Content Area */}
                        <div style={{ flex: 1 }}>
                            {activeTab === 'general' && <ProfileSettings user={user} />}
                            {activeTab === 'company' && <CompanySettings settings={settings} onUpdate={updateSystemSettings} />}
                            {activeTab === 'financials' && <FinancialSettings settings={settings} onUpdate={updateSystemSettings} />}
                            {activeTab === 'rental' && <RentalSettings settings={settings} onUpdate={updateSystemSettings} />}
                            {activeTab === 'website' && <WebsiteSettings settings={settings} />}
                            {activeTab === 'security' && <SecuritySettings user={user} />}
                            {activeTab === 'appearance' && <AppearanceSettings />}
                            {activeTab === 'notifications' && <NotificationSettings />}
                            {activeTab === 'users' && isSuperAdmin && <UserManagement users={users} onUpdateRole={updateUserRole} />}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
