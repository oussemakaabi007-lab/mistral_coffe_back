import { Module } from '@nestjs/common';
import { SessionsPosteService } from './sessions-poste.service';
import { SessionsPosteController } from './sessions-poste.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [SessionsPosteController],
  providers: [SessionsPosteService],
  exports: [SessionsPosteService],
})
export class SessionsPosteModule {}