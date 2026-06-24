import { IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class FermerSessionDto {
  @IsNotEmpty({ message: 'Le montant de la caisse réelle comptée est requis.' })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Le montant compté ne peut pas être négatif.' })
  caisseReelle!: number;
}