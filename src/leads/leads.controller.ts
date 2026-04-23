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
  ForbiddenException,
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
import {
  serializeLeadForClient,
  serializeLeadsForClient,
} from "./serialize-lead.util";

/** Last 10 digits for comparing mobile across formatting differences */
function mobileKey(mobile: string | undefined): string {
  const digits = (mobile ?? "").replace(/\D/g, "");
  return digits.slice(-10);
}

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
      "- `gstStatus` — exact: YES | NO | APPLIED | APPLIED_THROUGH_US\n" +
      "- `paymentInfoShared` — exact: true | false\n" +
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
    enum: ["YES", "NO", "APPLIED", "APPLIED_THROUGH_US"],
    description: "Filter: GST status (exact)",
  })
  @ApiQuery({
    name: "paymentInfoShared",
    required: false,
    enum: ["true", "false"],
    description: "Filter: payment information shared with lead (exact)",
  })
  @ApiQuery({
    name: "rating",
    required: false,
    description: "Filter: rating 1–5 (exact number)",
  })
  @ApiQuery({
    name: "salesExecutiveId",
    required: false,
    description:
      "Filter: sales executive who owns the lead (maps to createdBy ObjectId)",
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
  async findAll(
    @Query() query: Record<string, string>,
    @CurrentUser() user: { id: string; role: string },
  ) {
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
    // Non-admin: can only see their own leads. Admin: can see all (or filter by salesExecutiveId).
    const createdByFilter =
      user?.role === "ADMIN"
        ? query.salesExecutiveId || null
        : user?.id != null
          ? String(user.id)
          : null;

    const queryWithOwner = {
      ...query,
      ...(query.salesExecutiveId && user?.role === "ADMIN"
        ? { createdBy: query.salesExecutiveId }
        : {}),
    };
    let filter = getFilterQuery(queryWithOwner, LEAD_FILTER_ALLOWLIST);
    // Admin viewing all: never filter by createdBy from query (only use salesExecutiveId when explicitly requested)
    if (user?.role === "ADMIN" && !query.salesExecutiveId && filter.createdBy) {
      const { createdBy: _, ...rest } = filter;
      filter = rest;
    }
    const opts = {
      sort,
      createdByFilter,
      ...(limitNum !== undefined || skip !== undefined
        ? { skip, limit: limitNum }
        : {}),
      ...(Object.keys(filter).length ? { filter } : {}),
    };
    const rows = await this.leadsService.findAll(opts);
    return serializeLeadsForClient(rows);
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
  async findByMobile(
    @Query("mobile") mobile: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const lead = await this.leadsService.findByMobile(mobile);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    if (user.role !== "ADMIN") {
      const ownerId = (lead as any).createdBy?.toString?.();
      if (String(ownerId) !== String(user?.id)) {
        throw new NotFoundException("Lead not found");
      }
    }
    return serializeLeadForClient(lead) as Record<string, unknown>;
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
  async findOne(
    @Param("id", ParseMongoIdPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const lead = await this.leadsService.findOne(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    if (user.role !== "ADMIN") {
      const ownerId = (lead as any).createdBy?.toString?.();
      if (String(ownerId) !== String(user?.id)) {
        throw new ForbiddenException("You do not have access to this lead");
      }
    }
    return serializeLeadForClient(lead) as Record<string, unknown>;
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
    const doc = await this.leadsService.createOrFind(createLeadDto, user.id);
    return serializeLeadForClient(doc) as Record<string, unknown>;
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
  @ApiResponse({
    status: 403,
    description: "Forbidden — e.g. non-admin cannot change mobile number",
  })
  async update(
    @Param("id", ParseMongoIdPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const existing = await this.leadsService.findOne(id);
    if (!existing) {
      throw new NotFoundException("Lead not found");
    }
    if (user.role !== "ADMIN") {
      const ownerId = (existing as any).createdBy?.toString?.();
      if (String(ownerId) !== String(user?.id)) {
        throw new ForbiddenException("You do not have access to this lead");
      }
      if (updateLeadDto.mobile !== undefined) {
        const existingMobile = String((existing as any).mobile ?? "");
        if (mobileKey(existingMobile) !== mobileKey(updateLeadDto.mobile)) {
          throw new ForbiddenException(
            "Only administrators can change a lead's mobile number",
          );
        }
      }
    }
    const lead = await this.leadsService.update(id, updateLeadDto);
    return lead
      ? (serializeLeadForClient(lead) as Record<string, unknown>)
      : null;
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
  async remove(
    @Param("id", ParseMongoIdPipe) id: string,
    @CurrentUser() user: { id: string; role: string },
  ) {
    const existing = await this.leadsService.findOne(id);
    if (!existing) {
      throw new NotFoundException("Lead not found");
    }
    if (user.role !== "ADMIN") {
      const ownerId = (existing as any).createdBy?.toString?.();
      if (String(ownerId) !== String(user?.id)) {
        throw new ForbiddenException("You do not have access to this lead");
      }
    }
    const lead = await this.leadsService.remove(id);
    if (!lead) {
      throw new NotFoundException("Lead not found");
    }
    return { success: true };
  }
}
