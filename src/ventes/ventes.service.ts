import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TypePoste, Role } from '@prisma/client';
import { EnregistrerSaisieDto } from './dto/enregistrer-saisie.dto';
import { LogsService } from '../logs/logs.service';
import { CommandeGateway } from '../commande/commande.gateway';
@Injectable()
export class VentesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logsService: LogsService,
    private readonly commandeGateway: CommandeGateway,
  ) {}

  async obtenirSaisieParTypePoste(type: TypePoste) {
  const aujourdhui = new Date();
  aujourdhui.setHours(0, 0, 0, 0);

  const sessions = await this.prisma.sessionPoste.findMany({
    where: {
      type: type,
      dateOuverture: { gte: aujourdhui },
    },
    include: {
      ventes: {
        include: { 
          lignes: true,
          utilisateur: true 
        },
      },
    },
  });

  const serveursMap: Record<number, number> = {};
  const comptoirMap: Record<number, number> = {};
    
  for (const session of sessions) {
    for (const sale of session.ventes) {
      for (const ligne of sale.lignes) {
        const isRoleComptoir = sale.utilisateur?.role === Role.ADMIN || 
                               sale.utilisateur?.role === Role.GERANT;
        
        if (isRoleComptoir) {
          comptoirMap[ligne.produitId] = (comptoirMap[ligne.produitId] || 0) + ligne.quantite;
        } else {
          serveursMap[ligne.produitId] = (serveursMap[ligne.produitId] || 0) + ligne.quantite;
        }
      }
    }
  }

  return {
    serveurs: serveursMap,
    comptoir: comptoirMap,
  };
}

  async sauvegarderSaisiePoste(userId: number, dto: EnregistrerSaisieDto) {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);
    let session = await this.prisma.sessionPoste.findFirst({
      where: {
        utilisateurId: userId,
        type: dto.typePoste,
        dateOuverture: { gte: aujourdhui },
        statut: 'OUVERT',
      },
    });

    if (!session) {
      session = await this.prisma.sessionPoste.create({
        data: {
          type: dto.typePoste,
          fondDeCaisse: 0,
          statut: 'OUVERT',
          utilisateurId: userId,
        },
      });
    }

    const itemsToInsert = dto.items.filter(i => i.quantite > 0);
    if (itemsToInsert.length === 0) {
      throw new BadRequestException("Aucune quantité positive à enregistrer.");
    }
    const produits = await this.prisma.produit.findMany({
      where: { id: { in: itemsToInsert.map(i => i.produitId) } },
      include: {
        recette: {
          include: { ingredient: true }
        }
      }
    });
    let calculatedTotal = 0;
    const lignesData = itemsToInsert.map(item => {
      const prod = produits.find(p => p.id === item.produitId);
      const price = prod ? Number(prod.prix) : 0;
      const discount = prod ? Number(prod.remise) : 0;
      
      calculatedTotal += (price - discount) * item.quantite;

      return {
        produitId: item.produitId,
        quantite: item.quantite,
      };
    });
    const message = itemsToInsert.map(item => {
    const prod = produits.find(p => p.id === item.produitId);
    return `${prod ? prod.nom : 'Produit inconnu'} x ${item.quantite}`;
  })
  .join('\n');
    const nouvelleVente = await this.prisma.$transaction(async (tx) => {
      for (const item of itemsToInsert) {
        const prod = produits.find(p => p.id === item.produitId);
        if (!prod) continue;

        for (const composition of prod.recette) {
          const totalIngredientQtyNeeded = composition.quantiteRequise * item.quantite;
          if (composition.ingredient.quantiteStock < totalIngredientQtyNeeded) {
            throw new BadRequestException(
              `Stock d'ingrédient insuffisant: [${composition.ingredient.nom}] pour fabriquer [${prod.nom}]`
            );
          }
          await tx.ingredient.update({
            where: { id: composition.ingredientId },
            data: {
              quantiteStock: {
                decrement: totalIngredientQtyNeeded
              }
            }
          });
        }
      }
      const v=await tx.vente.create({
        data: {
          sessionPosteId: session.id,
          utilisateurId: userId,
          montantTotal: calculatedTotal,
          statut: 'COMPLETED',
          lignes: {
            create: lignesData,
          },
        },
      });
      let user = await tx.utilisateur.findUnique({ where: { id: userId } });
  if (user?.role === Role.SERVEUR) {
    this.commandeGateway.notifyNewOrder({
      data: {
        msg:message,
      }
    });
  }
  return v;
    });

    await this.logsService.creerLog(
      'SAISIE_POSTE',
      `Vente directe (#${nouvelleVente.id}) validée au comptoir. Recette: ${calculatedTotal.toFixed(3)} DT. Ingrédients déduits avec succès.`,
      userId,
    );
    
    return { success: true };
  }

  async getDailyRevenue() {
    const aujourdhui = new Date();
    aujourdhui.setHours(0, 0, 0, 0);

    const sessionsDuJour = await this.prisma.sessionPoste.findMany({
      where: { dateOuverture: { gte: aujourdhui } },
      include: { ventes: true },
    });

    let avantMidiTotal = 0;
    let apresMidiTotal = 0;

    sessionsDuJour.forEach(session => {
      const totalSession = session.ventes.reduce((sum, v) => {
        if (v.statut === 'ANNULEE') return sum;
        return sum + Number(v.montantTotal);
      }, 0);
      
      if (session.type === TypePoste.AVANT_MIDI) {
        avantMidiTotal += totalSession;
      } else if (session.type === TypePoste.APRES_MIDI) {
        apresMidiTotal += totalSession;
      }
    });

    return {
      avantMidi: avantMidiTotal,
      apresMidi: apresMidiTotal,
    };
  }
}