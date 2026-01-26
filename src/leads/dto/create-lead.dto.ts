import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsMobilePhone,
  IsOptional,
  IsEmail,
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
}

