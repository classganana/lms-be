import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Sale, SaleDocument } from './schemas/sale.schema';
import { ConvertLeadDto } from './dto/convert-lead.dto';
import { Types } from 'mongoose';
import { LeadsService } from '../leads/leads.service';
import { LeadInteractionsService } from '../lead-interactions/lead-interactions.service';

@Injectable()
export class SalesService {
  constructor(
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    private leadsService: LeadsService,
    private leadInteractionsService: LeadInteractionsService,
  ) {}

  async convert(
    convertLeadDto: ConvertLeadDto,
    salesExecutiveId: string,
  ): Promise<SaleDocument> {
    // Check if lead exists
    const lead = await this.leadsService.findOne(convertLeadDto.leadId);
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }

    // Check if lead is already converted
    const existingSale = await this.saleModel
      .findOne({ leadId: new Types.ObjectId(convertLeadDto.leadId) })
      .exec();

    if (existingSale) {
      throw new ConflictException('Lead has already been converted');
    }

    // Get the latest interaction to check if converted is true
    const interactions = await this.leadInteractionsService.findByLeadId(
      convertLeadDto.leadId,
    );

    const latestInteraction = interactions[interactions.length - 1];
    if (!latestInteraction) {
      throw new BadRequestException(
        'Lead must have at least one interaction before conversion',
      );
    }

    if (!latestInteraction.converted) {
      // Update the interaction to mark as converted
      latestInteraction.converted = true;
      await latestInteraction.save();
    }

    // Create sale
    return this.saleModel.create({
      leadId: new Types.ObjectId(convertLeadDto.leadId),
      salesExecutiveId: new Types.ObjectId(salesExecutiveId),
      influencerId: lead.influencerId,
      sourceCode: lead.sourceCode,
      saleAmount: convertLeadDto.saleAmount,
      gstCustomer: convertLeadDto.gstCustomer,
      saleDate: new Date(convertLeadDto.saleDate),
    });
  }

  async findMySales(salesExecutiveId: string): Promise<SaleDocument[]> {
    return this.saleModel
      .find({ salesExecutiveId: new Types.ObjectId(salesExecutiveId) })
      .exec();
  }

  async findAll(): Promise<SaleDocument[]> {
    return this.saleModel.find().exec();
  }
}

