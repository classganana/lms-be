import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LeadInteractionsService } from './lead-interactions.service';
import { CreateLeadInteractionDto } from './dto/create-lead-interaction.dto';
import { LeadInteractionResponseDto } from './dto/lead-interaction-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales/lead-interactions')
@ApiTags('Lead Interactions')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class LeadInteractionsController {
  constructor(
    private readonly leadInteractionsService: LeadInteractionsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead interaction' })
  @ApiBody({ type: CreateLeadInteractionDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Lead interaction created successfully',
    type: LeadInteractionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async create(
    @Body() createLeadInteractionDto: CreateLeadInteractionDto,
    @CurrentUser() user: any,
  ) {
    return this.leadInteractionsService.create(
      createLeadInteractionDto,
      user.id,
    );
  }
}

