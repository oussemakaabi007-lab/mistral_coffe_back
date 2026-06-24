import { Module } from '@nestjs/common';
import { ProduitsService } from './produits.service';
import { ProduitsController } from './produits.controller';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
@Module({
  imports: [AuthModule],
  controllers: [ProduitsController],
  providers: [ProduitsService ,CloudinaryService],
  exports: [ProduitsService],
})
export class ProduitsModule {}