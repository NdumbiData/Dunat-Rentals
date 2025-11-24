'use client';

import { useActionState } from 'react';
import { forgotPassword } from '@/app/actions/auth';
import Link from 'next/link';

const initialState = {
    success: false,
    message: '',
};

export default function ForgotPasswordPage() {
    const [state, formAction] = useActionState(forgotPassword, initialState);

    return (
        <div style={{
            display: 'flex',
            minHeight: '100vh',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--background)'
        }}>
            <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
                    Reset Password
                </h1>

                {state?.success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                            {state.message}
                        </div>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
                            Check your email for a link to reset your password.
                        </p>
                        <Link href="/login" className="btn btn-outline" style={{ width: '100%', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                            Back to Login
                        </Link>
                    </div>
                ) : (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
                            Enter your email address and we'll send you a link to reset your password.
                        </p>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                            <input
                                name="email"
                                type="email"
                                className="input"
                                placeholder="Enter email..."
                                required
                            />
                        </div>

                        {state?.message && (
                            <div style={{ color: 'var(--destructive)', fontSize: '0.875rem' }}>
                                {state.message}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Send Reset Link
                        </button>

                        <div style={{ marginTop: '1rem', textAlign: 'center' }}>
                            <Link href="/login" style={{ color: '#94a3b8', fontSize: '0.875rem', textDecoration: 'none' }}>
                                Back to Login
                            </Link>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
