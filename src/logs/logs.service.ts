import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LogsService {
  constructor(private prisma: PrismaService) {}

  async creerLog(action: string, description: string, utilisateurId?: number) {
    return this.prisma.journalLog.create({
      data: {
        action,
        description,
        utilisateurId,
      },
    });
  }

  async trouverTout() {
    return this.prisma.journalLog.findMany({
      include: {
        utilisateur: {
          select: {
            nomUtilisateur: true,
            role: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
    });
  }
  async supprimerAnciensLogs(dateSeuil: Date) {
    return this.prisma.journalLog.deleteMany({
      where: {
        timestamp: { lt: dateSeuil },
      },
    });
  }
}