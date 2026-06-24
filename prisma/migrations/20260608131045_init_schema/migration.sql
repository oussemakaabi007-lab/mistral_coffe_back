-- CreateTable
CREATE TABLE "Utilisateur" (
    "id" SERIAL NOT NULL,
    "nomUtilisateur" TEXT NOT NULL,
    "motDePasse" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "dateCreation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Utilisateur_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EquipeShift" (
    "id" SERIAL NOT NULL,
    "periode" TEXT NOT NULL,
    "dateDuJour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idServeur" INTEGER NOT NULL,

    CONSTRAINT "EquipeShift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Categorie" (
    "id" SERIAL NOT NULL,
    "nomCategorie" TEXT NOT NULL,

    CONSTRAINT "Categorie_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Produit" (
    "id" SERIAL NOT NULL,
    "nomProduit" TEXT NOT NULL,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "quantiteStock" INTEGER NOT NULL,
    "seuilAlerte" INTEGER NOT NULL,
    "idCategorie" INTEGER NOT NULL,

    CONSTRAINT "Produit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vente" (
    "id" SERIAL NOT NULL,
    "montantTotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "heureVente" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "idServeur" INTEGER NOT NULL,
    "idShift" INTEGER NOT NULL,

    CONSTRAINT "Vente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LigneVenteDetails" (
    "id" SERIAL NOT NULL,
    "idVente" INTEGER NOT NULL,
    "idProduct" INTEGER NOT NULL,
    "quantite" INTEGER NOT NULL,
    "prixFacture" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "LigneVenteDetails_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Utilisateur_nomUtilisateur_key" ON "Utilisateur"("nomUtilisateur");

-- CreateIndex
CREATE UNIQUE INDEX "Categorie_nomCategorie_key" ON "Categorie"("nomCategorie");

-- AddForeignKey
ALTER TABLE "EquipeShift" ADD CONSTRAINT "EquipeShift_idServeur_fkey" FOREIGN KEY ("idServeur") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produit" ADD CONSTRAINT "Produit_idCategorie_fkey" FOREIGN KEY ("idCategorie") REFERENCES "Categorie"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_idServeur_fkey" FOREIGN KEY ("idServeur") REFERENCES "Utilisateur"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vente" ADD CONSTRAINT "Vente_idShift_fkey" FOREIGN KEY ("idShift") REFERENCES "EquipeShift"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVenteDetails" ADD CONSTRAINT "LigneVenteDetails_idVente_fkey" FOREIGN KEY ("idVente") REFERENCES "Vente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LigneVenteDetails" ADD CONSTRAINT "LigneVenteDetails_idProduct_fkey" FOREIGN KEY ("idProduct") REFERENCES "Produit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
