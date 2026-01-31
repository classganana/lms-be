import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody, ApiQuery, ApiParam } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { LeadResponseDto } from './dto/lead-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';

@Controller('sales/leads')
@ApiTags('Leads')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all leads' })
  @ApiResponse({
    status: 200,
    description: 'List of all leads',
    type: [LeadResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findAll() {
    return this.leadsService.findAll();
  }

  @Get('by-mobile')
  @ApiOperation({ summary: 'Get lead by mobile number' })
  @ApiQuery({ name: 'mobile', required: true, description: 'Mobile number to search for', example: '+919876543210' })
  @ApiResponse({
    status: 200,
    description: 'Lead found',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findByMobile(@Query('mobile') mobile: string) {
    const lead = await this.leadsService.findByMobile(mobile);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  @ApiParam({ name: 'id', description: 'Lead ID (MongoDB ObjectId)', example: '60d0fe4f5311236168a109ca' })
  @ApiResponse({
    status: 200,
    description: 'Lead found',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async findOne(@Param('id', ParseMongoIdPipe) id: string) {
    const lead = await this.leadsService.findOne(id);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  @Post()
  @ApiOperation({ summary: 'Create or fetch existing lead by mobile number' })
  @ApiBody({ type: CreateLeadDto })
  @ApiResponse({
    status: 201,
    description: 'Lead created or existing lead returned',
    type: LeadResponseDto,
  })
  @ApiResponse({ status: 200, description: 'Existing lead found and returned', type: LeadResponseDto })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async create(@Body() createLeadDto: CreateLeadDto, @CurrentUser() user: any) {
    return this.leadsService.createOrFind(createLeadDto, user.id);
  }
}

