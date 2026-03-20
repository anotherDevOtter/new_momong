import { IsString, IsOptional, IsIn, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCustomerDto {
  @ApiProperty({ description: '고객명' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ description: '연락처' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: '성별', enum: ['female', 'male'] })
  @IsOptional()
  @IsIn(['female', 'male'])
  gender?: string;

  @ApiPropertyOptional({ description: '연령대' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  age_group?: string;

  @ApiPropertyOptional({ description: '메모' })
  @IsOptional()
  @IsString()
  memo?: string;
}
