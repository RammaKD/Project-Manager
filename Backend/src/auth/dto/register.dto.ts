import { IsEmail, IsString, MinLength, MaxLength, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  @MaxLength(320)
  email: string;

  @IsString()
  @MinLength(8)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Z])(?=.*\d).+$/, {
    message: 'Password must include at least 1 uppercase letter and 1 number',
  })
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  lastName: string;
}