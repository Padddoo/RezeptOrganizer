import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString());
    const month = parseInt(searchParams.get('month') || (new Date().getMonth() + 1).toString());

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    const logs = await prisma.cookingLog.findMany({
      where: {
        cookedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        recipe: {
          select: {
            id: true,
            title: true,
            categories: {
              include: { category: true },
            },
          },
        },
      },
      orderBy: { cookedAt: 'asc' },
    });

    return NextResponse.json(logs);
  } catch (error) {
    console.error('Calendar error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}
