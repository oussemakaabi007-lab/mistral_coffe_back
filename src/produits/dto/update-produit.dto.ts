import { PartialType } from '@nestjs/mapped-types';
import { CreateProduitDto } from './create-produit.dto';
import { IsOptional, IsNumber, Min, Max } from 'class-validator';

export class UpdateProduitDto extends PartialType(CreateProduitDto) {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1, { message: 'La remise doit être exprimée en pourcentage entre 0 et 1 (ex: 0.15 pour 15%).' })
  remise?: number;
}