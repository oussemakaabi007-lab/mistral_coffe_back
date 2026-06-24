import { IsNotEmpty, IsString, IsNumber, Min, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type, Transform } from 'class-transformer';

class RecetteItemDto {
  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  ingredientId!: number;

  @IsNotEmpty()
  @IsNumber()
  @Type(() => Number)
  @Min(0.001, { message: 'La quantité requise doit être supérieure à zéro.' })
  quantiteRequise!: number;
}

export class CreateProduitDto {
  @IsNotEmpty({ message: 'Le nom du produit est requis.' })
  @IsString()
  nom!: string;

  @IsNotEmpty({ message: 'Le prix unitaire est requis.' })
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  @Min(0, { message: 'Le prix ne peut pas être négatif.' })
  prix!: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : 0)
  @IsNumber()
  remise?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsNotEmpty({ message: 'L\'id de la catégorie est requis.' })
  @Transform(({ value }) => parseInt(value, 10))
  @IsNumber()
  @Type(() => Number)
  categorieId!: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return value;
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecetteItemDto)
  recette?: RecetteItemDto[];
}