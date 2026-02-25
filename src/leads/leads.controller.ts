import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
  ApiQuery,
  ApiParam,
} from "@nestjs/swagger";
import { LeadsService, LEAD_FILTER_ALLOWLIST } from "./leads.service";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { LeadResponseDto } from "./dto/lead-response.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ParseMongoIdPipe } from "../common/pipes/parse-mongo-id.pipe";
import { getFilterQuery } from "../common/utils/build-filter";

@Controller("sales/leads")
@ApiTags("Leads")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({
    summary: "Get all leads (generic filters, pagination & sort)",
    description:
      "Returns a list of leads. You can filter by passing any of the following keys as query parameters (only these keys are accepted; others are ignored).\n\n" +
      "**Pagination & sort (reserved):** `page`, `limit`, `sortBy`, `sortOrder`\n\n" +
      "**Filter keys (pass as query params, e.g. ?name=John&state=Karnataka):**\n" +
      "- `name` — substring match, case-insensitive\n" +
      "- `mobile` — substring match, case-insensitive\n" +
      "- `state` — substring match, case-insensitive\n" +
      "- `city` — substring match, case-insensitive\n" +
      "- `address` — substring match, case-insensitive\n" +
      "- `pincode` — substring match\n" +
      "- `email` — substring match, case-insensitive\n" +
      "- `influencerId` — exact (MongoDB ObjectId)\n" +
      "- `sourceCode` — substring match, case-insensitive\n" +
      "- `callStatus` — exact: CONNECTED | NOT_CONNECTED | WRONG\n" +
      "- `converted` — exact: true | false\n" +
      "- `gstStatus` — exact: APPLIED | YES | NO\n" +
      "- `rating` — exact number (1–5)\n\n" +
      "Example: GET /sales/leads?state=Karnataka&converted=false&limit=20",
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
    enum: ["createdAt", "updatedAt", "name"],
    example: "createdAt",
  })
  @ApiQuery({
    name: "sortOrder",
    required: false,
    description: "Sort order",
    enum: ["asc", "desc"],
    example: "desc",
  })
  @ApiQuery({
    name: "name",
    required: false,
    description: "Filter: name (substring)",
  })
  @ApiQuery({
    name: "mobile",
    required: false,
    description: "Filter: mobile (substring)",
  })
  @ApiQuery({
    name: "state",
    required: false,
    description: "Filter: state (substring)",
  })
  @ApiQuery({
    name: "city",
    required: false,
    description: "Filter: city (substring)",
  })
  @ApiQuery({
    name: "address",
    required: false,
    description: "Filter: address (substring)",
  })
  @ApiQuery({
    name: "pincode",
    required: false,
    description: "Filter: pincode (substring)",
  })
  @ApiQuery({
    name: "email",
    required: false,
    description: "Filter: email (substring)",
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
    name: "callStatus",
    required: false,
    enum: ["CONNECTED", "NOT_CONNECTED", "WRONG"],
    description: "Filter: call status (exact)",
  })
  @ApiQuery({
    name: "converted",
    required: false,
    enum: ["true", "false"],
    description: "Filter: converted (exact)",
  })
  @ApiQuery({
    name: "gstStatus",
    required: false,
    enum: ["APPLIED", "YES", "NO"],
    description: "Filter: GST status (exact)",
  })
  @ApiQuery({
    name: "rating",
    required: false,
    description: "Filter: rating 1–5 (exact number)",
  })
  @ApiResponse({
    status: 200,
    description: "List of all leads",
    type: [LeadResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async findAll(@Query() query: Record<string, string>) {
    const allowedSort = ["createdAt", "updatedAt", "name"];
    const sortBy = query.sortBy;
    const sortOrder = query.sortOrder;
    const sort: Record<string, 1 | -1> =
      sortBy && allowedSort.includes(sortBy)
        ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
        : { createdAt: -1 };
    const limitNum = query.limit ? parseInt(query.limit, 10) : undefined;
    const skip =
      query.page && limitNum
        ? (Math.max(1, parseInt(query.page, 10) || 1) - 1) * limitNum
        : undefined;
    const filter = getFilterQuery(query, LEAD_FILTER_ALLOWLIST);
    const opts = {
      sort,
      ...(limitNum !== undefined || skip !== undefined
        ? { skip, limit: limitNum }
        : {}),
      ...(Object.keys(filter).length ? { filter } : {}),
    };
    return this.leadsService.findAll(opts);
  }

  @Get("by-mobile")
  @ApiOperation({ summary: "Get lead by mobile number" })
  @ApiQuery({
    name: "mobile",
    required: true,
    description: "Mobile number to search for",
    example: "+919876543210",
  })
  @ApiResponse({
    status: 200,
    description: "Lead found",
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: "Lead not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async findByMobile(@Query("mobile") mobile: string) {
    const lead = await this.leadsService.findByMobile(mobile);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return lead;
  }

  @Get(":id")
  @ApiOperation({ summary: "Get lead by ID" })
  @ApiParam({
    name: "id",
    description: "Lead ID (MongoDB ObjectId)",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiResponse({
    status: 200,
    description: "Lead found",
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: "Lead not found" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async findOne(@Param("id", ParseMongoIdPipe) id: string) {
    const lead = await this.leadsService.findOne(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return lead;
  }

  @Post()
  @ApiOperation({ summary: "Create or fetch existing lead by mobile number" })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({
    status: 201,
    description: "Lead created or existing lead returned",
    type: LeadResponseDto,
  })
  @ApiResponse({
    status: 200,
    description: "Existing lead found and returned",
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.createOrFind(createLeadDto, user.id);
  }

  @Patch(":id")
  @ApiOperation({
    summary: "Update a lead by ID",
    description:
      "Updates a lead. Only the fields provided in the body will be updated; others remain unchanged.",
  })
  @ApiParam({
    name: "id",
    description: "Lead ID (MongoDB ObjectId)",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiBody({ type: UpdateLeadDto })
  @ApiResponse({
    status: 200,
    description: "Lead updated successfully",
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: "Lead not found" })
  @ApiResponse({
    status: 400,
    description: "Bad request - validation error",
  })
  async update(
    @Param("id", ParseMongoIdPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    const lead = await this.leadsService.update(id, updateLeadDto);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return lead;
  }

  @Delete(":id")
  @ApiOperation({
    summary: "Delete a lead by ID",
  })
  @ApiParam({
    name: "id",
    description: "Lead ID (MongoDB ObjectId)",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiResponse({ status: 200, description: "Lead deleted successfully" })
  @ApiResponse({ status: 404, description: "Lead not found" })
  async remove(@Param("id", ParseMongoIdPipe) id: string) {
    const lead = await this.leadsService.remove(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return { success: true };
  }
}
