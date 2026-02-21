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
