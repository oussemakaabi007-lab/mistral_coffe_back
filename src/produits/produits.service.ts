import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { LogsService } from '../logs/logs.service';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class ProduitsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private cloudinaryService: CloudinaryService,
  ) {}

  // Helper method to extract the public ID from a Cloudinary URL
  private extractPublicId(url: string): string | null {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
      const parts = url.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex === -1 || uploadIndex === parts.length - 1) return null;

      let assetParts = parts.slice(uploadIndex + 1);
      if (assetParts[0].startsWith('v') && !isNaN(Number(assetParts[0].substring(1)))) {
        assetParts = assetParts.slice(1);
      }

      const fullPath = assetParts.join('/');
      const lastDot = fullPath.lastIndexOf('.');
      return lastDot !== -1 ? fullPath.substring(0, lastDot) : fullPath;
    } catch (error) {
      return null;
    }
  }

  async create(dto: CreateProduitDto, utilisateurId?: number) {
    const existing = await this.prisma.produit.findUnique({
      where: { nom: dto.nom },
    });

    if (existing) {
      throw new BadRequestException('Un article porte déjà ce nom au catalogue.');
    }

    const validRecette = dto.recette?.filter(
      r => r.ingredientId !== undefined && 
           r.ingredientId !== null && 
           !isNaN(r.ingredientId) && 
           r.quantiteRequise !== undefined && 
           r.quantiteRequise !== null && 
           !isNaN(r.quantiteRequise)
    ) || [];
    
    const nouveauProduit = await this.prisma.produit.create({
      data: {
        nom: dto.nom,
        prix: dto.prix,
        remise: dto.remise || 0,
        imageUrl: dto.imageUrl || null,
        categorieId: dto.categorieId,
        actif: true,
        recette: validRecette.length > 0 ? {
          create: validRecette.map(r => ({
            ingredientId: r.ingredientId,
            quantiteRequise: r.quantiteRequise,
          })),
        } : undefined,
      },
      include: {
        categorie: true,
        recette: { include: { ingredient: true } },
      },
    });

    await this.logsService.creerLog(
      'PRODUIT_CREATION',
      `Nouvel article ajouté au catalogue : '${nouveauProduit.nom}' (Prix: ${Number(nouveauProduit.prix).toFixed(3)} DT, Catégorie ID: ${nouveauProduit.categorieId}).`,
      utilisateurId,
    );

    return nouveauProduit;
  }

  async findAll() {
    return this.prisma.produit.findMany({
      include: {
        categorie: true,
        recette: { include: { ingredient: true } },
      },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: number) {
    const product = await this.prisma.produit.findUnique({
      where: { id },
      include: {
        categorie: true,
        recette: { include: { ingredient: true } },
      },
    });

    if (!product) throw new NotFoundException('Article introuvable.');
    return product;
  }

  async update(id: number, dto: UpdateProduitDto, utilisateurId?: number) {
    const { recette, ...productData } = dto;

    const productBeforeUpdate = await this.prisma.produit.findUnique({ where: { id } });
    if (!productBeforeUpdate) throw new NotFoundException('Article introuvable pour la mise à jour.');

    // 🔄 Cleanup old picture from Cloudinary if a new one is uploaded
    if (dto.imageUrl && productBeforeUpdate.imageUrl && productBeforeUpdate.imageUrl !== dto.imageUrl) {
      const oldPublicId = this.extractPublicId(productBeforeUpdate.imageUrl);
      if (oldPublicId) {
        this.cloudinaryService.deleteFile(oldPublicId).catch((err) => {
          console.error(`Failed to delete old image (${oldPublicId}) from Cloudinary:`, err);
        });
      }
    }

    const validRecette = recette?.filter(
      r => r.ingredientId !== undefined && 
           r.ingredientId !== null && 
           !isNaN(r.ingredientId) && 
           r.quantiteRequise !== undefined && 
           r.quantiteRequise !== null && 
           !isNaN(r.quantiteRequise)
    );

    return this.prisma.$transaction(async (tx) => {
      if (validRecette) {
        await tx.compositionRecette.deleteMany({
          where: { produitId: id },
        });
      }

      const updatedProduct = await tx.produit.update({
        where: { id },
        data: {
          ...productData,
          recette: validRecette && validRecette.length > 0 ? {
            create: validRecette.map(r => ({
              ingredientId: r.ingredientId,
              quantiteRequise: r.quantiteRequise,
            })),
          } : undefined,
        },
        include: {
          categorie: true,
          recette: { include: { ingredient: true } },
        },
      });

      const changeDetails = productBeforeUpdate.nom !== updatedProduct.nom 
        ? `Nom changé de '${productBeforeUpdate.nom}' à '${updatedProduct.nom}'` 
        : `Mise à jour des informations pour l'article '${updatedProduct.nom}'`;

      await this.logsService.creerLog(
        'PRODUIT_MODIFICATION',
        `${changeDetails} (ID: ${id}, Nouveau Prix: ${Number(updatedProduct.prix).toFixed(3)} DT).`,
        utilisateurId,
      );

      return updatedProduct;
    } , {
      timeout: 10000,
    });
  }
  async remove(id: number, utilisateurId?: number) {
    const product = await this.prisma.produit.findUnique({ 
      where: { id },
      include: { categorie: true } 
    });
    
    if (!product) throw new NotFoundException('Article introuvable pour modification du statut.');

    const nouvelEtatActif = !product.actif;

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (nouvelEtatActif && product.categorie && !product.categorie.actif) {
          await tx.categorie.update({
            where: { id: product.categorieId },
            data: { actif: true },
          });

          await this.logsService.creerLog(
            'CATEGORIE_ACTIVATION',
            `Activation automatique de la catégorie '${product.categorie.nom}' suite à la réactivation du produit '${product.nom}'.`,
            utilisateurId,
          );
        }

        const updatedProduct = await tx.produit.update({
          where: { id },
          data: { actif: nouvelEtatActif },
          include: {
            categorie: true,
            recette: { include: { ingredient: true } },
          },
        });

        const actionLog = nouvelEtatActif ? 'PRODUIT_ACTIVATION' : 'PRODUIT_DESACTIVATION';
        const descriptionLog = nouvelEtatActif
          ? `Le produit '${product.nom}' (ID: ${id}) a été réactivé et réapparaît sur la caisse.`
          : `Le produit '${product.nom}' (ID: ${id}) a été désactivé pour préserver l'historique de vente.`;

        await this.logsService.creerLog(actionLog, descriptionLog, utilisateurId);

        return updatedProduct;
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du statut du produit et de sa catégorie :", error);
      throw new BadRequestException('Impossible de modifier le statut de disponibilité de cet article.');
    }
  }
}