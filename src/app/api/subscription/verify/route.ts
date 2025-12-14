import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planType
        } = await req.json();

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || "")
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Calculate subscription end date
            const now = new Date();
            let subscriptionEnd = new Date();

            if (planType === 'MONTHLY') {
                subscriptionEnd.setMonth(now.getMonth() + 1);
            } else if (planType === 'YEARLY') {
                subscriptionEnd.setFullYear(now.getFullYear() + 1);
            }

            // Update User
            await prisma.user.update({
                where: { email: session.email },
                data: {
                    isPro: true,
                    subscriptionEnd: subscriptionEnd,
                    transactions: {
                        create: {
                            amount: planType === 'MONTHLY' ? 149 : 1548,
                            userId: session.userId, // Need userId for transaction relation
                            type: 'SUBSCRIPTION_' + planType
                        }
                    }
                }
            });

            return NextResponse.json({ success: true, message: 'Subscription activated!' });
        } else {
            return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
        }

    } catch (error) {
        console.error('Verification Error:', error);
        return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
    }
}
