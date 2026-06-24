import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Query } from '@nestjs/common';
import { IngredientsService } from './ingredients.service';
import { CreateIngredientDto } from './dto/create-ingredient.dto';
import { UpdateStockDto } from './dto/update-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { UpdateIngredientDto } from './dto/update-ingredient.dto';

@Controller('ingredients')
@UseGuards(JwtAuthGuard)
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Post()
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  create(@Body() createIngredientDto: CreateIngredientDto) {
    return this.ingredientsService.create(createIngredientDto);
  }

  @Get()
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get('alertes')
  findAlerts(){
    return this.ingredientsService.findLowStockAlerts();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.findOne(id);
  }

  @Patch(':id/ravitaillement')
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  adjustStock(@Param('id', ParseIntPipe) id: number, @Body() updateStockDto: UpdateStockDto) {
    return this.ingredientsService.adjustStock(id, updateStockDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard([Role.ADMIN]))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.ingredientsService.remove(id);
  }
  @Patch(':id')
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  async update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateIngredientDto) {
  return this.ingredientsService.update(id, dto);
}
}