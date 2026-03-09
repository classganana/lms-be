import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiQuery,
} from "@nestjs/swagger";
import { DashboardService } from "./dashboard.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ParseOptionalDatePipe } from "./pipes/parse-optional-date.pipe";
import {
  AdminSummaryResponseDto,
  SalesExecutivePerformanceDto,
  InfluencerWiseSalesDto,
  SalesSummaryResponseDto,
  EmployeeSalesResponseDto,
  UserDailyActivityResponseDto,
} from "./dto/dashboard-response.dto";

@Controller("admin/dashboard")
@ApiTags("Admin Dashboard")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @ApiOperation({ summary: "Get admin dashboard summary" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date filter (ISO 8601 format)",
    example: "2026-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date filter (ISO 8601 format)",
    example: "2026-01-31T23:59:59.999Z",
  })
  @ApiResponse({
    status: 200,
    description: "Admin dashboard summary",
    type: AdminSummaryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async getSummary(
    @Query("startDate", new ParseOptionalDatePipe()) startDate?: Date,
    @Query("endDate", new ParseOptionalDatePipe()) endDate?: Date,
  ) {
    return this.dashboardService.getAdminSummary(startDate, endDate);
  }

  @Get("sales-executives")
  @ApiOperation({ summary: "Get sales executives performance metrics" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date filter (ISO 8601 format)",
    example: "2026-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date filter (ISO 8601 format)",
    example: "2026-01-31T23:59:59.999Z",
  })
  @ApiResponse({
    status: 200,
    description: "Sales executives performance data",
    type: [SalesExecutivePerformanceDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async getSalesExecutives(
    @Query("startDate", new ParseOptionalDatePipe()) startDate?: Date,
    @Query("endDate", new ParseOptionalDatePipe()) endDate?: Date,
  ) {
    return this.dashboardService.getSalesExecutivesPerformance(
      startDate,
      endDate,
    );
  }

  @Get("influencers")
  @ApiOperation({ summary: "Get influencer-wise sales data" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date filter (ISO 8601 format)",
    example: "2026-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date filter (ISO 8601 format)",
    example: "2026-01-31T23:59:59.999Z",
  })
  @ApiResponse({
    status: 200,
    description: "Influencer-wise sales data",
    type: [InfluencerWiseSalesDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async getInfluencers(
    @Query("startDate", new ParseOptionalDatePipe()) startDate?: Date,
    @Query("endDate", new ParseOptionalDatePipe()) endDate?: Date,
  ) {
    return this.dashboardService.getInfluencerWiseSales(startDate, endDate);
  }

  @Get("employee-sales")
  @ApiOperation({
    summary: "Get employee-wise sales totals (filtered by date range when provided)",
  })
  @ApiQuery({
    name: "startDate",
    required: false,
    description: "Start of date range (ISO 8601)",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    description: "End of date range (ISO 8601)",
  })
  @ApiResponse({
    status: 200,
    description: "Employee-wise sales for the date range (or current month if no range)",
    type: EmployeeSalesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async getEmployeeSales(
    @Query("startDate", new ParseOptionalDatePipe()) startDate?: Date,
    @Query("endDate", new ParseOptionalDatePipe()) endDate?: Date,
  ) {
    return this.dashboardService.getEmployeeSales(startDate, endDate);
  }

  @Get("user-activity")
  @ApiOperation({
    summary:
      "Get daily lead activity (created & updated leads) for a specific user",
  })
  @ApiQuery({
    name: "userId",
    required: true,
    description: "Sales executive (non-admin) user ID",
    example: "60d0fe4f5311236168a109cb",
  })
  @ApiQuery({
    name: "date",
    required: false,
    type: String,
    description:
      "Date for which to compute activity (ISO 8601). Defaults to today if omitted.",
    example: "2026-03-05T00:00:00.000Z",
  })
  @ApiResponse({
    status: 200,
    description:
      "Daily lead activity (created & touched leads) for the specified user",
    type: UserDailyActivityResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async getUserDailyActivity(
    @Query("userId") userId: string,
    @Query("date", new ParseOptionalDatePipe()) date?: Date,
  ) {
    return this.dashboardService.getUserDailyActivity(userId, date);
  }
}

@Controller("sales/dashboard")
@ApiTags("Sales Dashboard")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
export class SalesDashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get("summary")
  @ApiOperation({ summary: "Get sales executive dashboard summary" })
  @ApiQuery({
    name: "startDate",
    required: false,
    type: String,
    description: "Start date filter (ISO 8601 format)",
    example: "2026-01-01T00:00:00.000Z",
  })
  @ApiQuery({
    name: "endDate",
    required: false,
    type: String,
    description: "End date filter (ISO 8601 format)",
    example: "2026-01-31T23:59:59.999Z",
  })
  @ApiResponse({
    status: 200,
    description: "Sales executive dashboard summary",
    type: SalesSummaryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async getSummary(
    @CurrentUser() user: any,
    @Query("startDate", new ParseOptionalDatePipe()) startDate?: Date,
    @Query("endDate", new ParseOptionalDatePipe()) endDate?: Date,
  ) {
    return this.dashboardService.getNonAdminSummary(
      user.id,
      startDate,
      endDate,
    );
  }
}
