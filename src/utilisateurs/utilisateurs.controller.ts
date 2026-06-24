import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe } from '@nestjs/common';
import { UtilisateursService } from './utilisateurs.service';
import { CreateUtilisateurDto } from './dto/create-utilisateur.dto';
import { UpdateUtilisateurDto } from './dto/update-utilisateur.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';

@Controller('utilisateurs')
@UseGuards(JwtAuthGuard)
export class UtilisateursController {
  constructor(private readonly utilisateursService: UtilisateursService) {}

  @Post()
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  create(@Body() createUtilisateurDto: CreateUtilisateurDto) {
    return this.utilisateursService.create(createUtilisateurDto);
  }

  @Get()
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  findAll() {
    return this.utilisateursService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.utilisateursService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  update(@Param('id', ParseIntPipe) id: number, @Body() updateUtilisateurDto: UpdateUtilisateurDto) {
    return this.utilisateursService.update(id, updateUtilisateurDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard([Role.ADMIN , Role.GERANT]))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.utilisateursService.remove(id);
  }
}