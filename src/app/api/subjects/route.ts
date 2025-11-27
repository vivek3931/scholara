import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const res = await fetch(
            'https://vivek3931.github.io/subjects-api/subjects.json',
            { next: { revalidate: 3600 } }
        );

        if (!res.ok) {
            return NextResponse.json({ subjects: [] });
        }

        const data = await res.json();
        return NextResponse.json({ subjects: data.subjects || [] });
    } catch (error) {
        console.error('Subjects API error:', error);
        return NextResponse.json({ subjects: [] });
    }
}
