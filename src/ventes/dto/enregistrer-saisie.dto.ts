import { IsNotEmpty, IsArray, ValidateNested, IsNumber, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TypePoste } from '@prisma/client';

class LigneSaisieDto {
  @IsNotEmpty()
  @IsNumber()
  produitId!: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  quantite!: number;
}

export class EnregistrerSaisieDto {
  @IsNotEmpty()
  @IsEnum(TypePoste)
  typePoste!: TypePoste;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LigneSaisieDto)
  items!: LigneSaisieDto[];
}