import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  LeadInteraction,
  LeadInteractionDocument,
} from './schemas/lead-interaction.schema';
import { CreateLeadInteractionDto } from './dto/create-lead-interaction.dto';
import { Types } from 'mongoose';

@Injectable()
export class LeadInteractionsService {
  constructor(
    @InjectModel(LeadInteraction.name)
    private leadInteractionModel: Model<LeadInteractionDocument>,
  ) {}

  async create(
    createLeadInteractionDto: CreateLeadInteractionDto,
    salesExecutiveId: string,
  ): Promise<LeadInteractionDocument> {
    return this.leadInteractionModel.create({
      ...createLeadInteractionDto,
      leadId: new Types.ObjectId(createLeadInteractionDto.leadId),
      salesExecutiveId: new Types.ObjectId(salesExecutiveId),
      converted: createLeadInteractionDto.converted || false,
      gstCustomer: createLeadInteractionDto.gstCustomer || false,
      followUpDate: createLeadInteractionDto.followUpDate
        ? new Date(createLeadInteractionDto.followUpDate)
        : null,
    });
  }

  async findOne(id: string): Promise<LeadInteractionDocument | null> {
    return this.leadInteractionModel.findById(id).exec();
  }

  async findByLeadId(leadId: string): Promise<LeadInteractionDocument[]> {
    return this.leadInteractionModel
      .find({ leadId: new Types.ObjectId(leadId) })
      .exec();
  }

  async findBySalesExecutiveId(
    salesExecutiveId: string,
  ): Promise<LeadInteractionDocument[]> {
    return this.leadInteractionModel
      .find({ salesExecutiveId: new Types.ObjectId(salesExecutiveId) })
      .exec();
  }

  async findAll(): Promise<LeadInteractionDocument[]> {
    return this.leadInteractionModel.find().exec();
  }
}

