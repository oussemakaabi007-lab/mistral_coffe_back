import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UtilisateursModule } from './utilisateurs/utilisateurs.module';
import { IngredientsModule } from './ingredients/ingredients.module';
import { ProduitsModule } from './produits/produits.module';
import { SessionsPosteModule } from './sessions-poste/sessions-poste.module';
import { VentesModule } from './ventes/ventes.module';
import { LogsModule } from './logs/logs.module';
import { CategoriesModule } from './categories/categories.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { AnalysesModule } from './analyse/analyses.module';
import { join } from 'path';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'), 
    }),
    PrismaModule,
    AuthModule,
    UtilisateursModule,
    IngredientsModule,
    ProduitsModule,
    SessionsPosteModule,
    VentesModule,
    LogsModule,
    CategoriesModule,
    AnalysesModule,
  ],
})
export class AppModule {}