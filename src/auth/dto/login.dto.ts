import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: "Le nom d'utilisateur est requis." })
  @IsString()
  nomUtilisateur!: string;

  @IsNotEmpty({ message: 'Le mot de passe est requis.' })
  @IsString()
  @MinLength(3, { message: 'Le mot de passe doit contenir au moins 3 caractères.' })
  motDePasse!: string;
}