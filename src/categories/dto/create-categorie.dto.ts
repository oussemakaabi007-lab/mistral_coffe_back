import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateCategorieDto {
  @IsNotEmpty({ message: 'Le nom de la catégorie est requis.' })
  @IsString()
  @MinLength(3, { message: 'Le nom doit contenir au moins 3 caractères.' })
  nom!: string;
}