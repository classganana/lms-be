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

  /**
   * Update lead with latest interaction snapshot (callStatus, rating, notes, followUpDate, converted, gstCustomer).
   * Keeps Lead document in sync when a LeadInteraction is created.
   */
  async updateSnapshot(
    leadId: string,
    snapshot: {
      callStatus?: 'CONNECTED' | 'NOT_CONNECTED' | 'WRONG';
      rating?: number;
      notes?: string;
      followUpDate?: Date | null;
      converted?: boolean;
      gstCustomer?: boolean;
    },
  ): Promise<LeadDocument | null> {
    // Only set defined values so we don't overwrite with undefined
    const toSet: Record<string, unknown> = {};
    if (snapshot.callStatus !== undefined) toSet.callStatus = snapshot.callStatus;
    if (snapshot.rating !== undefined) toSet.rating = snapshot.rating;
    if (snapshot.notes !== undefined) toSet.notes = snapshot.notes;
    if (snapshot.followUpDate !== undefined) toSet.followUpDate = snapshot.followUpDate;
    if (snapshot.converted !== undefined) toSet.converted = snapshot.converted;
    if (snapshot.gstCustomer !== undefined) toSet.gstCustomer = snapshot.gstCustomer;
    return this.leadModel
      .findByIdAndUpdate(leadId, { $set: toSet }, { new: true })
      .exec();
  }

  /**
   * Update lead when converted to sale (converted = true, salesAmount set).
   */
  async updateConversion(
    leadId: string,
    converted: boolean,
    salesAmount: number | null,
  ): Promise<LeadDocument | null> {
    return this.leadModel
      .findByIdAndUpdate(
        leadId,
        { $set: { converted, salesAmount } },
        { new: true },
      )
      .exec();
  }
}

