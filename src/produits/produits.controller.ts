import { 
  Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, 
  ParseIntPipe, UseInterceptors, UploadedFile, BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ProduitsService } from './produits.service';
import { CreateProduitDto } from './dto/create-produit.dto';
import { UpdateProduitDto } from './dto/update-produit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Role } from '@prisma/client';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

const multerOptions = {
  storage: memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
};

@Controller('produits')
@UseGuards(JwtAuthGuard)
export class ProduitsController {
  constructor(
    private readonly produitsService: ProduitsService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Post()
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async create(
    @Body() createProduitDto: CreateProduitDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        createProduitDto.imageUrl = uploadResult;
      } catch (err) {
        throw new BadRequestException("Échec de l'envoi de l'image sur l'hébergeur distant.");
      }
    }
    return this.produitsService.create(createProduitDto);
  }

  @Get()
  findAll() {
    return this.produitsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.produitsService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateProduitDto: UpdateProduitDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (file) {
      try {
        const uploadResult = await this.cloudinaryService.uploadFile(file);
        updateProduitDto.imageUrl = uploadResult;
      } catch (err) {
        throw new BadRequestException("Échec de la mise à jour de l'image distante.");
      }
    }
    return this.produitsService.update(id, updateProduitDto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard([Role.ADMIN, Role.GERANT]))
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.produitsService.remove(id);
  }
}