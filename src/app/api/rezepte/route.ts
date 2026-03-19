import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const sort = searchParams.get('sort') || 'newest';

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { ingredients: { contains: search } },
        { ocrRawText: { contains: search } },
      ];
    }

    if (category) {
      where.categories = {
        some: { categoryId: category },
      };
    }

    let orderBy: Record<string, string>;
    switch (sort) {
      case 'oldest':
        orderBy = { createdAt: 'asc' };
        break;
      case 'last_cooked':
        orderBy = { lastCookedAt: 'asc' };
        break;
      case 'title':
        orderBy = { title: 'asc' };
        break;
      default:
        orderBy = { createdAt: 'desc' };
    }

    const recipes = await prisma.recipe.findMany({
      where,
      orderBy,
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    const parsed = recipes.map((r) => ({
      ...r,
      ingredients: JSON.parse(r.ingredients),
    }));

    return NextResponse.json(parsed);
  } catch (error) {
    console.error('Fetch recipes error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, ingredients, ocrRawText, fileUrl, fileType, categoryIds } = body;

    const recipe = await prisma.recipe.create({
      data: {
        title,
        ingredients: JSON.stringify(ingredients || []),
        ocrRawText: ocrRawText || null,
        fileUrl: fileUrl || null,
        fileType: fileType || null,
        categories: categoryIds?.length
          ? {
              create: categoryIds.map((id: string) => ({
                categoryId: id,
              })),
            }
          : undefined,
      },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    return NextResponse.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
    });
  } catch (error) {
    console.error('Create recipe error:', error);
    return NextResponse.json({ error: 'Fehler beim Erstellen' }, { status: 500 });
  }
}
