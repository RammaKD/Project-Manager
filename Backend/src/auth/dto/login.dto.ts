import { IsEmail, IsString, IsNotEmpty, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @MaxLength(128)
  password: string;
}