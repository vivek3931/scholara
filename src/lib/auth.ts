import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';  // For sendOTP
import { cookies } from 'next/headers';
import { prisma } from './db';  // Import if needed for verifyOTP

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-prod';

export interface SessionPayload {
    userId: string;
    email: string;
    role: string;
    isPro: boolean;
    iat?: number;
    exp?: number;
}

export function generateToken(payload: Omit<SessionPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): SessionPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as SessionPayload;
    } catch (error) {
        console.error('Token verification failed:', error);
        return null;
    }
}

export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();  // 6-digit
}

// New: Send OTP via email (Nodemailer)
export async function sendOTP(email: string, otp: string): Promise<void> {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        throw new Error('Email config missing—check .env.local');
    }

    const transporter = nodemailer.createTransport({
        service: 'gmail',  // Or 'sendgrid' etc.
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: `"Scholara Team" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Scholara Verification Code',
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome to Scholara!</h2>
        <p>Your one-time verification code is:</p>
        <div style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
        <p style="color: #666;">This code expires in 10 minutes. Don't share it with anyone.</p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #eee;">
        <p style="color: #999; font-size: 12px;">&copy; 2025 Scholara. All rights reserved.</p>
      </div>
    `,
        text: `Your Scholara OTP: ${otp}. Expires in 10 minutes.`,
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error('Email send failed:', error);
        throw new Error(`Failed to send OTP: ${(error as Error).message}`);
    }
}

// New: Verify OTP (call this in your /verify route before token generation)
export async function verifyOTP(email: string, providedOTP: string): Promise<{ userId: string; role: string; isPro: boolean } | null> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: { id: true, role: true, otp: true, otpExpires: true, isPro: true },
    });

    if (
        !user ||
        user.otp !== providedOTP ||
        !user.otpExpires ||
        user.otpExpires < new Date()
    ) {
        return null;  // Invalid/expired
    }

    // Clear OTP after success
    await prisma.user.update({
        where: { email },
        data: { otp: null, otpExpires: null },
    });

    return { userId: user.id, role: user.role, isPro: user.isPro };
}

export async function getSession(): Promise<SessionPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;  // Note: You had 'authToken' earlier—standardize to 'token'
    if (!token) return null;
    return verifyToken(token);
}