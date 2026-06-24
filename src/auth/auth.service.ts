import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { LogsService } from '../logs/logs.service';
import { SessionsPosteService } from '../sessions-poste/sessions-poste.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private logsService: LogsService,
    private sessionsPosteService: SessionsPosteService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.prisma.utilisateur.findUnique({
      where: { nomUtilisateur: dto.nomUtilisateur },
    });

    if (!user) {
      await this.logsService.creerLog(
        'CONNEXION_ECHEC',
        `Tentative de connexion échouée : Le nom d'utilisateur '${dto.nomUtilisateur}' n'existe pas.`,
      );
      throw new UnauthorizedException('Identifiants incorrects.');
    }

    const isPasswordValid = await bcrypt.compare(dto.motDePasse, user.motDePasse);
    if (!isPasswordValid) {
      await this.logsService.creerLog(
        'CONNEXION_ECHEC',
        `Tentative de connexion échouée pour l'utilisateur '${user.nomUtilisateur}' (Mot de passe incorrect).`,
        user.id,
      );
      throw new UnauthorizedException('Mot de passe incorrect.');
    }

    if (!user.actif) {
      await this.logsService.creerLog(
        'CONNEXION_REJET',
        `Tentative de connexion refusée : Le compte de '${user.nomUtilisateur}' (Rôle: ${user.role}) est actuellement désactivé.`,
        user.id,
      );
      throw new ForbiddenException('Votre compte a été désactivé. Veuillez contacter votre administrateur.');
    }

    const payload = { 
      sub: user.id, 
      username: user.nomUtilisateur, 
      role: user.role 
    };

    await this.logsService.creerLog(
      'CONNEXION_SUCCES',
      `L'utilisateur '${user.nomUtilisateur}' s'est connecté avec succès (Rôle: ${user.role}).`,
      user.id,
    );

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nomUtilisateur: user.nomUtilisateur,
        role: user.role,
      },
    };
  }
  async logout(utilisateurId: number) {
    await this.sessionsPosteService.fermerAutomatique(utilisateurId);
    await this.logsService.creerLog(
      'DECONNEXION',
      `L'utilisateur ID #${utilisateurId} s'est déconnecté. Session de caisse active vérifiée et clôturée si nécessaire.`,
      utilisateurId,
    );

    return { success: true, message: 'Déconnexion et clôture du shift validées.' };
  }
}