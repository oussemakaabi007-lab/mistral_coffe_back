import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalysesService {
  constructor(private prisma: PrismaService) {}
  private getDateBoundary(periode: 'jour' | 'semaine' | 'mois'): Date {
    const now = new Date();
    const boundary = new Date();
    if (periode === 'jour') {
      boundary.setHours(0, 0, 0, 0);
    } else if (periode === 'semaine') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); 
      boundary.setDate(diff);
      boundary.setHours(0, 0, 0, 0);
    } else if (periode === 'mois') {
      boundary.setDate(1);
      boundary.setHours(0, 0, 0, 0);
    }
    return boundary;
  }
  async getComprehensiveReport(periode: 'jour' | 'semaine' | 'mois') {
    const startDate = this.getDateBoundary(periode);
    const ventes = await this.prisma.vente.findMany({
      where: {
        dateVente: { gte: startDate },
        statut: 'COMPLETED',
      },
      include: {
        utilisateur: { select: { nomUtilisateur: true, role: true } },
        lignes: {
          include: {
            produit: {
              include: {
                recette: {
                  include: {
                    ingredient: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    let totalRevenue = 0;
    const totalOrders = ventes.length;
    const productMap: Record<string, { ventes: number; CA: number }> = {};
    const serverMap: Record<string, { role: string; total: number; count: number }> = {};
    const ingredientMap: Record<string, { quantite: number; unite: string }> = {};
    const repartitionHoraires = {
      "06:00 - 09:59": 0,
      "10:00 - 13:59": 0,
      "14:00 - 17:59": 0,
      "18:00 - 21:59": 0,
      "22:00 - 05:59": 0,
    };
    for (const v of ventes) {
      const priceAmount = Number(v.montantTotal) || 0;
      totalRevenue += priceAmount;
      const saleHour = new Date(v.dateVente).getHours();
      if (saleHour >= 6 && saleHour < 10) {
        repartitionHoraires["06:00 - 09:59"] += 1;
      } else if (saleHour >= 10 && saleHour < 14) {
        repartitionHoraires["10:00 - 13:59"] += 1;
      } else if (saleHour >= 14 && saleHour < 18) {
        repartitionHoraires["14:00 - 17:59"] += 1;
      } else if (saleHour >= 18 && saleHour < 22) {
        repartitionHoraires["18:00 - 21:59"] += 1;
      } else {
        repartitionHoraires["22:00 - 05:59"] += 1;
      }
      const serverName = v.utilisateur?.nomUtilisateur || 'Système/Auto';
      if (!serverMap[serverName]) {
        serverMap[serverName] = { role: v.utilisateur?.role || 'SERVEUR', total: 0, count: 0 };
      }
      serverMap[serverName].total += priceAmount;
      serverMap[serverName].count += 1;
      for (const line of v.lignes) {
        const prodName = line.produit.nom;
        const qty = line.quantite || 0;
        const netPrice = Number(line.produit.prix) - Number(line.produit.remise || 0);
        const lineRevenue = qty * netPrice;

        if (!productMap[prodName]) {
          productMap[prodName] = { ventes: 0, CA: 0 };
        }
        productMap[prodName].ventes += qty;
        productMap[prodName].CA += lineRevenue;

        if (line.produit.recette) {
          for (const composition of line.produit.recette) {
            const ingName = composition.ingredient.nom;
            const targetUnit = composition.ingredient.uniteMesure || 'unite'; 
            const runningQuantity = qty * Number(composition.quantiteRequise);

            if (!ingredientMap[ingName]) {
              ingredientMap[ingName] = { quantite: 0, unite: targetUnit };
            }
            ingredientMap[ingName].quantite += runningQuantity;
          }
        }
      }
    }
    const totalSessions = await this.prisma.sessionPoste.count({
      where: { dateOuverture: { gte: startDate } },
    });
    const closedSessions = await this.prisma.sessionPoste.count({
      where: { dateOuverture: { gte: startDate }, statut: 'FERME' },
    });

    const topProduits = Object.entries(productMap)
      .map(([nom, p]) => ({ nom, ventes: p.ventes, CA: `${p.CA.toFixed(3)} DT` }))
      .sort((a, b) => b.ventes - a.ventes)
      .slice(0, 5);

    const topServeurs = Object.entries(serverMap)
      .map(([nomUtilisateur, s]) => ({
        nomUtilisateur,
        role: s.role,
        totalVentes: `${s.total.toFixed(3)} DT`,
        nombreCommandes: s.count,
      }))
      .sort((a, b) => b.nombreCommandes - a.nombreCommandes);

    const ingredientsImpact = Object.entries(ingredientMap).map(([nomIngredient, i]) => ({
      nomIngredient,
      quantiteEstimee: i.quantite,
      unite: i.unite,
    }));

    const averageBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      stats: {
        chiffreAffaire: `${totalRevenue.toFixed(3)} DT`,
        totalCommandes: totalOrders.toString(),
        panierMoyen: `${averageBasket.toFixed(3)} DT`,
        cloturesValidees: `${closedSessions}/${totalSessions}`,
      },
      topProduits,
      topServeurs,
      ingredientsImpact,
      repartitionHoraires,
    };
  }
  async getGlobalStats(periode: 'jour' | 'semaine' | 'mois') {
    const startDate = this.getDateBoundary(periode);
    const salesData = await this.prisma.vente.aggregate({
      where: { dateVente: { gte: startDate }, statut: 'COMPLETED' },
      _sum: { montantTotal: true },
      _count: { id: true },
    });

    const totalRevenue = salesData._sum.montantTotal ? Number(salesData._sum.montantTotal) : 0;
    const totalOrders = salesData._count.id || 0;
    const averageBasket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    const totalSessions = await this.prisma.sessionPoste.count({
      where: { dateOuverture: { gte: startDate } },
    });
    const closedSessions = await this.prisma.sessionPoste.count({
      where: { dateOuverture: { gte: startDate }, statut: 'FERME' },
    });

    return {
      chiffreAffaire: `${totalRevenue.toFixed(3)} DT`,
      totalCommandes: totalOrders.toString(),
      panierMoyen: `${averageBasket.toFixed(3)} DT`,
      cloturesValidees: `${closedSessions}/${totalSessions}`,
    };
  }

  async getTopProducts(periode: 'jour' | 'semaine' | 'mois') {
    const startDate = this.getDateBoundary(periode);
    const topSalesLines = await this.prisma.ligneVente.groupBy({
      by: ['produitId'],
      where: { vente: { dateVente: { gte: startDate }, statut: 'COMPLETED' } },
      _sum: { quantite: true },
      orderBy: { _sum: { quantite: 'desc' } },
      take: 5,
    });

    const result: Array<{ nom: string; ventes: number; CA: string }> = [];
    for (const line of topSalesLines) {
      const product = await this.prisma.produit.findUnique({
        where: { id: line.produitId },
        select: { nom: true, prix: true, remise: true },
      });

      if (product) {
        const quantitySold = line._sum.quantite || 0;
        const netPrice = Number(product.prix) - Number(product.remise);
        const revenueGenerated = quantitySold * netPrice;

        result.push({
          nom: product.nom,
          ventes: quantitySold,
          CA: `${revenueGenerated.toFixed(3)} DT`,
        });
      }
    }
    return result;
  }

  async getDailyJournal(dateStr: string) {
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    const ventes = await this.prisma.vente.findMany({
      where: { dateVente: { gte: startOfDay, lte: endOfDay } },
      include: {
        utilisateur: { select: { nomUtilisateur: true } },
        lignes: { include: { produit: { select: { nom: true } } } },
        posteid: { select: { sessionPosteId: true } }
      },
      orderBy: { dateVente: 'desc' },
    });

    const logs = await this.prisma.journalLog.findMany({
      where: { timestamp: { gte: startOfDay, lte: endOfDay } },
      include: { utilisateur: { select: { nomUtilisateur: true } } },
      orderBy: { timestamp: 'desc' },
    });

    return {
      ventes: ventes.map(v => ({
        id: v.id,
        heure: v.dateVente.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        serveur: v.utilisateur?.nomUtilisateur || 'Inconnu',
        montant: `${Number(v.montantTotal).toFixed(3)} DT`,
        statut: v.statut,
        details: v.lignes.map(l => `${l.quantite}x ${l.produit.nom}`).join(', '),
      })),
      logs: logs.map(l => ({
        id: l.id,
        heure: l.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        action: l.action,
        description: l.description,
        utilisateur: l.utilisateur?.nomUtilisateur || 'Système',
      }))
    };
  }
}