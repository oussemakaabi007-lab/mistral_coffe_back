import { Controller, Get, Post, Body, UseGuards, Query, Request } from '@nestjs/common';
import { VentesService } from './ventes.service';
import { EnregistrerSaisieDto } from './dto/enregistrer-saisie.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TypePoste } from '@prisma/client';

@Controller('ventes')
@UseGuards(JwtAuthGuard)
export class VentesController {
  constructor(private readonly ventesService: VentesService) {}

  @Get('saisie-poste')
  async getSaisieParPoste(@Query('type') type: TypePoste) {
    return await this.ventesService.obtenirSaisieParTypePoste(type);
  }

  @Post('enregistrer-saisie')
  async enregistrerSaisie(@Request() req, @Body() dto: EnregistrerSaisieDto) {
    const userId = req.user.sub;
    return await this.ventesService.sauvegarderSaisiePoste(userId, dto);
  }

  @Get('chiffre-affaires-aujourdhui')
  async getChiffreAffairesAujourdhui() {
    return await this.ventesService.getDailyRevenue();
  }
}