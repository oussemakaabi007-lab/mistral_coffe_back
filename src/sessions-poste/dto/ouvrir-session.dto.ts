import { IsNotEmpty, IsEnum, IsNumber, Min } from 'class-validator';
import { TypePoste } from '@prisma/client';

export class OuvrirSessionDto {
  @IsNotEmpty({ message: 'Le type de poste est requis (AVANT_MIDI ou APRES_MIDI).' })
  @IsEnum(TypePoste, { message: 'Type de poste invalide. Choisissez AVANT_MIDI ou APRES_MIDI.' })
  type!: TypePoste;

  @IsNotEmpty({ message: 'Le fond de caisse initial est requis.' })
  @IsNumber()
  @Min(0, { message: 'Le fond de caisse ne peut pas être un montant négatif.' })
  fondDeCaisse!: number;
}