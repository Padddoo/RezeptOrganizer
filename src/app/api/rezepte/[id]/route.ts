import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { unlink } from 'fs/promises';
import { join } from 'path';

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
      include: {
        categories: {
          include: { category: true },
        },
      },
    });

    if (!recipe) {
      return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 });
    }

    return NextResponse.json({
      ...recipe,
      ingredients: JSON.parse(recipe.ingredients),
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, ingredients, categoryIds, lastCookedAt } = body;

    const data: Record<string, unknown> = {};
    if (title !== undefined) data.title = title;
    if (ingredients !== undefined)
      data.ingredients = JSON.stringify(ingredients);
    if (lastCookedAt !== undefined) data.lastCookedAt = new Date(lastCookedAt);

    if (categoryIds !== undefined) {
      await prisma.recipeCategory.deleteMany({
        where: { recipeId: params.id },
      });
      if (categoryIds.length > 0) {
        await prisma.recipeCategory.createMany({
          data: categoryIds.map((id: string) => ({
            recipeId: params.id,
            categoryId: id,
          })),
        });
      }
    }

    const recipe = await prisma.recipe.update({
      where: { id: params.id },
      data,
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
    console.error('Update recipe error:', error);
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipe = await prisma.recipe.findUnique({
      where: { id: params.id },
    });

    if (recipe?.fileUrl) {
      try {
        const filePath = join(process.cwd(), 'public', recipe.fileUrl);
        await unlink(filePath);
      } catch {
        // File may not exist, continue
      }
    }

    await prisma.recipe.delete({ where: { id: params.id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete recipe error:', error);
    return NextResponse.json({ error: 'Fehler beim Löschen' }, { status: 500 });
  }
}
