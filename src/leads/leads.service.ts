import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Lead, LeadDocument } from "./schemas/lead.schema";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { Types } from "mongoose";
import { buildFilter } from "../common/utils/build-filter";

/** Allowlist of filterable keys for leads (generic filter). Add a key here to allow filtering by that field. */
export const LEAD_FILTER_ALLOWLIST: Record<
  string,
  "string" | "objectId" | "boolean" | "number" | "stringExact"
> = {
  name: "string",
  mobile: "string",
  state: "string",
  city: "string",
  address: "string",
  pincode: "string",
  email: "string",
  influencerId: "objectId",
  sourceCode: "string",
  callStatus: "stringExact",
  converted: "boolean",
  gstStatus: "stringExact",
  rating: "number",
};

@Injectable()
export class LeadsService {
  constructor(@InjectModel(Lead.name) private leadModel: Model<LeadDocument>) {}

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

    // Create new lead (only mobile is required; other fields optional)
    const payload: Record<string, unknown> = {
      mobile: createLeadDto.mobile,
      createdBy: new Types.ObjectId(createdBy),
    };
    if (createLeadDto.influencerId) {
      payload.influencerId = new Types.ObjectId(createLeadDto.influencerId);
    }
    ["name", "state", "city", "address", "pincode", "email", "sourceCode", "callStatus", "rating", "notes", "followUpDate", "converted", "gstStatus", "salesAmount"].forEach(
      (key) => {
        const v = (createLeadDto as any)[key];
        if (v !== undefined && v !== null) payload[key] = v;
      },
    );
    return this.leadModel.create(payload);
  }

  async update(
    id: string,
    updateLeadDto: UpdateLeadDto,
  ): Promise<LeadDocument | null> {
    const update: Record<string, unknown> = {};
    const {
      influencerId,
      name,
      state,
      city,
      address,
      pincode,
      email,
      sourceCode,
      callStatus,
      rating,
      notes,
      followUpDate,
      converted,
      gstStatus,
      salesAmount,
      mobile,
    } = updateLeadDto;

    if (mobile !== undefined) update.mobile = mobile;
    if (influencerId) update.influencerId = new Types.ObjectId(influencerId);
    if (name !== undefined) update.name = name;
    if (state !== undefined) update.state = state;
    if (city !== undefined) update.city = city;
    if (address !== undefined) update.address = address;
    if (pincode !== undefined) update.pincode = pincode;
    if (email !== undefined) update.email = email;
    if (sourceCode !== undefined) update.sourceCode = sourceCode;
    if (callStatus !== undefined) update.callStatus = callStatus;
    if (rating !== undefined) update.rating = rating;
    if (notes !== undefined) update.notes = notes;
    if (followUpDate !== undefined)
      update.followUpDate = followUpDate ? new Date(followUpDate) : null;
    if (converted !== undefined) update.converted = converted;
    if (gstStatus !== undefined) update.gstStatus = gstStatus;
    if (salesAmount !== undefined) update.salesAmount = salesAmount;

    if (!Object.keys(update).length) {
      return this.leadModel.findById(id).exec();
    }

    return this.leadModel
      .findByIdAndUpdate(id, { $set: update }, { new: true })
      .exec();
  }

  async remove(id: string): Promise<LeadDocument | null> {
    return this.leadModel.findByIdAndDelete(id).exec();
  }

  async findByMobile(mobile: string): Promise<LeadDocument | null> {
    return this.leadModel.findOne({ mobile }).exec();
  }

  async findOne(id: string): Promise<LeadDocument | null> {
    return this.leadModel.findById(id).exec();
  }

  async findAll(opts?: {
    skip?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    /** Generic filter: only keys in LEAD_FILTER_ALLOWLIST are applied. */
    filter?: Record<string, string>;
  }): Promise<LeadDocument[]> {
    const mongoFilter =
      opts?.filter && Object.keys(opts.filter).length
        ? buildFilter(opts.filter, LEAD_FILTER_ALLOWLIST)
        : {};
    let q = this.leadModel.find(mongoFilter);
    if (opts?.sort && Object.keys(opts.sort).length) {
      q = q.sort(opts.sort);
    } else {
      q = q.sort({ createdAt: -1 });
    }
    if (opts?.skip != null) q = q.skip(opts.skip);
    if (opts?.limit != null && opts.limit > 0) q = q.limit(opts.limit);
    return q.exec();
  }

  /**
   * Update lead with latest interaction snapshot (callStatus, rating, notes, followUpDate, converted, gstStatus).
   * Keeps Lead document in sync when a LeadInteraction is created.
   */
  async updateSnapshot(
    leadId: string,
    snapshot: {
      callStatus?: "CONNECTED" | "NOT_CONNECTED" | "WRONG";
      rating?: number;
      notes?: string;
      followUpDate?: Date | null;
      converted?: boolean;
      gstStatus?: "APPLIED" | "YES" | "NO";
    },
  ): Promise<LeadDocument | null> {
    const toSet: Record<string, unknown> = {};
    if (snapshot.callStatus !== undefined)
      toSet.callStatus = snapshot.callStatus;
    if (snapshot.rating !== undefined) toSet.rating = snapshot.rating;
    if (snapshot.notes !== undefined) toSet.notes = snapshot.notes;
    if (snapshot.followUpDate !== undefined)
      toSet.followUpDate = snapshot.followUpDate;
    if (snapshot.converted !== undefined) toSet.converted = snapshot.converted;
    if (snapshot.gstStatus !== undefined) toSet.gstStatus = snapshot.gstStatus;
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
