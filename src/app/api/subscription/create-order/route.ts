import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session || !session.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planType } = await req.json(); // 'MONTHLY' or 'YEARLY'

        let amount = 0;
        if (planType === 'MONTHLY') {
            amount = 149 * 100; // ₹149 in paise
        } else if (planType === 'YEARLY') {
            amount = 1548 * 100; // ₹1548 in paise
        } else {
            return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
        }

        const options = {
            amount: amount,
            currency: 'INR',
            receipt: `rcpt_${Date.now()}_${session.userId.slice(0, 5)}`,
            notes: {
                userId: session.userId,
                planType: planType
            }
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error('Razorpay Error:', error);
        return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }
}
