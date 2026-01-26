import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiParam } from '@nestjs/swagger';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { InfluencersService } from './influencers.service';
import { CreateInfluencerDto } from './dto/create-influencer.dto';
import { AddSourceCodeDto } from './dto/add-source-code.dto';
import { InfluencerResponseDto } from './dto/influencer-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('admin/influencers')
@ApiTags('Admin Influencers')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminInfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all influencers (admin only)' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of all influencers',
    type: [InfluencerResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAll() {
    return this.influencersService.findAll();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new influencer (admin only)' })
  @ApiBody({ type: CreateInfluencerDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Influencer created successfully',
    type: InfluencerResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  async create(@Body() createInfluencerDto: CreateInfluencerDto) {
    return this.influencersService.create(createInfluencerDto);
  }

  @Post(':id/source-code')
  @ApiOperation({ summary: 'Add source code to influencer (admin only)' })
  @ApiParam({ name: 'id', description: 'Influencer MongoDB ObjectId', example: '60d0fe4f5311236168a109ca' })
  @ApiBody({ type: AddSourceCodeDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Source code added successfully',
    type: InfluencerResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid MongoDB ObjectId' })
  @ApiResponse({ status: 404, description: 'Influencer not found' })
  @ApiResponse({ status: 409, description: 'Source code already exists' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async addSourceCode(
    @Param('id', ParseMongoIdPipe) id: string,
    @Body() addSourceCodeDto: AddSourceCodeDto,
  ) {
    return this.influencersService.addSourceCode(id, addSourceCodeDto);
  }
}

@Controller('sales/influencers')
@ApiTags('Sales Influencers')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class SalesInfluencersController {
  constructor(private readonly influencersService: InfluencersService) {}

  @Get()
  @ApiOperation({ summary: 'Get active influencers with active source codes only' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active influencers with active source codes',
    type: [InfluencerResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll() {
    return this.influencersService.findAllActive();
  }
}

