import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const session = await getSession();
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { username, password } = await req.json();

        const updateData: any = {};

        if (username) {
            // Check if username is taken
            const existingUser = await prisma.user.findUnique({
                where: { username },
            });
            if (existingUser && existingUser.id !== session.userId) {
                return NextResponse.json({ error: 'Username already taken' }, { status: 400 });
            }
            updateData.username = username;
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateData.password = hashedPassword;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ message: 'No changes made' });
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.userId },
            data: updateData,
            select: { id: true, email: true, username: true, role: true, coins: true },
        });

        return NextResponse.json({ user: updatedUser, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
