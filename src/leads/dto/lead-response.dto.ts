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

  @ApiPropertyOptional({ example: 'CONNECTED', enum: ['CONNECTED', 'NOT_CONNECTED', 'WRONG'], description: 'Latest call status' })
  callStatus?: 'CONNECTED' | 'NOT_CONNECTED' | 'WRONG';

  @ApiPropertyOptional({ example: 4, description: 'Latest rating (1-5)' })
  rating?: number;

  @ApiPropertyOptional({ example: 'Left a voicemail', description: 'Latest notes' })
  notes?: string;

  @ApiPropertyOptional({ example: '2026-02-01T10:00:00Z', description: 'Follow-up date' })
  followUpDate?: Date;

  @ApiPropertyOptional({ example: false, description: 'Whether converted to sale' })
  converted?: boolean;

  @ApiPropertyOptional({ example: false, description: 'Whether GST customer' })
  gstCustomer?: boolean;

  @ApiPropertyOptional({ example: null, description: 'Sales amount (null if not converted)' })
  salesAmount?: number | null;

  @ApiProperty({ example: '2026-01-22T16:07:52.623Z', description: 'Creation timestamp' })
  createdAt?: Date;

  @ApiProperty({ example: '2026-01-22T16:07:52.623Z', description: 'Last update timestamp' })
  updatedAt?: Date;
}
