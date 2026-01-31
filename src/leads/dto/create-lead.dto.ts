import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsMobilePhone,
  IsOptional,
  IsEmail,
  IsEnum,
  IsNumber,
  IsBoolean,
  IsDateString,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLeadDto {
  @ApiProperty({ example: 'Jane Doe', description: 'Full name of the lead' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Mobile phone number' })
  @IsMobilePhone()
  @IsNotEmpty()
  mobile: string;

  @ApiProperty({ example: 'Karnataka', description: 'State of the lead' })
  @IsString()
  @IsNotEmpty()
  state: string;

  @ApiPropertyOptional({ example: 'Bangalore', description: 'City of the lead' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '123 Main Street', description: 'Address of the lead' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '560001', description: 'Pincode/ZIP code' })
  @IsString()
  @IsOptional()
  pincode?: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com', description: 'Email address of the lead' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Influencer id (mongo id)' })
  @IsMongoId()
  @IsNotEmpty()
  influencerId: string;

  @ApiProperty({ example: 'SRC123', description: 'Source code assigned to the lead' })
  @IsString()
  @IsNotEmpty()
  sourceCode: string;

  @ApiPropertyOptional({ example: 'CONNECTED', enum: ['CONNECTED', 'NOT_CONNECTED', 'WRONG'], description: 'Latest call status' })
  @IsEnum(['CONNECTED', 'NOT_CONNECTED', 'WRONG'])
  @IsOptional()
  callStatus?: 'CONNECTED' | 'NOT_CONNECTED' | 'WRONG';

  @ApiPropertyOptional({ example: 4, description: 'Rating from 1 to 5', minimum: 1, maximum: 5 })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  rating?: number;

  @ApiPropertyOptional({ example: 'Left a voicemail', description: 'Notes about the lead' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ example: '2026-02-01T10:00:00Z', description: 'Follow-up date (ISO string)' })
  @IsDateString()
  @IsOptional()
  followUpDate?: string;

  @ApiPropertyOptional({ example: false, description: 'Whether lead has been converted to sale' })
  @IsBoolean()
  @IsOptional()
  converted?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether lead is GST customer' })
  @IsBoolean()
  @IsOptional()
  gstCustomer?: boolean;

  @ApiPropertyOptional({ example: null, description: 'Sales amount (null if not converted)' })
  @IsNumber()
  @IsOptional()
  salesAmount?: number | null;
}

