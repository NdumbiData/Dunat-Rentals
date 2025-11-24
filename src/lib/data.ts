export type CarStatus = 'Available' | 'Rented' | 'Maintenance';
export type UserRole = 'Admin' | 'Owner';
export type ServiceType = 'Oil' | 'Gearbox' | 'Suspension' | 'Body' | 'Tyres' | 'Other';
export type CarCategory = 'Sedan' | 'Mid-SUV' | 'Full SUV' | 'Commercial';

export interface User {
    id: string;
    name: string;
    email: string;
    role: UserRole;
}

export interface ServiceRecord {
    id: string;
    carId: string;
    date: string;
    type: ServiceType;
    description: string;
    garageName: string;
    partsReplaced: string[];
    cost: number;
}

export interface Car {
    id: string;
    make: string;
    model: string;
    year: number;
    plate: string;
    status: CarStatus;
    category: CarCategory;
    dailyRate: number;
    image: string;
    ownerId?: string;
    serviceHistory: ServiceRecord[];
}

export interface Invoice {
    id: string;
    bookingId: string;
    date: string;
    items: { description: string; amount: number }[];
    total: number;
    status: 'Paid' | 'Unpaid';
}

export interface Booking {
    id: string;
    carId: string;
    customerName: string;
    startDate: string;
    endDate: string;
    pickupFee?: number;
    deliveryFee?: number;
    totalAmount: number;
    status: 'Active' | 'Completed' | 'Cancelled' | 'Upcoming';
    invoiceId?: string;
}

export interface Payment {
    id: string;
    bookingId: string;
    amount: number;
    dueDate: string;
    status: 'Paid' | 'Pending' | 'Overdue';
}

export const users: User[] = [
    {
        id: 'u1',
        name: 'Hinga',
        email: 'admin@rentals.com',
        role: 'Admin'
    },
    {
        id: 'u2',
        name: 'Jane Owner',
        email: 'jane@partners.com',
        role: 'Owner'
    }
];

export const cars: Car[] = [
    {
        id: '1',
        make: 'Toyota',
        model: 'Camry',
        year: 2023,
        plate: 'KDA 123A',
        status: 'Available',
        category: 'Sedan',
        dailyRate: 5000,
        image: '/placeholder-car.png',
        serviceHistory: [
            {
                id: 's1',
                carId: '1',
                date: '2023-10-15',
                type: 'Oil',
                description: 'Routine Maintenance',
                garageName: 'AutoFix Garage',
                partsReplaced: ['Oil Filter', 'Synthetic Oil'],
                cost: 5000
            }
        ]
    },
    {
        id: '2',
        make: 'Mercedes',
        model: 'C-Class',
        year: 2022,
        plate: 'KDB 456B',
        status: 'Rented',
        category: 'Sedan',
        dailyRate: 15000,
        image: '/placeholder-car.png',
        ownerId: 'u2',
        serviceHistory: []
    },
    {
        id: '3',
        make: 'Land Rover',
        model: 'Defender',
        year: 2024,
        plate: 'KDC 789C',
        status: 'Maintenance',
        category: 'Full SUV',
        dailyRate: 25000,
        image: '/placeholder-car.png',
        serviceHistory: [
            {
                id: 's2',
                carId: '3',
                date: '2023-11-01',
                type: 'Suspension',
                description: 'Brake Pad Replacement',
                garageName: 'Land Rover Service Center',
                partsReplaced: ['Front Brake Pads', 'Rear Brake Pads', 'Sensors'],
                cost: 20000
            }
        ]
    },
    {
        id: '4',
        make: 'Honda',
        model: 'CR-V',
        year: 2021,
        plate: 'KDD 012D',
        status: 'Available',
        category: 'Mid-SUV',
        dailyRate: 7000,
        image: '/placeholder-car.png',
        ownerId: 'u2',
        serviceHistory: []
    },
    {
        id: '5',
        make: 'Toyota',
        model: 'HiAce',
        year: 2020,
        plate: 'KDE 345E',
        status: 'Available',
        category: 'Commercial',
        dailyRate: 8000,
        image: '/placeholder-car.png',
        serviceHistory: []
    }
];

export const bookings: Booking[] = [
    {
        id: 'b1',
        carId: '2',
        customerName: 'John Doe',
        startDate: '2023-11-20',
        endDate: '2023-11-25',
        pickupFee: 1000,
        totalAmount: 76000, // 75000 + 1000
        status: 'Active',
        invoiceId: 'inv1'
    },
    {
        id: 'b2',
        carId: '1',
        customerName: 'Jane Smith',
        startDate: '2023-12-01',
        endDate: '2023-12-05',
        totalAmount: 20000,
        status: 'Upcoming'
    }
];

export const invoices: Invoice[] = [
    {
        id: 'inv1',
        bookingId: 'b1',
        date: '2023-11-20',
        items: [
            { description: 'Car Rental (5 days)', amount: 75000 },
            { description: 'Pickup Fee', amount: 1000 }
        ],
        total: 76000,
        status: 'Unpaid'
    }
];

export const payments: Payment[] = [
    {
        id: 'p1',
        bookingId: 'b1',
        amount: 76000,
        dueDate: '2023-11-25',
        status: 'Pending'
    },
    {
        id: 'p2',
        bookingId: 'b2',
        amount: 10000,
        dueDate: '2023-11-15',
        status: 'Paid'
    },
    {
        id: 'p3',
        bookingId: 'b3', // Historic
        amount: 5000,
        dueDate: '2023-10-01',
        status: 'Overdue'
    }
];
