'use client';

import { useState, useEffect } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { Car, ServiceRecord } from '@prisma/client';
import AddCarModal from '@/components/AddCarModal';
import EditCarModal from '@/components/EditCarModal';
import { deleteCar } from '@/app/actions/fleet';
import AssetDocuments from '@/components/AssetDocuments';
import Sidebar from './Sidebar';

function CarDetailsTabs({ car }: { car: CarWithService }) {
    const [activeTab, setActiveTab] = useState<'service' | 'documents'>('service');

    return (
        <div>
            <div className="flex space-x-4 mb-4 border-b border-gray-200">
                <button
                    className={`pb-2 px-1 ${activeTab === 'service' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('service')}
                >
                    Service History
                </button>
                <button
                    className={`pb-2 px-1 ${activeTab === 'documents' ? 'border-b-2 border-blue-600 font-semibold text-blue-600' : 'text-gray-500'}`}
                    onClick={() => setActiveTab('documents')}
                >
                    Documents
                </button>
            </div>

            {activeTab === 'service' && (
                <>
                    {car.serviceHistory.length > 0 ? (
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-100 text-gray-600">
                                <tr>
                                    <th className="p-2">Date</th>
                                    <th className="p-2">Type</th>
                                    <th className="p-2">Garage</th>
                                    <th className="p-2">Parts</th>
                                    <th className="p-2">Cost</th>
                                </tr>
                            </thead>
                            <tbody>
                                {car.serviceHistory.map(service => (
                                    <tr key={service.id} className="border-b border-gray-100">
                                        <td className="p-2">{service.date}</td>
                                        <td className="p-2">{service.type}</td>
                                        <td className="p-2">{service.garageName}</td>
                                        <td className="p-2">{service.partsReplaced.join(', ')}</td>
                                        <td className="p-2">KES {service.cost.toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="text-gray-500 text-sm">No service records found.</p>
                    )}
                </>
            )}

            {activeTab === 'documents' && (
                <AssetDocuments carId={car.id} />
            )}
        </div>
    );
}

// Extended type to include parsed service history
type CarWithService = Omit<Car, 'serviceHistory'> & {
    serviceHistory: (Omit<ServiceRecord, 'partsReplaced'> & { partsReplaced: string[] })[];
};

interface FleetClientProps {
    initialCars: CarWithService[];
    owners?: { id: string; name: string }[];
}

export default function FleetClient({ initialCars, owners = [] }: FleetClientProps) {
    const { user } = useAuth();
    const router = useRouter();
    const [cars, setCars] = useState<CarWithService[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddCarModalOpen, setIsAddCarModalOpen] = useState(false);
    const [editingCar, setEditingCar] = useState<Car | null>(null);
    const [expandedCarId, setExpandedCarId] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const initialStatusFilter = searchParams.get('status');
    const [statusFilter, setStatusFilter] = useState<string | null>(initialStatusFilter);

    useEffect(() => {
        if (!user) {
            router.push('/login');
            return;
        }

        if (user) {
            const myCars = user.role === 'Admin'
                ? initialCars
                : initialCars.filter(c => c.ownerId === user.id);
            setCars(myCars);
        }
    }, [user, router, initialCars]);

    // Update filter if URL changes
    useEffect(() => {
        setStatusFilter(searchParams.get('status'));
    }, [searchParams]);

    const filteredCars = cars.filter(car => {
        const matchesSearch = car.make.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
            car.plate.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter ? car.status === statusFilter : true;

        return matchesSearch && matchesStatus;
    });

    const toggleExpand = (id: string) => {
        setExpandedCarId(expandedCarId === id ? null : id);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure you want to delete this car? This action cannot be undone.')) {
            const result = await deleteCar(id);
            if (result.success) {
                alert(result.message);
                // Optimistic update or wait for revalidation (handled by server action revalidatePath)
            } else {
                alert(result.message);
            }
        }
    };

    if (!user) return null;

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 ml-64 p-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-800">Fleet Management</h2>
                        <p className="text-gray-600">Manage your cars and their service history.</p>
                    </div>
                    {user.role === 'Admin' && (
                        <button
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                            onClick={() => setIsAddCarModalOpen(true)}
                        >
                            + Add New Car
                        </button>
                    )}
                </div>

                <div className="mb-6">
                    <input
                        type="text"
                        placeholder="Search by make, model, or plate..."
                        className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCars.map(car => (
                        <div key={car.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden ${expandedCarId === car.id ? 'col-span-full' : ''}`}>
                            <div className={`flex ${expandedCarId === car.id ? 'flex-row' : 'flex-col'}`}>
                                <div className={`${expandedCarId === car.id ? 'w-1/3 h-auto' : 'w-full h-48'} bg-gray-100 flex items-center justify-center text-gray-400 relative`}>
                                    {car.image ? (
                                        <img
                                            src={car.image}
                                            alt={`${car.make} ${car.model}`}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).src = '/placeholder-car.png';
                                            }}
                                        />
                                    ) : (
                                        <span>No Image</span>
                                    )}
                                </div>
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800">{car.make} {car.model}</h3>
                                            <p className="text-gray-500 text-sm">{car.year} • {car.plate}</p>
                                            {car.ownerId && (
                                                <p className="text-xs text-gray-400 mt-1">
                                                    Owner: {owners.find(o => o.id === car.ownerId)?.name || 'Unknown'}
                                                </p>
                                            )}
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-semibold ${car.status === 'Available' ? 'bg-green-100 text-green-700' :
                                            car.status === 'Rented' ? 'bg-blue-100 text-blue-700' :
                                                'bg-yellow-100 text-yellow-700'
                                            }`}>
                                            {car.status}
                                        </span>
                                    </div>

                                    <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                        <div className="font-bold text-gray-800">
                                            KES {car.dailyRate.toLocaleString()}<span className="text-sm font-normal text-gray-500">/day</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                                onClick={() => toggleExpand(car.id)}
                                            >
                                                {expandedCarId === car.id ? 'Hide' : 'Details'}
                                            </button>
                                            {user.role === 'Admin' && (
                                                <>
                                                    <button
                                                        className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                                                        onClick={() => setEditingCar(car)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="px-3 py-1 text-sm border border-red-200 text-red-600 rounded hover:bg-red-50"
                                                        onClick={() => handleDelete(car.id)}
                                                    >
                                                        Delete
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    {expandedCarId === car.id && (
                                        <div className="mt-6 pt-6 border-t border-gray-100">
                                            <CarDetailsTabs car={car} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filteredCars.length === 0 && (
                        <p className="text-gray-500 col-span-full text-center py-8">No cars found.</p>
                    )}
                </div>

                <AddCarModal isOpen={isAddCarModalOpen} onClose={() => setIsAddCarModalOpen(false)} owners={owners} />
                {editingCar && (
                    <EditCarModal
                        isOpen={!!editingCar}
                        onClose={() => setEditingCar(null)}
                        car={editingCar}
                        owners={owners}
                    />
                )}
            </main>
        </div>
    );
}


