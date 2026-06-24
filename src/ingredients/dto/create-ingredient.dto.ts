import { IsNotEmpty, IsString, IsNumber, Min,IsOptional } from 'class-validator';

export class CreateIngredientDto {
  @IsNotEmpty({ message: "Le nom de l'ingrédient est requis." })
  @IsString()
  nom!: string;

  @IsNotEmpty({ message: 'La quantité de stock initiale est requise.' })
  @IsNumber()
  @Min(0, { message: 'Le stock initial ne peut pas être négatif.' })
  quantiteStock!: number;
@IsNumber()
  @IsOptional()
  seuilAlerte?: number;
  @IsNotEmpty({ message: 'Le libellé de l\'unité de mesure est requis.' })
  @IsString()
  uniteMesure!: string;
}