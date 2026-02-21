import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  NotFoundException,
} from "@nestjs/common";
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
} from "@nestjs/swagger";
import { SalesService, SALE_QUERY_ALLOWLIST } from "./sales.service";
import { ConvertLeadDto } from "./dto/convert-lead.dto";
import { SaleResponseDto } from "./dto/sale-response.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ParseMongoIdPipe } from "../common/pipes/parse-mongo-id.pipe";
import { getFilterQuery } from "../common/utils/build-filter";

@Controller("sales")
@ApiTags("Sales")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get("my-sales")
  @ApiOperation({
    summary:
      "Get all sales made by the current user (generic filters, pagination & sort)",
    description:
      "Returns sales for the logged-in sales executive. You can filter by passing any of the following keys as query parameters (only these keys are accepted).\n\n" +
      "**Pagination & sort (reserved):** `page`, `limit`, `sortBy`, `sortOrder`\n\n" +
      "**Filter keys (pass as query params, e.g. ?influencerId=xxx&gstStatus=YES):**\n" +
      "- `influencerId` — exact (MongoDB ObjectId)\n" +
      "- `sourceCode` — substring match, case-insensitive\n" +
      "- `gstStatus` — exact: APPLIED | YES | NO\n" +
      "- `leadId` — exact (MongoDB ObjectId)\n" +
      "- `saleAmount` — exact number\n" +
      "- `mobile` — lead’s mobile; resolved to leadId (exact match on lead)\n" +
      "- `saleDateFrom` — sales on or after this date (ISO string)\n" +
      "- `saleDateTo` — sales on or before this date (ISO string)\n\n" +
      "Example: GET /sales/my-sales?gstStatus=YES&saleDateFrom=2025-01-01&limit=10",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (1-based). Omit for all.",
    example: "1",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page. Omit for all.",
    example: "10",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Sort field",
    enum: ["saleDate", "createdAt", "saleAmount"],
    example: "saleDate",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @ApiQuery({
    name: "influencerId",
    required: false,
    description: "Filter: influencer ID (ObjectId)",
  })
  @ApiQuery({
    name: "sourceCode",
    required: false,
    description: "Filter: source code (substring)",
  })
  @ApiQuery({
    name: "gstStatus",
    required: false,
    enum: ["APPLIED", "YES", "NO"],
    description: "Filter: GST status (exact)",
  })
  @ApiQuery({
    name: "leadId",
    required: false,
    description: "Filter: lead ID (ObjectId)",
  })
  @ApiQuery({
    name: "saleAmount",
    required: false,
    description: "Filter: sale amount (exact number)",
  })
  @ApiQuery({
    name: "mobile",
    required: false,
    description: "Filter: lead mobile (resolved to leadId)",
  })
  @ApiQuery({
    name: "saleDateFrom",
    required: false,
    description: "Filter: sales from date (ISO)",
  })
  @ApiQuery({
    name: "saleDateTo",
    required: false,
    description: "Filter: sales to date (ISO)",
  })
  @ApiResponse({
    status: 200,
    description: "List of sales made by current user",
    type: [SaleResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async getMySales(
    @CurrentUser() user: any,
    @Query() query: Record<string, string>,
  ) {
    const allowedSort = ["saleDate", "createdAt", "saleAmount"];
    const sort: Record<string, 1 | -1> =
      query.sortBy && allowedSort.includes(query.sortBy)
        ? { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 }
        : { saleDate: -1 };
    const limitNum = query.limit ? parseInt(query.limit, 10) : undefined;
    const skip =
      query.page && limitNum
        ? (Math.max(1, parseInt(query.page, 10) || 1) - 1) * limitNum
        : undefined;
    const filter = getFilterQuery(query, SALE_QUERY_ALLOWLIST);
    const opts = {
      sort,
      ...(limitNum !== undefined || skip !== undefined
        ? { skip, limit: limitNum }
        : {}),
      ...(Object.keys(filter).length ? { filter } : {}),
    };
    return this.salesService.findMySales(user.id, opts);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get sale by ID" })
  @ApiParam({
    name: "id",
    description: "Sale MongoDB ObjectId",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiResponse({
    status: 200,
    description: "Sale found",
    type: SaleResponseDto,
  })
  @ApiResponse({ status: 404, description: "Sale not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findOne(@Param("id", ParseMongoIdPipe) id: string) {
    const sale = await this.salesService.findOne(id);
    if (!sale) {
      throw new NotFoundException("Sale not found");
    }
    return sale;
  }

  @Get()
  @ApiOperation({
    summary: "Get all sales (generic filters, pagination & sort)",
    description:
      "Returns all sales. You can filter by passing any of the following keys as query parameters (only these keys are accepted).\n\n" +
      "**Pagination & sort (reserved):** `page`, `limit`, `sortBy`, `sortOrder`\n\n" +
      "**Filter keys (pass as query params, e.g. ?influencerId=xxx&gstStatus=YES):**\n" +
      "- `influencerId` — exact (MongoDB ObjectId)\n" +
      "- `sourceCode` — substring match, case-insensitive\n" +
      "- `gstStatus` — exact: APPLIED | YES | NO\n" +
      "- `leadId` — exact (MongoDB ObjectId)\n" +
      "- `saleAmount` — exact number\n" +
      "- `mobile` — lead’s mobile; resolved to leadId (exact match on lead)\n" +
      "- `saleDateFrom` — sales on or after this date (ISO string)\n" +
      "- `saleDateTo` — sales on or before this date (ISO string)\n\n" +
      "Example: GET /sales?gstStatus=APPLIED&saleDateTo=2025-12-31",
  })
  @ApiQuery({
    name: "page",
    required: false,
    description: "Page number (1-based). Omit for all.",
    example: "1",
  })
  @ApiQuery({
    name: "limit",
    required: false,
    description: "Items per page. Omit for all.",
    example: "10",
  })
  @ApiQuery({
    name: "sortBy",
    required: false,
    description: "Sort field",
    enum: ["saleDate", "createdAt", "saleAmount"],
    example: "saleDate",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @ApiQuery({
    name: "influencerId",
    required: false,
    description: "Filter: influencer ID (ObjectId)",
  })
  @ApiQuery({
    name: "sourceCode",
    required: false,
    description: "Filter: source code (substring)",
  })
  @ApiQuery({
    name: "gstStatus",
    required: false,
    enum: ["APPLIED", "YES", "NO"],
    description: "Filter: GST status (exact)",
  })
  @ApiQuery({
    name: "leadId",
    required: false,
    description: "Filter: lead ID (ObjectId)",
  })
  @ApiQuery({
    name: "saleAmount",
    required: false,
    description: "Filter: sale amount (exact number)",
  })
  @ApiQuery({
    name: "mobile",
    required: false,
    description: "Filter: lead mobile (resolved to leadId)",
  })
  @ApiQuery({
    name: "saleDateFrom",
    required: false,
    description: "Filter: sales from date (ISO)",
  })
  @ApiQuery({
    name: "saleDateTo",
    required: false,
    description: "Filter: sales to date (ISO)",
  })
  @ApiResponse({
    status: 200,
    description: "List of all sales",
    type: [SaleResponseDto],
  })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(@Query() query: Record<string, string>) {
    const allowedSort = ["saleDate", "createdAt", "saleAmount"];
    const sort: Record<string, 1 | -1> =
      query.sortBy && allowedSort.includes(query.sortBy)
        ? { [query.sortBy]: query.sortOrder === "asc" ? 1 : -1 }
        : { saleDate: -1 };
    const limitNum = query.limit ? parseInt(query.limit, 10) : undefined;
    const skip =
      query.page && limitNum
        ? (Math.max(1, parseInt(query.page, 10) || 1) - 1) * limitNum
        : undefined;
    const filter = getFilterQuery(query, SALE_QUERY_ALLOWLIST);
    const opts = {
      sort,
      ...(limitNum !== undefined || skip !== undefined
        ? { skip, limit: limitNum }
        : {}),
      ...(Object.keys(filter).length ? { filter } : {}),
    };
    return this.salesService.findAll(opts);
  }

  @Post("convert")
  @ApiOperation({ summary: "Convert a lead to a sale" })
  @ApiBody({ type: ConvertLeadDto })
  @ApiResponse({
    status: 201,
    description: "Lead converted to sale successfully",
    type: SaleResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      "Bad request - validation error or lead must have interaction before conversion",
  })
  @ApiResponse({ status: 404, description: "Lead not found" })
  @ApiResponse({ status: 409, description: "Lead has already been converted" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async convert(
    @Body() convertLeadDto: ConvertLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.salesService.convert(convertLeadDto, user.id);
  }
}
