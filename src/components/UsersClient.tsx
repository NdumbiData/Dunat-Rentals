'use client';

import { useState } from 'react';
import { updateUserRole } from '@/app/actions/users';

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
}

interface UsersClientProps {
    initialUsers: User[];
}

export default function UsersClient({ initialUsers }: UsersClientProps) {
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [loadingId, setLoadingId] = useState<string | null>(null);

    const handleRoleChange = async (userId: string, newRole: string) => {
        setLoadingId(userId);
        const result = await updateUserRole(userId, newRole);

        if (result.success) {
            setUsers(users.map(user =>
                user.id === userId ? { ...user, role: newRole } : user
            ));
        } else {
            alert(result.message);
        }
        setLoadingId(null);
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
            </div>

            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="p-4 font-semibold text-gray-600">Name</th>
                                <th className="p-4 font-semibold text-gray-600">Email</th>
                                <th className="p-4 font-semibold text-gray-600">Role</th>
                                <th className="p-4 font-semibold text-gray-600">Joined</th>
                                <th className="p-4 font-semibold text-gray-600">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="p-4 font-medium text-gray-900">{user.name}</td>
                                    <td className="p-4 text-gray-600">{user.email}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${user.role === 'Admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                            }`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">
                                        {new Date(user.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="p-4">
                                        <select
                                            value={user.role}
                                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                            disabled={loadingId === user.id}
                                            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                        >
                                            <option value="Admin">Admin</option>
                                            <option value="Owner">Owner</option>
                                        </select>
                                        {loadingId === user.id && (
                                            <span className="ml-2 text-xs text-gray-500">Updating...</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {users.length === 0 && (
                    <div className="p-8 text-center text-gray-500">
                        No users found.
                    </div>
                )}
            </div>
        </div>
    );
}
