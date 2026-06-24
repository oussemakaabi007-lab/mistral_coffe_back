import { IsNotEmpty, IsString, MinLength, IsEnum } from 'class-validator';
import { Role } from '@prisma/client';

export class CreateUtilisateurDto {
  @IsNotEmpty({ message: "Le nom d'utilisateur est requis." })
  @IsString()
  nomUtilisateur!: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @IsString()
  @MinLength(3, { message: 'Le mot de passe doit contenir au moins 3 caractères.' })
  motDePasse!: string;

  @IsNotEmpty({ message: 'Le rôle système est requis.' })
  @IsEnum(Role, { message: 'Rôle invalide. Choisissez entre ADMIN, GERANT ou SERVEUR.' })
  role!: Role;
}