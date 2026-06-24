import { IsNotEmpty, IsNumber, Min } from 'class-validator';

export class UpdateStockDto {
  @IsNotEmpty({ message: 'La quantité de réassort est requise.' })
  @IsNumber()
  @Min(0.001, { message: 'La quantité à ajouter doit être supérieure à zéro.' })
  quantiteAjoutee!: number;
}