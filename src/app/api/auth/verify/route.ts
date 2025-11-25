import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/auth";
import { cookies } from "next/headers";

export async function POST(req: Request) {
    try {
        const { email, otp } = await req.json();

        if (!email || !otp || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || otp.length !== 6) {
            return NextResponse.json({ error: "Valid email and 6-digit OTP required" }, { status: 400 });
        }

        const user = await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                role: true,
                otp: true,
                otpExpires: true,
                referredBy: true,
                coins: true  // For bonus calc
            }
        });

        if (!user || !user.otp || !user.otpExpires || user.otp !== otp || new Date() > user.otpExpires) {
            return NextResponse.json({ error: "Invalid or expired OTP" }, { status: 400 });
        }

        // Clear OTP
        await prisma.user.update({
            where: { id: user.id },
            data: { otp: null, otpExpires: null },
        });

        let bonusMessage = '';

        // Check for initial bonus (only once per user)
        const initialTx = await prisma.transaction.findFirst({
            where: {
                userId: user.id,
                type: 'INITIAL_BONUS'
            },
        });

        if (!initialTx) {
            // Award initial 80 coins
            await prisma.user.update({
                where: { id: user.id },
                data: { coins: { increment: 80 } },
            });
            await prisma.transaction.create({
                data: {
                    userId: user.id,
                    amount: 80,
                    type: 'INITIAL_BONUS',
                },
            });
            bonusMessage += ' +80 initial coins';

            // Handle Referral Bonus (20 each, only if referred and not already awarded)
            if (user.referredBy) {
                const referrer = await prisma.user.findUnique({
                    where: { referralCode: user.referredBy }
                });
                if (referrer) {
                    // Referrer bonus
                    await prisma.user.update({
                        where: { id: referrer.id },
                        data: { coins: { increment: 20 } },
                    });
                    await prisma.transaction.create({
                        data: {
                            userId: referrer.id,
                            amount: 20,
                            type: 'REFERRAL_BONUS',
                        },
                    });

                    // Referee bonus (additional to initial)
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { coins: { increment: 20 } },
                    });
                    await prisma.transaction.create({
                        data: {
                            userId: user.id,
                            amount: 20,
                            type: 'REFERRAL_BONUS',
                        },
                    });

                    bonusMessage += ' +20 referral bonus (you & friend)';
                    console.log(`Referral bonus awarded: ${user.email} <- ${referrer.email}`);
                }
            }
        }

        // Generate & set token
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role
        });

        // Safe user response (no sensitive fields)
        const safeUser = {
            id: user.id,
            email: user.email,
            role: user.role,
            coins: user.coins + (bonusMessage ? 100 : 80),  // Reflect bonuses
            message: bonusMessage || 'Welcome back!'
        };

        const response = NextResponse.json({
            message: `Login successful${bonusMessage ? `! ${bonusMessage}` : ''}`,
            user: safeUser
        });

        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 60 * 60 * 24 * 7,  // 7 days
            path: '/',
            sameSite: 'lax',
        });

        return response;

    } catch (error: any) {
        console.error("Verify error:", error.message || error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}