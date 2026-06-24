import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { LogsService } from '../logs/logs.service'; // Adjusted to match your log service file name
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';

@Injectable()
export class UtilisateursService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService, // 🚀 Injected your logs service safely
  ) {}

  async create(dto: CreateUtilisateurDto, utilisateurId?: number) {
    const existingUser = await this.prisma.utilisateur.findUnique({
      where: { nomUtilisateur: dto.nomUtilisateur },
    });

    if (existingUser) {
      throw new BadRequestException("Ce nom d'utilisateur est déjà utilisé.");
    }
    
    const salt = await bcrypt.genSalt(10);
    const hashedPostePassword = await bcrypt.hash(dto.motDePasse, salt);
    
    const user = await this.prisma.utilisateur.create({
      data: {
        nomUtilisateur: dto.nomUtilisateur,
        motDePasse: hashedPostePassword,
        role: dto.role,
      },
    });

    // 🚀 LOG: User Account Created
    await this.logsService.creerLog(
      'UTILISATEUR_CREATION',
      `Création d'un nouveau compte utilisateur : '${user.nomUtilisateur}' (Rôle: ${user.role}, ID: ${user.id}).`,
      utilisateurId,
    );

    const { motDePasse, ...result } = user;
    return result;
  }

  async findAll() {
    return this.prisma.utilisateur.findMany({
      select: {
        id: true,
        nomUtilisateur: true,
        role: true,
        createdAt: true,
        actif: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { id },
      select: { id: true, nomUtilisateur: true, role: true, createdAt: true, actif: true },
    });

    if (!user) throw new NotFoundException('Utilisateur introuvable.');
    return user;
  }

  async update(id: number, dto: UpdateUtilisateurDto, utilisateurId?: number) {
    const targetUser = await this.prisma.utilisateur.findUnique({ where: { id } });
    if (!targetUser) throw new NotFoundException('Utilisateur introuvable pour la mise à jour.');

    const dataToUpdate: any = { ...dto };
    let passwordWasChanged = false;

    if (dto.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      dataToUpdate.motDePasse = await bcrypt.hash(dto.motDePasse, salt);
      passwordWasChanged = true;
    }

    try {
      const updatedUser = await this.prisma.utilisateur.update({
        where: { id },
        data: dataToUpdate,
        select: { id: true, nomUtilisateur: true, role: true },
      });
      const nameString = targetUser.nomUtilisateur !== updatedUser.nomUtilisateur 
        ? `Nom d'utilisateur changé de '${targetUser.nomUtilisateur}' à '${updatedUser.nomUtilisateur}'`
        : `Modification du compte de '${updatedUser.nomUtilisateur}'`;

      const roleString = targetUser.role !== updatedUser.role 
        ? ` (Rôle modifié : ${targetUser.role} ➡️ ${updatedUser.role})`
        : '';

      const passwordString = passwordWasChanged ? ` [Mot de passe réinitialisé]` : '';
      await this.logsService.creerLog(
        'UTILISATEUR_MODIFICATION',
        `${nameString}${roleString}${passwordString}.`,
        utilisateurId,
      );

      return updatedUser;
    } catch {
      throw new NotFoundException('Utilisateur introuvable pour la mise à jour.');
    }
  }

  async remove(id: number, utilisateurId?: number) {
  const targetUser = await this.prisma.utilisateur.findUnique({ where: { id } });
  if (!targetUser) {
    throw new NotFoundException(`L'utilisateur avec l'ID #${id} n'existe pas.`);
  }
  const nouvelEtatActif = !targetUser.actif;

  try {
    const updatedUser = await this.prisma.utilisateur.update({
      where: { id },
      data: { actif: nouvelEtatActif },
    });
    const actionLog = nouvelEtatActif ? 'UTILISATEUR_ACTIVATION' : 'UTILISATEUR_DESACTIVATION';
    const descriptionLog = nouvelEtatActif
      ? `Réactivation du compte utilisateur '${targetUser.nomUtilisateur}' (Rôle: ${targetUser.role}, ID: ${id}). Accès rétabli.`
      : `Désactivation du compte utilisateur '${targetUser.nomUtilisateur}' (Rôle: ${targetUser.role}, ID: ${id}). Historique préservé.`;

    await this.logsService.creerLog(actionLog, descriptionLog, utilisateurId);

    return { 
      message: nouvelEtatActif 
        ? 'Compte utilisateur réactivé avec succès.' 
        : 'Compte utilisateur désactivé avec succès.',
      utilisateur: updatedUser 
    };
  } catch (error) {
    throw new BadRequestException("Une erreur est survenue lors de la modification du statut de l'utilisateur.");
  }
}
}