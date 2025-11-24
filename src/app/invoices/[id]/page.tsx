import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PrintButton from '@/components/PrintButton';

interface InvoiceItem {
    description: string;
    amount: number;
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: {
            booking: {
                include: {
                    car: true
                }
            }
        }
    });

    if (!invoice) {
        notFound();
    }

    const items = JSON.parse(invoice.items) as InvoiceItem[];
    const booking = invoice.booking;
    const grandTotal = invoice.total;
    const subtotal = grandTotal / 1.16;
    const vat = grandTotal - subtotal;

    // Brand Colors
    const colors = {
        primary: '#1e293b', // Dark Slate
        accent: '#C5A028',  // Gold
        light: '#f8fafc',   // Very Light Gray
        border: '#e2e8f0',  // Light Border
        text: '#334155',    // Slate Text
    };

    return (
        <div style={{
            width: '210mm',
            minHeight: '297mm',
            margin: '2rem auto',
            padding: '0',
            backgroundColor: 'white',
            color: colors.text,
            fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
            position: 'relative',
            overflow: 'hidden'
        }} className="invoice-container">

            {/* Top Accent Bar */}
            <div style={{ height: '6px', background: `linear-gradient(90deg, ${colors.primary} 70%, ${colors.accent} 70%)` }}></div>

            <div style={{ padding: '2.5rem 3rem', display: 'flex', flexDirection: 'column', height: 'calc(297mm - 6px)' }}>

                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                    <div>
                        <div style={{ width: '240px', marginBottom: '0.5rem' }}>
                            <img src="/logo.png" alt="Dunat Car Rental" style={{ width: '100%', height: 'auto' }} />
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <h1 style={{
                            fontSize: '2.25rem',
                            fontWeight: '800',
                            color: colors.primary,
                            letterSpacing: '-0.025em',
                            marginBottom: '0'
                        }}>INVOICE</h1>
                        <p style={{ fontSize: '0.9rem', color: colors.accent, fontWeight: '600' }}>#{invoice.id.slice(0, 8).toUpperCase()}</p>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                    {/* Bill To */}
                    <div style={{
                        backgroundColor: colors.light,
                        padding: '1.25rem',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${colors.accent}`
                    }}>
                        <h3 style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: '#64748b', fontWeight: '600', marginBottom: '0.5rem' }}>Bill To</h3>
                        <div style={{ fontSize: '1.1rem', fontWeight: '700', color: colors.primary, marginBottom: '0.25rem' }}>
                            {booking?.customerName || 'Valued Customer'}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                            Client Account
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600', color: colors.primary }}>Invoice Date:</span>
                            <span>{new Date(invoice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600', color: colors.primary }}>Quote No:</span>
                            <span>DTCH/Q/{Math.floor(Math.random() * 1000)}/2025</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px solid ${colors.border}`, paddingBottom: '0.25rem' }}>
                            <span style={{ fontWeight: '600', color: colors.primary }}>Status:</span>
                            <span style={{
                                color: invoice.status === 'Paid' ? '#10b981' : '#ef4444',
                                fontWeight: 'bold',
                                padding: '0 0.4rem',
                                borderRadius: '4px',
                                backgroundColor: invoice.status === 'Paid' ? '#ecfdf5' : '#fef2f2',
                                fontSize: '0.8rem'
                            }}>{invoice.status.toUpperCase()}</span>
                        </div>
                    </div>
                </div>

                {/* Intro Text */}
                <div style={{ marginBottom: '1.5rem', fontSize: '0.9rem', color: '#475569', fontStyle: 'italic' }}>
                    <p>Attn: {booking?.customerName.split(' ')[0]}, thank you for choosing Dunat Tours. Please find the service details below.</p>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
                    <thead>
                        <tr style={{ backgroundColor: colors.primary, color: 'white' }}>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>QTY</th>
                            <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>DURATION</th>
                            <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>DESCRIPTION</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>UNIT PRICE</th>
                            <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: '600', letterSpacing: '0.05em' }}>TOTAL</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={index} style={{ borderBottom: `1px solid ${colors.border}` }}>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>1</td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
                                    {booking ? Math.max(1, Math.ceil((new Date(booking.endDate).getTime() - new Date(booking.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 1} Days
                                </td>
                                <td style={{ padding: '1rem 0.75rem' }}>
                                    <div style={{ fontWeight: '700', color: colors.primary, fontSize: '0.95rem', marginBottom: '0.1rem' }}>{booking?.car?.category || 'Car Rental'}</div>
                                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Model: {booking?.car?.make} {booking?.car?.model} | Plate: {booking?.car?.plate}</div>
                                </td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', color: '#64748b', fontSize: '0.9rem' }}>
                                    {booking?.car?.dailyRate.toLocaleString()}
                                </td>
                                <td style={{ padding: '1rem 0.75rem', textAlign: 'right', fontWeight: '700', color: colors.primary, fontSize: '0.95rem' }}>
                                    {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Totals & Terms */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 'auto' }}>
                    <div style={{ flex: 1, paddingRight: '3rem' }}>
                        <h4 style={{ fontSize: '0.8rem', fontWeight: '700', color: colors.primary, marginBottom: '0.25rem', textTransform: 'uppercase' }}>Terms & Conditions</h4>
                        <ul style={{ fontSize: '0.75rem', color: '#64748b', paddingLeft: '1rem', lineHeight: '1.5', margin: 0 }}>
                            <li>Payment is due upon receipt of this invoice.</li>
                            <li>Please quote the Invoice No. when making payment.</li>
                            <li>This invoice is valid for 30 days.</li>
                        </ul>
                    </div>
                    <div style={{ width: '300px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' }}>
                            <span style={{ color: '#64748b' }}>Subtotal</span>
                            <span style={{ fontWeight: '600', color: colors.primary }}>{subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: `1px solid ${colors.border}`, fontSize: '0.9rem' }}>
                            <span style={{ color: '#64748b' }}>VAT (16%)</span>
                            <span style={{ fontWeight: '600', color: colors.primary }}>{vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            padding: '0.75rem 0',
                            marginTop: '0.25rem',
                            borderTop: `2px solid ${colors.primary}`,
                            fontSize: '1.1rem'
                        }}>
                            <span style={{ fontWeight: '800', color: colors.primary }}>Total (KES)</span>
                            <span style={{ fontWeight: '800', color: colors.accent }}>{grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>

                {/* Signatures */}
                <div style={{ marginTop: '2rem', marginBottom: '2rem' }}>
                    <p style={{ fontSize: '0.75rem', fontWeight: '600', color: '#94a3b8', marginBottom: '2.5rem' }}>Authorized Signature</p>
                    <div style={{ borderTop: `1px solid ${colors.border}`, paddingTop: '0.5rem', display: 'inline-block', paddingRight: '2rem' }}>
                        <p style={{ fontWeight: '700', color: colors.primary, fontSize: '0.9rem' }}>Ndumbi Kimani</p>
                        <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Operations Manager</p>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    backgroundColor: colors.primary,
                    color: 'white',
                    padding: '1.5rem 3rem',
                    fontSize: '0.8rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '1rem',
                    margin: '0 -3rem -2.5rem -3rem' // Negative margin to stretch full width
                }} className="print-footer">
                    <div>
                        <h5 style={{ fontWeight: '700', marginBottom: '0.5rem', color: colors.accent }}>Dunat LTD</h5>
                        <p style={{ opacity: 0.8, marginBottom: '0.1rem' }}>Professional Car Rental Services in Nairobi.</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <p style={{ marginBottom: '0.25rem' }}>📍 Nairobi, Kenya | PO Box 12890-00100 GPO</p>
                        <p style={{ marginBottom: '0.25rem' }}>📞 +254 (0) 758 308 292 | ✉️ drive@dunatcarhire.co.ke</p>
                        <p style={{ fontWeight: '700', color: colors.accent }}>www.dunatcarhire.co.ke</p>
                    </div>
                </div>
            </div>

            <div style={{ position: 'absolute', top: '1rem', right: '1rem' }} className="print-hide">
                <PrintButton />
            </div>

            <style>{`
                @media print {
                    @page { size: A4; margin: 0; }
                    body { 
                        background-color: white; 
                        -webkit-print-color-adjust: exact; 
                        print-color-adjust: exact;
                    }
                    .invoice-container {
                        width: 210mm !important;
                        height: 297mm !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        overflow: hidden !important;
                    }
                    .print-hide { display: none !important; }
                    aside { display: none !important; }
                    main { margin: 0 !important; padding: 0 !important; }
                    /* Ensure footer sticks to bottom in print */
                    .print-footer {
                        position: absolute;
                        bottom: 0;
                        left: 0;
                        right: 0;
                    }
                }
            `}</style>
        </div>
    );
}
