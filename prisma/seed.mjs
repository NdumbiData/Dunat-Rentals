import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const users = [
    {
        id: 'u1',
        name: 'Admin User',
        email: 'admin@rentals.com',
        role: 'Admin'
    },
    {
        id: 'u2',
        name: 'Jane Owner',
        email: 'jane@partners.com',
        role: 'Owner',
        ownerCarIds: ['2', '4']
    }
];

const cars = [
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

const bookings = [
    {
        id: 'b1',
        carId: '2',
        customerName: 'John Doe',
        startDate: '2023-11-20',
        endDate: '2023-11-25',
        pickupFee: 1000,
        deliveryFee: 0,
        totalAmount: 76000,
        status: 'Active',
        invoiceId: 'inv1'
    },
    {
        id: 'b2',
        carId: '1',
        customerName: 'Jane Smith',
        startDate: '2023-12-01',
        endDate: '2023-12-05',
        pickupFee: 0,
        deliveryFee: 0,
        totalAmount: 20000,
        status: 'Upcoming'
    },
    {
        id: 'b3',
        carId: '3',
        customerName: 'Historic User',
        startDate: '2023-09-01',
        endDate: '2023-09-05',
        pickupFee: 0,
        deliveryFee: 0,
        totalAmount: 5000,
        status: 'Completed'
    }
];

const invoices = [
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

const payments = [
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
        bookingId: 'b3',
        amount: 5000,
        dueDate: '2023-10-01',
        status: 'Overdue'
    }
];

async function main() {
    console.log('Start seeding ...');

    // Seed Users
    for (const user of users) {
        await prisma.user.upsert({
            where: { email: user.email },
            update: {},
            create: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                ownerCarIds: user.ownerCarIds ? JSON.stringify(user.ownerCarIds) : null,
            },
        });
    }

    // Seed Cars & Service History
    for (const car of cars) {
        await prisma.car.upsert({
            where: { id: car.id },
            update: {},
            create: {
                id: car.id,
                make: car.make,
                model: car.model,
                year: car.year,
                plate: car.plate,
                status: car.status,
                category: car.category,
                dailyRate: car.dailyRate,
                image: car.image,
                ownerId: car.ownerId || null,
                serviceHistory: {
                    create: car.serviceHistory.map(s => ({
                        id: s.id,
                        date: s.date,
                        type: s.type,
                        description: s.description,
                        garageName: s.garageName,
                        partsReplaced: JSON.stringify(s.partsReplaced),
                        cost: s.cost,
                    })),
                },
            },
        });
    }

    // Seed Bookings
    for (const booking of bookings) {
        await prisma.booking.upsert({
            where: { id: booking.id },
            update: {},
            create: {
                id: booking.id,
                carId: booking.carId,
                customerName: booking.customerName,
                startDate: booking.startDate,
                endDate: booking.endDate,
                pickupFee: booking.pickupFee,
                deliveryFee: booking.deliveryFee,
                totalAmount: booking.totalAmount,
                status: booking.status,
            },
        });
    }

    // Seed Invoices
    for (const invoice of invoices) {
        await prisma.invoice.upsert({
            where: { id: invoice.id },
            update: {},
            create: {
                id: invoice.id,
                bookingId: invoice.bookingId,
                date: invoice.date,
                items: JSON.stringify(invoice.items),
                total: invoice.total,
                status: invoice.status,
            },
        });
    }

    // Seed Payments
    for (const payment of payments) {
        await prisma.payment.upsert({
            where: { id: payment.id },
            update: {},
            create: {
                id: payment.id,
                bookingId: payment.bookingId,
                amount: payment.amount,
                dueDate: payment.dueDate,
                status: payment.status,
            },
        });
    }

    console.log('Seeding finished.');
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
