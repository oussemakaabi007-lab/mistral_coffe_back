import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class IngredientsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async create(dto: CreateIngredientDto, utilisateurId?: number) {
    const existing = await this.prisma.ingredient.findUnique({
      where: { nom: dto.nom },
    });

    if (existing) {
      throw new BadRequestException('Cet ingrédient existe déjà dans le système.');
    }

    const nouvelIngredient = await this.prisma.ingredient.create({
      data: dto,
    });
    await this.logsService.creerLog(
      'STOCK_CREATION',
      `Nouvel ingrédient ajouté au catalogue : '${nouvelIngredient.nom}' (Stock initial: ${nouvelIngredient.quantiteStock} ${nouvelIngredient.uniteMesure}).`,
      utilisateurId,
    );

    return nouvelIngredient;
  }

  async findAll() {
    return this.prisma.ingredient.findMany({
      orderBy: { nom: 'asc' },
    });
  }

  async findOne(id: number) {
    const ingredient = await this.prisma.ingredient.findUnique({
      where: { id },
    });

    if (!ingredient) throw new NotFoundException('Ingrédient introuvable.');
    return ingredient;
  }

  async update(id: number, dto: UpdateIngredientDto, utilisateurId?: number) {
    const oldIngredient = await this.findOne(id);
    if (dto.nom) {
      const nameConflict = await this.prisma.ingredient.findFirst({
        where: { nom: dto.nom, NOT: { id } },
      });
      if (nameConflict) {
        throw new BadRequestException('Un autre ingrédient porte déjà ce nom.');
      }
    }

    const updatedIngredient = await this.prisma.ingredient.update({
      where: { id },
      data: dto,
    });
    const nomModifie = oldIngredient.nom !== updatedIngredient.nom ? ` (Anciennement: '${oldIngredient.nom}')` : '';
    await this.logsService.creerLog(
      'STOCK_MODIFICATION',
      `Fiche de l'ingrédient '${updatedIngredient.nom}' modifiée${nomModifie}.`,
      utilisateurId,
    );

    return updatedIngredient;
  }

  async adjustStock(id: number, dto: UpdateStockDto, utilisateurId?: number) {
    try {
      const updatedIngredient = await this.prisma.ingredient.update({
        where: { id },
        data: {
          quantiteStock: {
            increment: dto.quantiteAjoutee,
          },
        },
      });
      const actionType = dto.quantiteAjoutee >= 0 ? 'Réapprovisionnement' : 'Ajustement négatif';
      const quantiteAbsolue = Math.abs(dto.quantiteAjoutee);
      await this.logsService.creerLog(
        'STOCK_AJUSTEMENT',
        `${actionType} pour '${updatedIngredient.nom}' : ${dto.quantiteAjoutee >= 0 ? '+' : '-'}${quantiteAbsolue} ${updatedIngredient.uniteMesure} (Nouveau stock: ${updatedIngredient.quantiteStock} ${updatedIngredient.uniteMesure}).`,
        utilisateurId,
      );

      return updatedIngredient;
    } catch {
      throw new NotFoundException('Incapacité à ajuster le stock. Ingrédient introuvable.');
    }
  }

  async findLowStockAlerts() {
    const ingredients = await this.prisma.ingredient.findMany({
      orderBy: { quantiteStock: 'asc' },
    }) as Array<{ id: number; nom: string; quantiteStock: number; seuilAlerte: number; uniteMesure: string }>;

    return ingredients.filter(
      (ingredient) => ingredient.quantiteStock <= ingredient.seuilAlerte
    );
  }

  async remove(id: number, utilisateurId?: number) {
    const ingredient = await this.prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) throw new NotFoundException('Ingrédient introuvable pour la suppression.');

    try {
      const deletedIngredient = await this.prisma.ingredient.delete({
        where: { id },
      });
      await this.logsService.creerLog(
        'STOCK_SUPPRESSION',
        `Suppression définitive de l'ingrédient '${ingredient.nom}' (ID: ${id}) du système de gestion.`,
        utilisateurId,
      );

      return deletedIngredient;
    } catch {
      throw new BadRequestException(
        'Impossible de supprimer cet ingrédient. Il est probablement rattaché à une recette active.',
      );
    }
  }
}