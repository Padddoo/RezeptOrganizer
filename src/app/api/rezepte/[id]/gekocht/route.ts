import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const now = new Date();

    // Update lastCookedAt AND create a cooking log entry
    const [recipe] = await prisma.$transaction([
      prisma.recipe.update({
        where: { id: params.id },
        data: { lastCookedAt: now },
        include: {
          categories: {
            include: { category: true },
          },
        },
      }),
      prisma.cookingLog.create({
        data: {
          recipeId: params.id,
          cookedAt: now,
        },
      }),
    ]);

    return NextResponse.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
    });
  } catch (error) {
    console.error('Mark cooked error:', error);
    return NextResponse.json({ error: 'Fehler' }, { status: 500 });
  }
}
