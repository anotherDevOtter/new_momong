import { IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateConsultationDto {
  @ApiPropertyOptional({ description: '컨설팅 ID (없으면 자동 생성)' })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty({ description: '고객 기본 정보' })
  @IsObject()
  clientInfo: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  todayKeyword?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  fashionStyle?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  faceImageType?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  hairCondition?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  hairStyleProposal?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  todayDesign?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  nextDirection?: Record<string, any>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  designCycleGuide?: Record<string, any>;

  @ApiPropertyOptional({ description: '담당 디자이너명' })
  @IsOptional()
  @IsString()
  designerName?: string;

  @ApiPropertyOptional({ description: '방문일' })
  @IsOptional()
  @IsString()
  visitDate?: string;

  @ApiPropertyOptional({ description: '디자이너 메모' })
  @IsOptional()
  @IsString()
  afterNote?: string;
}
