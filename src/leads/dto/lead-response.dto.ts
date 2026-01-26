import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LeadResponseDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Lead ID' })
  _id: string;

  @ApiProperty({ example: 'John Doe', description: 'Lead name' })
  name: string;

  @ApiProperty({ example: '+919876543210', description: 'Mobile number' })
  mobile: string;

  @ApiProperty({ example: 'Karnataka', description: 'State' })
  state: string;

  @ApiPropertyOptional({ example: 'Bangalore', description: 'City' })
  city?: string;

  @ApiPropertyOptional({ example: '123 Main Street', description: 'Address' })
  address?: string;

  @ApiPropertyOptional({ example: '560001', description: 'Pincode/ZIP code' })
  pincode?: string;

  @ApiPropertyOptional({ example: 'jane.doe@example.com', description: 'Email address' })
  email?: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Influencer ID' })
  influencerId: string;

  @ApiProperty({ example: 'SRC123', description: 'Source code' })
  sourceCode: string;

  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Created by user ID' })
  createdBy: string;

  @ApiProperty({ example: '2026-01-22T16:07:52.623Z', description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiProperty({ example: '2026-01-22T16:07:52.623Z', description: 'Last update timestamp' })
  updatedAt?: Date;
}
