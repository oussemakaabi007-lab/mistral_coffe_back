import { PrismaClient, Role, TypePoste } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding Café Mistral database...');
  const catBoissonsChaudes = await prisma.categorie.upsert({
    where: { nom: 'Boissons Chaudes' },
    update: {},
    create: { nom: 'Boissons Chaudes' },
  });

  const catBoissonsFroides = await prisma.categorie.upsert({
    where: { nom: 'Boissons Froides' },
    update: {},
    create: { nom: 'Boissons Froides' },
  });

  const grainsCafe = await prisma.ingredient.upsert({
    where: { nom: 'Grains de Café' },
    update: {},
    create: { nom: 'Grains de Café', quantiteStock: 5000, uniteMesure: 'g' },
  });

  const lait = await prisma.ingredient.upsert({
    where: { nom: 'Lait' },
    update: {},
    create: { nom: 'Lait', quantiteStock: 10000, uniteMesure: 'ml' },
  });
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash('123', salt);

  const adminUser = await prisma.utilisateur.upsert({
    where: { nomUtilisateur: 'admin' },
    update: {},
    create: {
      nomUtilisateur: 'admin',
      motDePasse: hashedPassword,
      role: Role.ADMIN,
    },
  });
  await prisma.produit.upsert({
    where: { nom: 'Espresso' },
    update: {},
    create: {
      nom: 'Espresso',
      prix: 2.500,
      categorieId: catBoissonsChaudes.id,
      imageUrl: 'https://images.unsplash.com/photo-1510707577719-fa7413f0a6d2',
      recette: {
        create: [
          { ingredientId: grainsCafe.id, quantiteRequise: 18 },
        ],
      },
    },
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });