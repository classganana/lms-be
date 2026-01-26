import { ApiProperty } from '@nestjs/swagger';

export class AdminSummaryResponseDto {
  @ApiProperty({ example: 150, description: 'Total number of leads' })
  totalLeads: number;

  @ApiProperty({ example: 45, description: 'Number of interested leads' })
  interested: number;

  @ApiProperty({ example: 30, description: 'Number of non-interested leads' })
  nonInterested: number;

  @ApiProperty({ example: 10, description: 'Number of wrong numbers' })
  wrongNumbers: number;

  @ApiProperty({ example: 65, description: 'Number of pending leads' })
  pendingLeads: number;

  @ApiProperty({ example: 25, description: 'Total number of sales' })
  totalSales: number;

  @ApiProperty({ example: 125000, description: 'Total revenue' })
  totalRevenue: number;

  @ApiProperty({ example: 45.5, description: 'Percentage of GST customers' })
  gstCustomersPercentage: number;
}

export class SalesExecutivePerformanceDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Sales executive ID' })
  salesExecutiveId: string;

  @ApiProperty({ example: 'John Doe', description: 'Sales executive name' })
  name: string;

  @ApiProperty({ example: 'john.doe@example.com', description: 'Sales executive email' })
  email: string;

  @ApiProperty({ example: 50, description: 'Total leads handled' })
  totalLeads: number;

  @ApiProperty({ example: 15, description: 'Number of follow-ups scheduled' })
  followUps: number;

  @ApiProperty({ example: 12, description: 'Total sales made' })
  sales: number;

  @ApiProperty({ example: 24.0, description: 'Conversion percentage' })
  conversionPercentage: number;
}

export class InfluencerWiseSalesDto {
  @ApiProperty({ example: '60d0fe4f5311236168a109ca', description: 'Influencer ID' })
  influencerId: string;

  @ApiProperty({ example: 'John Influencer', description: 'Influencer name' })
  influencerName: string;

  @ApiProperty({ example: 'SRC123', description: 'Source code' })
  sourceCode: string;

  @ApiProperty({ example: 10, description: 'Total sales from this influencer/source code' })
  totalSales: number;

  @ApiProperty({ example: 50000, description: 'Total revenue from this influencer/source code' })
  totalRevenue: number;
}

export class SalesSummaryResponseDto {
  @ApiProperty({ example: 30, description: 'Total leads handled by this sales executive' })
  totalLeads: number;

  @ApiProperty({ example: 10, description: 'Number of interested leads' })
  interested: number;

  @ApiProperty({ example: 8, description: 'Number of non-interested leads' })
  nonInterested: number;

  @ApiProperty({ example: 2, description: 'Number of wrong numbers' })
  wrongNumbers: number;

  @ApiProperty({ example: 10, description: 'Number of pending leads' })
  pendingLeads: number;

  @ApiProperty({ example: 5, description: 'Total sales made' })
  totalSales: number;

  @ApiProperty({ example: 25000, description: 'Total revenue generated' })
  totalRevenue: number;

  @ApiProperty({ example: 45.5, description: 'Percentage of GST customers' })
  gstCustomersPercentage: number;

  @ApiProperty({ example: 3, description: 'Current month sales count' })
  currentMonthSales: number;

  @ApiProperty({ example: 15000, description: 'Current month revenue' })
  currentMonthRevenue: number;
}
