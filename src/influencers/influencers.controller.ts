import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
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
import { ParseMongoIdPipe } from "../common/pipes/parse-mongo-id.pipe";
import { InfluencersService } from "./influencers.service";
import { CreateInfluencerDto } from "./dto/create-influencer.dto";
import { UpdateInfluencerDto } from "./dto/update-influencer.dto";
import { AddSourceCodeDto } from "./dto/add-source-code.dto";
import { InfluencerResponseDto } from "./dto/influencer-response.dto";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { Roles } from "../common/decorators/roles.decorator";

@Controller("admin/influencers")
@ApiTags("Admin Influencers")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("ADMIN")
export class AdminInfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Get()
  @ApiOperation({
    summary: "Get all influencers (admin only, optional pagination & sort)",
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
  @ApiResponse({
    status: 200,
    description: "List of all influencers",
    type: [InfluencerResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async findAll(
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("sortBy") sortBy?: string,
    @Query("sortOrder") sortOrder?: "asc" | "desc",
  ) {
    const allowedSort = ["createdAt", "updatedAt", "name"];
    const sort: Record<string, 1 | -1> =
      sortBy && allowedSort.includes(sortBy)
        ? { [sortBy]: sortOrder === "asc" ? 1 : -1 }
        : { createdAt: -1 };
    const limitNum = limit ? parseInt(limit, 10) : undefined;
    const skip =
      page && limitNum
        ? (Math.max(1, parseInt(page, 10) || 1) - 1) * limitNum
        : undefined;
    return this.influencersService.findAll(
      limitNum !== undefined || skip !== undefined
        ? { skip, limit: limitNum, sort }
        : { sort },
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get influencer by ID (admin only)" })
  @ApiParam({
    name: "id",
    description: "Influencer MongoDB ObjectId",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiResponse({
    status: 200,
    description: "Influencer found",
    type: InfluencerResponseDto,
  })
  @ApiResponse({ status: 404, description: "Influencer not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async findOne(@Param("id", ParseMongoIdPipe) id: string) {
    const influencer = await this.influencersService.findOne(id);
    if (!influencer) {
      throw new NotFoundException("Influencer not found");
    }
    return influencer;
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Create a new influencer (admin only)" })
  @ApiBody({ type: CreateInfluencerDto })
  @ApiResponse({
    status: 201,
    description: "Influencer created successfully",
    type: InfluencerResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  @ApiResponse({ status: 400, description: "Bad request - validation error" })
  async create(@Body() createInfluencerDto: CreateInfluencerDto) {
    return this.influencersService.create(createInfluencerDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "Update influencer by ID (admin only)" })
  @ApiParam({
    name: "id",
    description: "Influencer MongoDB ObjectId",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiBody({ type: UpdateInfluencerDto })
  @ApiResponse({
    status: 200,
    description: "Influencer updated",
    type: InfluencerResponseDto,
  })
  @ApiResponse({ status: 404, description: "Influencer not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async update(
    @Param("id", ParseMongoIdPipe) id: string,
    @Body() updateInfluencerDto: UpdateInfluencerDto,
  ) {
    return this.influencersService.update(id, updateInfluencerDto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete influencer by ID (admin only)" })
  @ApiParam({
    name: "id",
    description: "Influencer MongoDB ObjectId",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiResponse({ status: 204, description: "Influencer deleted" })
  @ApiResponse({ status: 404, description: "Influencer not found" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async remove(@Param("id", ParseMongoIdPipe) id: string) {
    await this.influencersService.remove(id);
  }

  @Post(":id/source-code")
  @ApiOperation({ summary: "Add source code to influencer (admin only)" })
  @ApiParam({
    name: "id",
    description: "Influencer MongoDB ObjectId",
    example: "60d0fe4f5311236168a109ca",
  })
  @ApiBody({ type: AddSourceCodeDto })
  @ApiResponse({
    status: 200,
    description: "Source code added successfully",
    type: InfluencerResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: "Bad request - Invalid MongoDB ObjectId",
  })
  @ApiResponse({ status: 404, description: "Influencer not found" })
  @ApiResponse({ status: 409, description: "Source code already exists" })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({ status: 403, description: "Forbidden - Admin role required" })
  async addSourceCode(
    @Param("id", ParseMongoIdPipe) id: string,
    @Body() addSourceCodeDto: AddSourceCodeDto,
  ) {
    return this.influencersService.addSourceCode(id, addSourceCodeDto);
  }
}

@Controller("sales/influencers")
@ApiTags("Sales Influencers")
@ApiBearerAuth("bearer")
@UseGuards(JwtAuthGuard)
export class SalesInfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Get()
  @ApiOperation({
    summary: "Get active influencers with active source codes only",
  })
  @ApiResponse({
    status: 200,
    description: "List of active influencers with active source codes",
    type: [InfluencerResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async findAll() {
    return this.influencersService.findAllActive();
  }
}
