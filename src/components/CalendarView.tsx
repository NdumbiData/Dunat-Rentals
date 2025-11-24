'use client';

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Booking, Car } from '@prisma/client';
import { useMemo } from 'react';

const locales = {
    'en-US': enUS,
};

const localizer = dateFnsLocalizer({
    format,
    parse,
    startOfWeek,
    getDay,
    locales,
});

interface CalendarViewProps {
    bookings: (Booking & { car: Car })[];
}

export default function CalendarView({ bookings }: CalendarViewProps) {
    const events = useMemo(() => {
        return bookings.map(booking => ({
            id: booking.id,
            title: `${booking.car.make} ${booking.car.model} - ${booking.customerName}`,
            start: new Date(booking.startDate),
            end: new Date(booking.endDate),
            resource: booking,
            status: booking.status,
        }));
    }, [bookings]);

    const eventStyleGetter = (event: any) => {
        let backgroundColor = '#3b82f6'; // Default blue
        if (event.status === 'Pending Approval') backgroundColor = '#f59e0b'; // Orange
        if (event.status === 'Completed') backgroundColor = '#10b981'; // Green
        if (event.status === 'Cancelled') backgroundColor = '#ef4444'; // Red

        return {
            style: {
                backgroundColor,
                borderRadius: '4px',
                opacity: 0.8,
                color: 'white',
                border: '0px',
                display: 'block',
            },
        };
    };

    return (
        <div style={{ height: '600px', backgroundColor: 'white', padding: '1rem', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
            <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%' }}
                eventPropGetter={eventStyleGetter}
                views={[Views.MONTH, Views.WEEK, Views.AGENDA]}
                defaultView={Views.MONTH}
                popup
            />
        </div>
    );
}
