import { NextResponse } from 'next/server';
import { syncWordPressBookings } from '@/lib/wordpress';
import { verifyUser } from '@/lib/auth-check';

export async function POST() {
    try {
        // Optional: Verify user is admin
        // const user = await verifyUser();
        // if (user.role !== 'Admin') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await syncWordPressBookings();
        return NextResponse.json({ success: true, message: 'Sync completed' });
    } catch (error) {
        console.error('Sync error:', error);
        return NextResponse.json({ success: false, error: 'Sync failed' }, { status: 500 });
    }
}
