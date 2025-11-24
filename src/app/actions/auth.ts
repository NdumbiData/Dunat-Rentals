'use server';

import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const signupSchema = z.object({
    name: z.string().min(1, "Name is required"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginSchema = z.object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
});

export async function signup(prevState: any, formData: FormData) {
    const rawData = {
        name: formData.get('name'),
        email: formData.get('email'),
        password: formData.get('password'),
    };

    const validatedFields = signupSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { name, email, password } = validatedFields.data;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return { success: false, message: "Email already in use." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: 'Owner', // Default role for new signups
            }
        });

        // Auto-login after signup
        const cookieStore = await cookies();
        cookieStore.set('session_user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

    } catch (error) {
        console.error("Signup error:", error);
        return { success: false, message: "Failed to create account." };
    }

    redirect('/');
}

export async function login(prevState: any, formData: FormData) {
    const rawData = {
        email: formData.get('email'),
        password: formData.get('password'),
    };

    const validatedFields = loginSchema.safeParse(rawData);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Validation failed",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { email, password } = validatedFields.data;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
            // If user has no password (legacy), they can't login via password yet.
            // Or we could handle legacy login here if needed, but let's assume password is required.
            return { success: false, message: "Invalid email or password." };
        }

        const isValid = await bcrypt.compare(password, user.password);

        if (!isValid) {
            return { success: false, message: "Invalid email or password." };
        }

        const cookieStore = await cookies();
        cookieStore.set('session_user_id', user.id, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
        });

    } catch (error) {
        console.error("Login error:", error);
        return { success: false, message: "Failed to login." };
    }

    redirect('/');
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('session_user_id');
    redirect('/login');
}

export async function forgotPassword(prevState: any, formData: FormData) {
    const email = formData.get('email') as string;

    if (!email) {
        return { success: false, message: "Email is required." };
    }

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Don't reveal if user exists
            return { success: true, message: "If an account exists, a reset link has been sent." };
        }

        // Generate simple token (in production use crypto.randomBytes)
        const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
        const expiry = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry
            }
        });

        // Mock Email Sending
        console.log(`[MOCK EMAIL] Password Reset Link for ${email}: http://localhost:3000/reset-password?token=${token}`);

        return { success: true, message: "If an account exists, a reset link has been sent." };

    } catch (error) {
        console.error("Forgot password error:", error);
        return { success: false, message: "Something went wrong." };
    }
}

export async function resetPassword(prevState: any, formData: FormData) {
    const token = formData.get('token') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
        return { success: false, message: "Passwords do not match." };
    }

    if (password.length < 6) {
        return { success: false, message: "Password must be at least 6 characters." };
    }

    try {
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: { gt: new Date() }
            }
        });

        if (!user) {
            return { success: false, message: "Invalid or expired reset token." };
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        return { success: true, message: "Password reset successfully. You can now login." };

    } catch (error) {
        console.error("Reset password error:", error);
        return { success: false, message: "Failed to reset password." };
    }
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('session_user_id')?.value;

        if (!userId) return null;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                // ownerCarIds removed
                createdAt: true,
                updatedAt: true,
                // Exclude password and tokens
            }
        });

        return user;
    } catch (error) {
        return null;
    }
}
