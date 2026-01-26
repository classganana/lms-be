import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsNumber,
  IsEnum,
  IsOptional,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadInteractionDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Lead id (mongo id)' })
  @IsMongoId()
  @IsNotEmpty()
  leadId: string;

  @ApiProperty({ example: 'CONNECTED', description: 'Call status', enum: ['CONNECTED', 'NOT_CONNECTED', 'WRONG'] })
  @IsEnum(['CONNECTED', 'NOT_CONNECTED', 'WRONG'])
  @IsNotEmpty()
  callStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'WRONG';

  @ApiProperty({ example: 4, description: 'Rating from 1 to 5' })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsNotEmpty()
  rating: number;

  @ApiProperty({ example: 'Left a voicemail', description: 'Notes about the interaction' })
  @IsString()
  @IsNotEmpty()
  notes: string;

  @ApiPropertyOptional({ example: '2026-02-01T10:00:00Z', description: 'Optional follow up date (ISO string)' })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({ example: true, description: 'Is GST customer' })
  @IsBoolean()
  @IsOptional()
  gstCustomer?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether the lead was converted in this interaction' })
  @IsBoolean()
  @IsOptional()
  converted?: boolean;
}

