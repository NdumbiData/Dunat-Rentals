'use client';

import { useActionState } from 'react';
import { signup } from '@/app/actions/auth';
import Link from 'next/link';

const initialState = {
    success: false,
    message: '',
};

export default function SignupPage() {
    const [state, formAction] = useActionState(signup, initialState);

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
                    Join Dunat Car Rental
                </h1>

                <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Full Name</label>
                        <input
                            name="name"
                            type="text"
                            className="input"
                            placeholder="John Doe"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Email Address</label>
                        <input
                            name="email"
                            type="email"
                            className="input"
                            placeholder="john@example.com"
                            required
                        />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem' }}>Password</label>
                        <input
                            name="password"
                            type="password"
                            className="input"
                            placeholder="Create a password..."
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
                        Sign Up
                    </button>
                </form>

                <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                    <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Already have an account?</p>
                    <Link href="/login" style={{ color: 'var(--primary)', fontWeight: '500', textDecoration: 'none' }}>
                        Sign In
                    </Link>
                </div>
            </div>
        </div>
    );
}
