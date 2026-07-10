import { Module } from '@nestjs/common';
import { VentesService } from './ventes.service';
import { VentesController } from './ventes.controller';
import { AuthModule } from '../auth/auth.module';
import { CommandeModule } from '../commande/commande.module';
@Module({
  imports: [AuthModule,CommandeModule],
  controllers: [VentesController],
  providers: [VentesService],
  exports: [VentesService],
})
export class VentesModule {}