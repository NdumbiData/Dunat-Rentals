'use client';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            style={{
                backgroundColor: '#3b82f6',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: 'pointer',
                fontWeight: '500'
            }}
            className="print-hide"
        >
            Print Invoice
        </button>
    );
}
