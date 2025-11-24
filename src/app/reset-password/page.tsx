'use client';

import { useActionState, Suspense } from 'react';
import { resetPassword } from '@/app/actions/auth';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

const initialState = {
    success: false,
    message: '',
};

function ResetPasswordContent() {
    const [state, formAction] = useActionState(resetPassword, initialState);
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    if (!token) {
        return (
            <div style={{
                display: 'flex',
                minHeight: '100vh',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'var(--background)'
            }}>
                <div className="card" style={{ width: '100%', maxWidth: '400px', textAlign: 'center' }}>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>Invalid Link</h1>
                    <p style={{ color: '#94a3b8', marginBottom: '1.5rem' }}>This password reset link is invalid or missing.</p>
                    <Link href="/login" className="btn btn-primary">
                        Back to Login
                    </Link>
                </div>
            </div>
        );
    }

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
                    Set New Password
                </h1>

                {state?.success ? (
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ color: 'var(--success)', marginBottom: '1rem' }}>
                            {state.message}
                        </div>
                        <Link href="/login" className="btn btn-primary" style={{ width: '100%', textDecoration: 'none', display: 'inline-block', textAlign: 'center' }}>
                            Login with New Password
                        </Link>
                    </div>
                ) : (
                    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <input type="hidden" name="token" value={token} />

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>New Password</label>
                            <input
                                name="password"
                                type="password"
                                className="input"
                                placeholder="Enter new password..."
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Confirm Password</label>
                            <input
                                name="confirmPassword"
                                type="password"
                                className="input"
                                placeholder="Confirm new password..."
                                required
                                minLength={6}
                            />
                        </div>

                        {state?.message && (
                            <div style={{ color: 'var(--destructive)', fontSize: '0.875rem' }}>
                                {state.message}
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            Reset Password
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div style={{ display: 'flex', minHeight: '100vh', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>}>
            <ResetPasswordContent />
        </Suspense>
    );
}
