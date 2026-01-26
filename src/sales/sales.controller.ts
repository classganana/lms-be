import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { SalesService } from './sales.service';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { SaleResponseDto } from './dto/sale-response.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sales')
@ApiTags('Sales')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post('convert')
  @ApiOperation({ summary: 'Convert a lead to a sale' })
  @ApiBody({ type: ConvertLeadDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Lead converted to sale successfully',
    type: SaleResponseDto
  })
  @ApiResponse({ status: 400, description: 'Bad request - validation error or lead must have interaction before conversion' })
  @ApiResponse({ status: 404, description: 'Lead not found' })
  @ApiResponse({ status: 409, description: 'Lead has already been converted' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async convert(
    @Body() convertLeadDto: ConvertLeadDto,
    @CurrentUser() user: any,
  ) {
    return this.salesService.convert(convertLeadDto, user.id);
  }

  @Get('my-sales')
  @ApiOperation({ summary: 'Get all sales made by the current sales executive' })
  @ApiResponse({ 
    status: 200, 
    description: 'List of sales made by current user',
    type: [SaleResponseDto]
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  async getMySales(@CurrentUser() user: any) {
    return this.salesService.findMySales(user.id);
  }
}

