/*
  Warnings:

  - You are about to drop the `Categorie` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `EquipeShift` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `LigneVenteDetails` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Produit` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Utilisateur` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Vente` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'GERANT', 'SERVEUR');

-- CreateEnum
CREATE TYPE "TypePoste" AS ENUM ('AVANT_MIDI', 'APRES_MIDI');

-- DropForeignKey
ALTER TABLE "EquipeShift" DROP CONSTRAINT "EquipeShift_idServeur_fkey";

-- DropForeignKey
ALTER TABLE "LigneVenteDetails" DROP CONSTRAINT "LigneVenteDetails_idProduct_fkey";

-- DropForeignKey
ALTER TABLE "LigneVenteDetails" DROP CONSTRAINT "LigneVenteDetails_idVente_fkey";

-- DropForeignKey
ALTER TABLE "Produit" DROP CONSTRAINT "Produit_idCategorie_fkey";

-- DropForeignKey
ALTER TABLE "Vente" DROP CONSTRAINT "Vente_idServeur_fkey";

-- DropForeignKey
ALTER TABLE "Vente" DROP CONSTRAINT "Vente_idShift_fkey";

-- DropTable
DROP TABLE "Categorie";

-- DropTable
DROP TABLE "EquipeShift";

-- DropTable
DROP TABLE "LigneVenteDetails";

-- DropTable
DROP TABLE "Produit";

-- DropTable
DROP TABLE "Utilisateur";

-- DropTable
DROP TABLE "Vente";

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nomUtilisateur" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'SERVEUR',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ingredients" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "quantiteStock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "uniteMesure" TEXT NOT NULL,

    CONSTRAINT "ingredients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prix" DECIMAL(10,3) NOT NULL,
    "imageUrl" TEXT,
    "remise" DECIMAL(10,3) NOT NULL DEFAULT 0.000,
    "categorieId" INTEGER NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "composition_recettes" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "ingredientId" INTEGER NOT NULL,
    "quantiteRequise" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "composition_recettes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions_poste" (
    "id" SERIAL NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "type" "TypePoste" NOT NULL,
    "dateOuverture" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dateFermeture" TIMESTAMP(3),
    "fondDeCaisse" DECIMAL(10,3) NOT NULL,
    "caisseReelle" DECIMAL(10,3),
    "statut" TEXT NOT NULL DEFAULT 'OUVERT',

    CONSTRAINT "sessions_poste_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ventes" (
    "id" SERIAL NOT NULL,
    "dateVente" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "montantTotal" DECIMAL(10,3) NOT NULL,
    "statut" TEXT NOT NULL DEFAULT 'COMPLETED',
    "sessionPosteId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,

    CONSTRAINT "ventes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_vente" (
    "id" SERIAL NOT NULL,
    "venteId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,

    CONSTRAINT "lignes_vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "journal_logs" (
    "id" SERIAL NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilisateurId" INTEGER,

    CONSTRAINT "journal_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_nomUtilisateur_key" ON "utilisateurs"("nomUtilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "ingredients_nom_key" ON "ingredients"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "produits_nom_key" ON "produits"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "composition_recettes_produitId_ingredientId_key" ON "composition_recettes"("produitId", "ingredientId");

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composition_recettes" ADD CONSTRAINT "composition_recettes_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "composition_recettes" ADD CONSTRAINT "composition_recettes_ingredientId_fkey" FOREIGN KEY ("ingredientId") REFERENCES "ingredients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions_poste" ADD CONSTRAINT "sessions_poste_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_sessionPosteId_fkey" FOREIGN KEY ("sessionPosteId") REFERENCES "sessions_poste"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ventes" ADD CONSTRAINT "ventes_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente" ADD CONSTRAINT "lignes_vente_venteId_fkey" FOREIGN KEY ("venteId") REFERENCES "ventes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_vente" ADD CONSTRAINT "lignes_vente_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "journal_logs" ADD CONSTRAINT "journal_logs_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE SET NULL ON UPDATE CASCADE;
