import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategorieDto } from './dto/create-categorie.dto';
import { UpdateCategorieDto } from './dto/update-categorie.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async create(dto: CreateCategorieDto, utilisateurId?: number) {
    const existing = await this.prisma.categorie.findUnique({
      where: { nom: dto.nom },
    });

    if (existing) {
      throw new BadRequestException('Cette catégorie existe déjà.');
    }

    const nouvelleCategorie = await this.prisma.categorie.create({
      data: {
        nom: dto.nom,
        actif: true,
      },
    });

    await this.logsService.creerLog(
      'CATEGORIE_CREATION',
      `Création de la catégorie '${nouvelleCategorie.nom}' (ID: ${nouvelleCategorie.id}).`,
      utilisateurId,
    );

    return nouvelleCategorie;
  }
  async findAll() {
    return this.prisma.categorie.findMany({
      include: {
        produits: true, 
      },
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: number) {
    const category = await this.prisma.categorie.findUnique({
      where: { id },
      include: { produits: true },
    });

    if (!category) throw new NotFoundException('Catégorie introuvable.');
    return category;
  }

  async update(id: number, dto: UpdateCategorieDto, utilisateurId?: number) {
    const oldCategory = await this.prisma.categorie.findUnique({ where: { id } });
    if (!oldCategory) throw new NotFoundException('Catégorie introuvable pour la mise à jour.');

    try {
      const updatedCategory = await this.prisma.categorie.update({
        where: { id },
        data: {
          nom: dto.nom,
        },
      });

      await this.logsService.creerLog(
        'CATEGORIE_MODIFICATION',
        `Catégorie ID ${id} renommée : '${oldCategory.nom}' est devenu '${updatedCategory.nom}'.`,
        utilisateurId,
      );

      return updatedCategory;
    } catch {
      throw new NotFoundException('Catégorie introuvable pour la mise à jour.');
    }
  }
  async remove(id: number, utilisateurId?: number) {
    const category = await this.prisma.categorie.findUnique({ 
      where: { id },
      include: { produits: true }
    });
    
    if (!category) throw new NotFoundException('Catégorie introuvable pour modification du statut.');

    const futurEtatActif = !category.actif;
    if (!futurEtatActif) {
      const aDesProduitsActifs = category.produits.some(produit => produit.actif === true);
      
      if (aDesProduitsActifs) {
        throw new BadRequestException(
          `Impossible de désactiver la catégorie '${category.nom}' car elle contient encore des produits actifs au catalogue. Désactivez d'abord ses produits.`
        );
      }
    }

    try {
      const updatedCategory = await this.prisma.categorie.update({
        where: { id },
        data: { actif: futurEtatActif },
      });

      const actionLog = futurEtatActif ? 'CATEGORIE_ACTIVATION' : 'CATEGORIE_DESACTIVATION';
      const descriptionLog = futurEtatActif
        ? `La catégorie '${category.nom}' (ID: ${id}) a été réactivée avec succès.`
        : `La catégorie '${category.nom}' (ID: ${id}) a été désactivée (aucun produit actif lié).`;

      await this.logsService.creerLog(actionLog, descriptionLog, utilisateurId);

      return updatedCategory;
    } catch (error) {
      console.error("Erreur lors du basculement du statut de la catégorie :", error);
      throw new BadRequestException('Une erreur est survenue lors de la modification de la catégorie.');
    }
  }
}