import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OuvrirSessionDto } from './dto/ouvrir-session.dto';
import { FermerSessionDto } from './dto/fermer-session.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class SessionsPosteService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async ouvrir(utilisateurId: number, dto: OuvrirSessionDto) {
    const activeSession = await this.prisma.sessionPoste.findFirst({
      where: { utilisateurId, statut: 'OUVERT' },
    });

    if (activeSession) {
      throw new BadRequestException('Vous avez déjà une session de poste active non clôturée.');
    }

    const nouvelleSession = await this.prisma.sessionPoste.create({
      data: {
        utilisateurId,
        type: dto.type,
        fondDeCaisse: dto.fondDeCaisse,
        statut: 'OUVERT',
      },
    });

    await this.logsService.creerLog(
      'SESSION_OUVERTURE',
      `Ouverture de la session de caisse #${nouvelleSession.id} (${nouvelleSession.type}). Fond initial : ${Number(nouvelleSession.fondDeCaisse).toFixed(3)} DT.`,
      utilisateurId,
    );

    return nouvelleSession;
  }
  async fermerAutomatique(utilisateurId: number) {
    const session = await this.prisma.sessionPoste.findFirst({
      where: { utilisateurId, statut: 'OUVERT' },
      include: {
        ventes: {
          where: { statut: 'COMPLETED' }
        }
      }
    });
    if (!session) return null;

    const totalVentes = session.ventes.reduce((sum, vente) => sum + Number(vente.montantTotal), 0);
    const caisseReelleAutomatique = Number(session.fondDeCaisse) + totalVentes;

    const updatedSession = await this.prisma.sessionPoste.update({
      where: { id: session.id },
      data: {
        statut: 'FERME',
        dateFermeture: new Date(),
        caisseReelle: caisseReelleAutomatique
      }
    });

    await this.logsService.creerLog(
      'SESSION_CLOTURE',
      `Clôture automatique via déconnexion de la session #${updatedSession.id}. Ventes: ${totalVentes.toFixed(3)} DT. Caisse: ${caisseReelleAutomatique.toFixed(3)} DT.`,
      utilisateurId,
    );

    return updatedSession;
  }

  async findActiveSession(utilisateurId: number) {
    const session = await this.prisma.sessionPoste.findMany({
      where: { statut: 'OUVERT' },
    });
  
    return session;
  }

  async findAll() {
    return this.prisma.sessionPoste.findMany({
      include: { utilisateur: { select: { nomUtilisateur: true, role: true } } },
      orderBy: { dateOuverture: 'desc' },
    });
  }

  async fermer(id: number, dto: FermerSessionDto) {
    const session = await this.prisma.sessionPoste.findUnique({
      where: { id: id },
      include: {
        ventes: {
          where: { statut: 'COMPLETED' }
        }
      }
    });

    if (!session) {
      throw new NotFoundException("Session introuvable");
    }

    if (session.statut === 'FERME') {
      throw new BadRequestException("La session est déjà clôturée");
    }

    const totalVentes = session.ventes.reduce((sum, vente) => sum + Number(vente.montantTotal), 0);
    const caisseReelleAutomatique = Number(session.fondDeCaisse) + totalVentes;

    const updatedSession = await this.prisma.sessionPoste.update({
      where: { id: id },
      data: {
        statut: 'FERME',
        dateFermeture: new Date(),
        caisseReelle: caisseReelleAutomatique
      }
    });

    await this.logsService.creerLog(
      'SESSION_CLOTURE',
      `Clôture de la session #${updatedSession.id}. Total des ventes: ${totalVentes.toFixed(3)} DT. Caisse attendue calculée: ${caisseReelleAutomatique.toFixed(3)} DT.`,
      session.utilisateurId,
    );

    return updatedSession;
  }
}