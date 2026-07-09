import { Controller, Get, Post, Body, Patch, Param, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { SessionsPosteService } from './sessions-poste.service';
import { OuvrirSessionDto } from './dto/ouvrir-session.dto';
import { FermerSessionDto } from './dto/fermer-session.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('sessions-poste')
@UseGuards(JwtAuthGuard)
export class SessionsPosteController {
  constructor(private readonly sessionsPosteService: SessionsPosteService) {}

  @Post('ouvrir')
  ouvrir(@Request() req, @Body() dto: OuvrirSessionDto) {
    const userId = req.user.sub;
    return this.sessionsPosteService.ouvrir(userId, dto);
  }

  @Get('active')
  findActive(@Request() req) {
    return this.sessionsPosteService.findActiveSession(req.user.sub);
  }

  @Get()
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  findAll() {
    return this.sessionsPosteService.findAll();
  }
  @Get('my_active')
  getMyActive(@Request() req) {
    const userId = req.user.sub;
    return this.sessionsPosteService.getmyactive(userId);
  }
  @Patch(':id/cloturer')
  fermer(@Param('id', ParseIntPipe) id: number, @Body() dto: FermerSessionDto) {
    return this.sessionsPosteService.fermer(id, dto);
  }
}