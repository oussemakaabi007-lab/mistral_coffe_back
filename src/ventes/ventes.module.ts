import { Module } from '@nestjs/common';
import { VentesService } from './ventes.service';
import { VentesController } from './ventes.controller';
import { AuthModule } from '../auth/auth.module';
import { CommandeGateway } from '../commande/commande.gateway';
@Module({
  imports: [AuthModule,CommandeGateway],
  controllers: [VentesController],
  providers: [VentesService],
  exports: [VentesService],
})
export class VentesModule {}