import { prisma } from '@/lib/prisma';

interface WPFormEntry {
    id: number;
    date: string;
    title: { rendered: string };
    content: { rendered: string };
    meta: any; // Depending on how the form plugin exposes data
    // If using Contact Form 7 to Database Extension or similar, structure might vary.
    // For this implementation, we'll assume a custom endpoint or a standard post type 'inquiry'
    // or we'll try to parse standard CF7/Flamingo data if exposed.
    // Let's assume a generic structure where we map fields.
}

export class WordPressService {
    private baseUrl: string;
    private username: string;
    private appPassword: string;

    constructor(baseUrl: string, username: string, appPassword: string) {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
        this.username = username;
        this.appPassword = appPassword;
    }

    private getAuthHeader() {
        const token = Buffer.from(`${this.username}:${this.appPassword}`).toString('base64');
        return `Basic ${token}`;
    }

    async fetchInquiries(since?: Date) {
        // This endpoint depends heavily on the WP plugin used.
        // Common ones: 
        // - Contact Form 7 + CF7 to Webhook (Push) -> We are doing Pull.
        // - Flamingo (stores CF7 msgs) -> REST API might not be exposed by default.
        // - WPForms -> Has REST API add-on.
        // - Gravity Forms -> Has REST API.

        // Assumption: The user has a way to expose entries as a Custom Post Type 'inquiry' 
        // or using a plugin that exposes them.
        // Let's try to fetch from a generic '/wp-json/wp/v2/inquiries' endpoint first.
        // If that fails, we might need to ask the user to install a specific plugin or code snippet.

        const endpoint = `${this.baseUrl}/wp-json/wp/v2/inquiries`;
        const params = new URLSearchParams();
        params.append('status', 'publish');
        if (since) {
            params.append('after', since.toISOString());
        }

        try {
            const response = await fetch(`${endpoint}?${params.toString()}`, {
                headers: {
                    'Authorization': this.getAuthHeader(),
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error(`WordPress API Error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();
            return data as any[]; // Return raw data for processing
        } catch (error) {
            console.error("Failed to fetch WP inquiries:", error);
            throw error;
        }
    }

    // Helper to map WP data to Gravity Booking
    // This is highly specific to the form fields.
    // We'll implement a generic mapper that looks for common keys.
    static mapToBooking(entry: any) {
        // Example structure from a custom post type or JSON API plugin
        // entry.acf or entry.meta might hold the fields

        // We need to find: Customer Name, Phone, Car, Start Date, End Date
        const meta = entry.meta || entry.acf || {};
        const content = entry.content?.rendered || '';

        // Simple heuristic extraction (can be improved with specific plugin knowledge)
        return {
            customerName: meta.your_name || meta.client_name || 'Unknown Client',
            phone: meta.your_phone || meta.phone || '',
            carPlate: meta.car_plate || meta.vehicle || '', // We need to match this to our DB
            startDate: meta.start_date || '',
            endDate: meta.end_date || '',
            externalId: entry.id.toString(),
        };
    }
}

export async function syncWordPressBookings() {
    const settings = await prisma.systemSettings.findFirst();
    if (!settings?.wpUrl || !settings?.wpUsername || !settings?.wpAppPassword) {
        console.log("WordPress settings not configured. Skipping sync.");
        return;
    }

    const wpService = new WordPressService(settings.wpUrl, settings.wpUsername, settings.wpAppPassword);

    try {
        // Get last sync time (we could store this in SystemSettings too, but for now let's just get recent)
        // Or we check if externalId exists to avoid duplicates.
        const inquiries = await wpService.fetchInquiries();

        for (const inquiry of inquiries) {
            const data = WordPressService.mapToBooking(inquiry);

            // Check if already imported
            // We need a way to store externalId. 
            // For now, let's check if a booking exists with same details + Pending Approval status?
            // Better: Add `externalId` to Booking model? 
            // Or just rely on loose matching for Phase 2.

            // Let's try to find the car
            // If carPlate is provided, find car.
            let carId = '';
            if (data.carPlate) {
                const car = await prisma.car.findFirst({
                    where: {
                        OR: [
                            { plate: { contains: data.carPlate } },
                            { make: { contains: data.carPlate } } // Fallback if they type "Toyota"
                        ]
                    }
                });
                if (car) carId = car.id;
            }

            if (!carId) {
                console.log(`Could not match car for inquiry #${data.externalId}`);
                continue; // Skip or create with a placeholder?
            }

            // Create Booking
            // Check for duplicates first
            const exists = await prisma.booking.findFirst({
                where: {
                    customerName: data.customerName,
                    startDate: data.startDate,
                    carId: carId
                }
            });

            if (!exists) {
                await prisma.booking.create({
                    data: {
                        customerName: data.customerName,
                        carId: carId,
                        startDate: data.startDate,
                        endDate: data.endDate,
                        totalAmount: 0, // Needs calculation or manual entry
                        status: 'Pending Approval', // REQUIRED by user
                    }
                });
                console.log(`Imported booking for ${data.customerName}`);
            }
        }
    } catch (error) {
        console.error("Sync failed:", error);
    }
}
