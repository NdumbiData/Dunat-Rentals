import React from 'react';
import { Page, Text, View, Document, StyleSheet, Image } from '@react-pdf/renderer';
import { Booking, Car, Invoice, SystemSettings } from '@prisma/client';

// Define styles
const styles = StyleSheet.create({
    page: {
        flexDirection: 'column',
        backgroundColor: '#FFFFFF',
        padding: 40,
        fontFamily: 'Helvetica',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 40,
    },
    companyInfo: {
        flexDirection: 'column',
    },
    companyName: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 5,
        color: '#1e293b',
    },
    companyDetail: {
        fontSize: 10,
        color: '#64748b',
        marginBottom: 2,
    },
    invoiceTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        textAlign: 'right',
    },
    invoiceMeta: {
        marginTop: 10,
        textAlign: 'right',
    },
    metaLabel: {
        fontSize: 10,
        color: '#94a3b8',
    },
    metaValue: {
        fontSize: 12,
        color: '#1e293b',
        marginBottom: 5,
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
        marginBottom: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        paddingBottom: 5,
    },
    row: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    colLabel: {
        width: 100,
        fontSize: 10,
        color: '#64748b',
    },
    colValue: {
        flex: 1,
        fontSize: 10,
        color: '#1e293b',
    },
    table: {
        marginTop: 20,
    },
    tableHeader: {
        flexDirection: 'row',
        backgroundColor: '#f8fafc',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tableRow: {
        flexDirection: 'row',
        padding: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    th: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#475569',
    },
    td: {
        fontSize: 10,
        color: '#1e293b',
    },
    colDesc: { flex: 2 },
    colQty: { width: 60, textAlign: 'center' },
    colPrice: { width: 80, textAlign: 'right' },
    colTotal: { width: 80, textAlign: 'right' },

    totalSection: {
        marginTop: 20,
        alignItems: 'flex-end',
    },
    totalRow: {
        flexDirection: 'row',
        marginBottom: 5,
    },
    totalLabel: {
        width: 100,
        fontSize: 10,
        color: '#64748b',
        textAlign: 'right',
        paddingRight: 10,
    },
    totalValue: {
        width: 100,
        fontSize: 10,
        fontWeight: 'bold',
        textAlign: 'right',
        color: '#1e293b',
    },
    grandTotal: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 5,
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        textAlign: 'center',
        fontSize: 9,
        color: '#94a3b8',
        borderTopWidth: 1,
        borderTopColor: '#e2e8f0',
        paddingTop: 10,
    },
});

interface InvoiceTemplateProps {
    invoice: Invoice;
    booking: Booking;
    car: Car;
    settings: SystemSettings;
}

export const InvoiceTemplate = ({ invoice, booking, car, settings }: InvoiceTemplateProps) => {
    const items = JSON.parse(invoice.items) as { description: string; amount: number }[];
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const vatAmount = (subtotal * settings.vatRate) / 100;
    // Assuming invoice.total is inclusive or exclusive? 
    // Usually total stored in DB is the final amount to pay.
    // Let's assume items are exclusive for calculation or we just show what's there.
    // If items sum up to total, then VAT is included or 0.
    // Let's just display items as is.

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                {/* Header */}
                <View style={styles.header}>
                    <View style={styles.companyInfo}>
                        <Text style={styles.companyName}>{settings.companyName}</Text>
                        <Text style={styles.companyDetail}>{settings.companyAddress || 'Nairobi, Kenya'}</Text>
                        <Text style={styles.companyDetail}>{settings.companyEmail || 'info@dunatcarhire.co.ke'}</Text>
                        <Text style={styles.companyDetail}>{settings.companyPhone || '+254 700 000 000'}</Text>
                    </View>
                    <View>
                        <Text style={styles.invoiceTitle}>INVOICE</Text>
                        <View style={styles.invoiceMeta}>
                            <Text style={styles.metaLabel}>Invoice #</Text>
                            <Text style={styles.metaValue}>{invoice.invoiceNumber || invoice.id.slice(0, 8).toUpperCase()}</Text>
                            <Text style={styles.metaLabel}>Date</Text>
                            <Text style={styles.metaValue}>{new Date(invoice.date).toLocaleDateString()}</Text>
                            <Text style={styles.metaLabel}>Status</Text>
                            <Text style={{ ...styles.metaValue, color: invoice.status === 'Paid' ? '#10b981' : '#f59e0b' }}>
                                {invoice.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Bill To & Vehicle Info */}
                <View style={{ flexDirection: 'row', gap: 40, marginBottom: 30 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>Bill To</Text>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', marginBottom: 4 }}>{booking.customerName}</Text>
                        {/* We don't have client address in Booking model yet, so just name */}
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>Rental Details</Text>
                        <View style={styles.row}>
                            <Text style={styles.colLabel}>Vehicle:</Text>
                            <Text style={styles.colValue}>{car.make} {car.model} ({car.plate})</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.colLabel}>Pick-up:</Text>
                            <Text style={styles.colValue}>{new Date(booking.startDate).toLocaleString()}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text style={styles.colLabel}>Return:</Text>
                            <Text style={styles.colValue}>{new Date(booking.endDate).toLocaleString()}</Text>
                        </View>
                    </View>
                </View>

                {/* Items Table */}
                <View style={styles.table}>
                    <View style={styles.tableHeader}>
                        <Text style={[styles.th, styles.colDesc]}>Description</Text>
                        <Text style={[styles.th, styles.colTotal]}>Amount ({settings.currency})</Text>
                    </View>
                    {items.map((item, index) => (
                        <View key={index} style={styles.tableRow}>
                            <Text style={[styles.td, styles.colDesc]}>{item.description}</Text>
                            <Text style={[styles.td, styles.colTotal]}>{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</Text>
                        </View>
                    ))}
                </View>

                {/* Totals */}
                <View style={styles.totalSection}>
                    <View style={styles.totalRow}>
                        <Text style={styles.totalLabel}>Total</Text>
                        <Text style={[styles.totalValue, styles.grandTotal]}>
                            {settings.currency} {invoice.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </Text>
                    </View>
                </View>

                {/* Payment Info */}
                <View style={{ marginTop: 40 }}>
                    <Text style={styles.sectionTitle}>Payment Details</Text>
                    <Text style={{ fontSize: 10, color: '#1e293b', marginBottom: 2 }}>
                        Bank: {settings.bankDetails || 'N/A'}
                    </Text>
                    <Text style={{ fontSize: 10, color: '#1e293b' }}>
                        M-Pesa Paybill: {settings.mpesaPaybill || 'N/A'}
                    </Text>
                </View>

                {/* Footer */}
                <View style={styles.footer}>
                    <Text>{settings.termsAndConditions || 'Thank you for your business!'}</Text>
                </View>
            </Page>
        </Document>
    );
};
