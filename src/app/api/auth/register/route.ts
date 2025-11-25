import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateOTP, sendOTP } from "@/lib/auth";  // Import sendOTP too

export async function POST(req: Request) {
  try {
    const { email, referralCode } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
    }

    // Optional: Rate limit (e.g., 3 attempts/5min per IP—use Upstash Redis)
    // const ip = req.headers.get('x-forwarded-for') || 'anonymous';
    // if (await isRateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    // Send email FIRST (fail-fast if email fails)
    await sendOTP(email, otp);

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      await prisma.user.update({
        where: { email },
        data: { otp, otpExpires },
      });
    } else {
      const referrer = referralCode
        ? await prisma.user.findUnique({ where: { referralCode } })
        : null;

      if (referralCode && !referrer) {
        return NextResponse.json({ error: "Invalid referral code" }, { status: 400 });
      }

      await prisma.user.create({
        data: {
          email,
          otp,
          otpExpires,
          referredBy: referrer ? referralCode : null,
        },
      });
    }

    console.log(`OTP sent to ${email}: ${otp}`);  // Don't log in prod!

    return NextResponse.json({ message: "OTP sent successfully! Check your email (including spam)." });

  } catch (error: any) {
    console.error("Register error:", error.message || error);
    return NextResponse.json(
      { error: error.message?.includes('OTP') ? "Failed to send OTP—try again" : "Internal server error" },
      { status: 500 }
    );
  }
}