import { ApiProperty } from "@nestjs/swagger";

export class AdminSummaryResponseDto {
  @ApiProperty({ example: 150, description: "Total number of leads" })
  totalLeads: number;

  @ApiProperty({ example: 45, description: "Number of interested leads" })
  interested: number;

  @ApiProperty({ example: 30, description: "Number of non-interested leads" })
  nonInterested: number;

  @ApiProperty({ example: 10, description: "Number of wrong numbers" })
  wrongNumbers: number;

  @ApiProperty({ example: 65, description: "Number of pending leads" })
  pendingLeads: number;

  @ApiProperty({ example: 25, description: "Total number of sales" })
  totalSales: number;

  @ApiProperty({ example: 125000, description: "Total revenue" })
  totalRevenue: number;

  @ApiProperty({
    example: 45.5,
    description:
      "Percentage of sales with GST (gstStatus YES/APPLIED or legacy gstCustomer)",
  })
  gstCustomersPercentage: number;
}

export class SalesExecutivePerformanceDto {
  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Sales executive ID",
  })
  salesExecutiveId: string;

  @ApiProperty({ example: "John Doe", description: "Sales executive name" })
  name: string;

  @ApiProperty({
    example: "john.doe@example.com",
    description: "Sales executive email",
  })
  email: string;

  @ApiProperty({ example: 50, description: "Total leads handled" })
  totalLeads: number;

  @ApiProperty({ example: 15, description: "Number of follow-ups scheduled" })
  followUps: number;

  @ApiProperty({ example: 12, description: "Total sales made" })
  sales: number;

  @ApiProperty({ example: 24.0, description: "Conversion percentage" })
  conversionPercentage: number;
}

export class InfluencerWiseSalesDto {
  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Influencer ID",
  })
  influencerId: string;

  @ApiProperty({ example: "John Influencer", description: "Influencer name" })
  influencerName: string;

  @ApiProperty({ example: "SRC123", description: "Source code" })
  sourceCode: string;

  @ApiProperty({
    example: 10,
    description: "Total sales from this influencer/source code",
  })
  totalSales: number;

  @ApiProperty({
    example: 50000,
    description: "Total revenue from this influencer/source code",
  })
  totalRevenue: number;
}

export class EmployeeSalesItemDto {
  @ApiProperty({ example: "Employee A", description: "Employee name" })
  name: string;

  @ApiProperty({
    example: 50000,
    description: "Total sales amount for the current month",
  })
  sales: number;
}

export class EmployeeSalesResponseDto {
  @ApiProperty({
    example: "current",
    description: "Indicates the month for which sales are calculated",
  })
  month: string;

  @ApiProperty({
    type: [EmployeeSalesItemDto],
    description: "List of employees with their current month sales totals",
  })
  employees: EmployeeSalesItemDto[];
}

export class UserActivityLeadDto {
  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Lead ID",
  })
  id: string;

  @ApiProperty({ example: "John Doe", description: "Lead name" })
  name?: string;

  @ApiProperty({
    example: "+919876543210",
    description: "Lead mobile number",
  })
  mobile: string;

  @ApiProperty({
    example: "Karnataka",
    description: "State or region",
    required: false,
  })
  state?: string;

  @ApiProperty({
    example: "Bangalore",
    description: "City",
    required: false,
  })
  city?: string;

  @ApiProperty({
    example: false,
    description: "Whether the lead is converted",
  })
  converted: boolean;

  @ApiProperty({
    example: "2026-03-05T10:30:00.000Z",
    description: "Lead creation timestamp",
  })
  createdAt: Date;

  @ApiProperty({
    example: "2026-03-05T12:45:00.000Z",
    description: "Lead last update timestamp",
  })
  updatedAt: Date;
}

export class UserDailyActivityResponseDto {
  @ApiProperty({
    example: "2026-03-05",
    description: "The date for which activity is computed (ISO date string)",
  })
  date: string;

  @ApiProperty({
    example: "60d0fe4f5311236168a109cb",
    description: "Sales executive (non-admin) user ID",
  })
  userId: string;

  @ApiProperty({
    example: "Sales Executive A",
    description: "Sales executive (non-admin) name",
  })
  userName: string;

  @ApiProperty({
    example: 3,
    description: "Number of leads created by this user on the given date",
  })
  createdCount: number;

  @ApiProperty({
    example: 5,
    description:
      "Number of unique leads that had interactions by this user on the given date",
  })
  touchedCount: number;

  @ApiProperty({
    type: [UserActivityLeadDto],
    description:
      "Unique leads the user has either created or interacted with on the given date",
  })
  leads: UserActivityLeadDto[];

  @ApiProperty({
    type: [String],
    description: "IDs of leads created on the given date by this user",
  })
  createdLeadIds: string[];

  @ApiProperty({
    type: [String],
    description:
      "IDs of leads that had at least one interaction by this user on the given date",
  })
  interactedLeadIds: string[];
}

export class SalesSummaryResponseDto {
  @ApiProperty({
    example: 30,
    description: "Total leads handled by this sales executive",
  })
  totalLeads: number;

  @ApiProperty({ example: 10, description: "Number of interested leads" })
  interested: number;

  @ApiProperty({ example: 8, description: "Number of non-interested leads" })
  nonInterested: number;

  @ApiProperty({ example: 2, description: "Number of wrong numbers" })
  wrongNumbers: number;

  @ApiProperty({ example: 10, description: "Number of pending leads" })
  pendingLeads: number;

  @ApiProperty({ example: 5, description: "Total sales made" })
  totalSales: number;

  @ApiProperty({ example: 25000, description: "Total revenue generated" })
  totalRevenue: number;

  @ApiProperty({
    example: 45.5,
    description:
      "Percentage of sales with GST (gstStatus YES/APPLIED or legacy gstCustomer)",
  })
  gstCustomersPercentage: number;

  @ApiProperty({ example: 3, description: "Current month sales count" })
  currentMonthSales: number;

  @ApiProperty({ example: 15000, description: "Current month revenue" })
  currentMonthRevenue: number;
}
