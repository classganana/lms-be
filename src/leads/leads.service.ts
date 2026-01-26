import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Lead, LeadDocument } from './schemas/lead.schema';
import { CreateLeadDto } from './dto/create-lead.dto';
import { Types } from 'mongoose';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
  ) {}

  async createOrFind(
    createLeadDto: CreateLeadDto,
    createdBy: string,
  ): Promise<LeadDocument> {
    // Check if lead with mobile already exists
    const existingLead = await this.leadModel
      .findOne({ mobile: createLeadDto.mobile })
      .exec();

    if (existingLead) {
      return existingLead;
    }

    // Create new lead
    return this.leadModel.create({
      ...createLeadDto,
      influencerId: new Types.ObjectId(createLeadDto.influencerId),
      createdBy: new Types.ObjectId(createdBy),
    });
  }

  async findByMobile(mobile: string): Promise<LeadDocument | null> {
    return this.leadModel.findOne({ mobile }).exec();
  }

  async findOne(id: string): Promise<LeadDocument | null> {
    return this.leadModel.findById(id).exec();
  }

  async findAll(): Promise<LeadDocument[]> {
    return this.leadModel.find().exec();
  }
}

