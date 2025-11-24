'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { Payment } from '@prisma/client'; // Import Payment type

import { verifyUser } from '@/lib/auth-check';

// Helper function to update invoice status based on total payments
async function updateInvoiceStatus(bookingId: string) {
    const invoice = await prisma.invoice.findUnique({
        where: { bookingId },
        include: { booking: true }
    });
    if (!invoice) return;

    // Do not update status if invoice is Void or Booking is Cancelled
    if (invoice.status === 'Void' || invoice.booking.status === 'Cancelled') return;

    const allPayments = await prisma.payment.findMany({ where: { bookingId } });
    const totalPaid = allPayments
        .filter((p: Payment) => p.status === 'Paid')
        .reduce((sum: number, p: Payment) => sum + p.amount, 0);

    // If total paid is greater than or equal to invoice total, mark as Paid.
    // Otherwise, mark as Pending.
    const newStatus = totalPaid >= invoice.total ? 'Paid' : 'Pending';

    if (invoice.status !== newStatus) {
        await prisma.invoice.update({
            where: { id: invoice.id },
            data: { status: newStatus }
        });
    }
}

export async function markPaymentAsPaid(paymentId: string, method: string, amount?: number) {
    await verifyUser();
    try {
        const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
        if (!payment) return { success: false, message: "Payment not found." };

        // Handle Partial Payment
        if (amount && amount < payment.amount) {
            // 1. Create a new "Paid" payment for the partial amount
            await prisma.payment.create({
                data: {
                    bookingId: payment.bookingId,
                    amount: amount,
                    dueDate: payment.dueDate,
                    status: 'Paid',
                    method: method
                }
            });

            // 2. Reduce the existing Pending payment
            await prisma.payment.update({
                where: { id: paymentId },
                data: {
                    amount: payment.amount - amount
                }
            });

            // 3. Update Invoice Status
            await updateInvoiceStatus(payment.bookingId);

            revalidatePath('/payments');
            revalidatePath('/invoices');
            revalidatePath('/reports');
            return { success: true, message: `Partial payment of ${amount} recorded.` };
        }

        // Handle Full Payment (Default)
        await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'Paid',
                method: method,
            },
            include: { booking: true }
        });

        // Update Invoice Status
        await updateInvoiceStatus(payment.bookingId);

        revalidatePath('/payments');
        revalidatePath('/invoices');
        revalidatePath('/reports');
        return { success: true, message: "Payment marked as paid." };
    } catch (error) {
        console.error("Failed to update payment:", error);
        return { success: false, message: "Failed to update payment." };
    }
}


export async function markPaymentAsUnpaid(paymentId: string) {
    await verifyUser();
    try {
        // 1. Update Payment Status
        const payment = await prisma.payment.update({
            where: { id: paymentId },
            data: {
                status: 'Pending',
                method: null
            },
            include: { booking: true }
        });

        // 2. Update Invoice Status
        if (payment.bookingId) {
            await updateInvoiceStatus(payment.bookingId);
        }

        revalidatePath('/payments');
        revalidatePath('/invoices');
        revalidatePath('/reports');
        return { success: true, message: "Payment marked as unpaid (pending)." };
    } catch (error) {
        console.error("Failed to update payment:", error);
        return { success: false, message: "Failed to update payment." };
    }
}

export async function recordPayment(bookingId: string, amount: number, method: string) {
    await verifyUser();
    try {
        // 1. Check for existing Pending payment
        const pendingPayment = await prisma.payment.findFirst({
            where: {
                bookingId: bookingId,
                status: 'Pending'
            }
        });

        if (pendingPayment) {
            // Use existing logic
            return await markPaymentAsPaid(pendingPayment.id, method, amount);
        }

        // 2. No pending payment (Legacy or extra payment), create new Paid record
        await prisma.payment.create({
            data: {
                bookingId: bookingId,
                amount: amount,
                dueDate: new Date().toISOString(), // Now
                status: 'Paid',
                method: method
            }
        });

        // Update Invoice Status
        await updateInvoiceStatus(bookingId);

        revalidatePath('/payments');
        revalidatePath('/invoices');
        revalidatePath('/reports');
        return { success: true, message: `Payment of ${amount} recorded.` };

    } catch (error) {
        console.error("Failed to record payment:", error);
        return { success: false, message: "Failed to record payment." };
    }
}
