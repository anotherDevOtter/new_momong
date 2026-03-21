import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({ example: 'designer@merci.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '머시모몽' })
  @IsString()
  storeName: string;

  @ApiProperty({ example: '홍길동' })
  @IsString()
  ownerName: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '010-1234-5678' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class LoginDto {
  @ApiProperty()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  password: string;
}

export class FindIdDto {
  @ApiProperty({ description: '가입 시 등록한 전화번호' })
  @IsString()
  phone: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '가입 이메일' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: '가입 시 등록한 대표명' })
  @IsString()
  ownerName: string;

  @ApiProperty({ description: '새 비밀번호', minLength: 6 })
  @IsString()
  @MinLength(6)
  newPassword: string;
}
