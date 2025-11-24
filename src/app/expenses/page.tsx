import { prisma } from '@/lib/prisma';
import ExpensesClient from '@/components/ExpensesClient';

export default async function ExpensesPage() {
    const expenses = await prisma.expense.findMany({
        include: {
            car: true
        },
        orderBy: {
            date: 'desc'
        }
    });

    const cars = await prisma.car.findMany({
        where: { deletedAt: null }
    });

    return <ExpensesClient initialExpenses={expenses} cars={cars} />;
}
