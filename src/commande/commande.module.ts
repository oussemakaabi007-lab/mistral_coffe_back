import { Module } from '@nestjs/common';
import { CommandeGateway } from './commande.gateway';

@Module({
  providers: [CommandeGateway],
  exports: [CommandeGateway],
})
export class OrdersModule {}