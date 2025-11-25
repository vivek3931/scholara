import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { checkDuplicate, storeFileHashes } from '@/lib/duplicateCheck';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || !session.userId) {
    return NextResponse.json(
      { error: 'Unauthorized - please log in' },
      { status: 401 }
    );
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body - expected JSON' },
        { status: 400 }
      );
    }

    const { title, description, subject, fileUrl } = body;

    // ========== VALIDATION ==========
    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }
    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }
    if (!subject?.trim()) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }
    if (!fileUrl?.startsWith('https://res.cloudinary.com/')) {
      return NextResponse.json(
        { error: 'Valid file URL is required (Cloudinary upload failed?)' },
        { status: 400 }
      );
    }

    console.log(`📤 Upload attempt by ${session.userId}: ${title}`);

    // ========== NEW: SHA256 + TLSH DUPLICATE CHECK ==========
    const duplicateResult = await checkDuplicate(fileUrl, session.userId);

    if (duplicateResult.isDuplicate) {
      console.log(`❌ Duplicate rejected: ${duplicateResult.reason}`);
      return NextResponse.json(
        {
          error: duplicateResult.reason || 'This file already exists in our database',
          similarity: duplicateResult.similarity,
        },
        { status: 409 } // 409 Conflict
      );
    }

    // ========== CREATE RESOURCE ==========
    const resource = await prisma.resource.create({
      data: {
        title: title.trim(),
        description: description.trim(),
        subject: subject.trim(),
        fileUrl,
        authorId: session.userId,
        status: 'PUBLIC' as const,
      },
    });

    // ========== STORE HASHES ==========
    await storeFileHashes(resource.id, fileUrl);

    // ========== AWARD COINS ==========
    await prisma.user.update({
      where: { id: session.userId },
      data: { coins: { increment: 50 } },
    });

    await prisma.transaction.create({
      data: {
        userId: session.userId,
        amount: 50,
        type: 'UPLOAD_REWARD',
      },
    });

    console.log(`✅ Resource created: ${resource.id}`);

    return NextResponse.json({
      resource,
      message: 'Resource uploaded successfully! +50 coins awarded.',
    });

  } catch (error: any) {
    console.error('Upload error:', error.message || error);
    return NextResponse.json(
      { error: 'Internal server error - please try again' },
      { status: 500 }
    );
  }
}