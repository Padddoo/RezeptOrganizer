import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create default categories
  const categories = [
    { name: 'Vorspeise', color: '#14b8a6' },
    { name: 'Hauptgang', color: '#22c55e' },
    { name: 'Dessert', color: '#ec4899' },
    { name: 'Beilage', color: '#f59e0b' },
    { name: 'Suppe', color: '#f97316' },
    { name: 'Salat', color: '#84cc16' },
    { name: 'Snack', color: '#8b5cf6' },
    { name: 'Getränk', color: '#06b6d4' },
    { name: 'Italienisch', color: '#ef4444' },
    { name: 'Asiatisch', color: '#e11d48' },
    { name: 'Deutsch', color: '#6366f1' },
    { name: 'Vegetarisch', color: '#22c55e' },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log('Seed complete: default categories created');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
