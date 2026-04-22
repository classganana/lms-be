import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Lead, LeadDocument } from "./schemas/lead.schema";
import { CreateLeadDto } from "./dto/create-lead.dto";
import { UpdateLeadDto } from "./dto/update-lead.dto";
import { Types } from "mongoose";
import { buildFilter } from "../common/utils/build-filter";
import { Sale, SaleDocument } from "../sales/schemas/sale.schema";

/** Normalize mobile to last 10 digits for duplicate check (handles +91, 91, 0 prefix etc) */
function normalizeMobile(mobile: string): string {
  const digits = (mobile || "").replace(/\D/g, "");
  return digits.slice(-10);
}

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
  paymentInfoShared: "boolean",
  rating: "number",
  createdBy: "objectId",
};

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
  ) {}

  async createOrFind(
    createLeadDto: CreateLeadDto,
    createdBy: string,
  ): Promise<LeadDocument> {
    const inputNormalized = normalizeMobile(createLeadDto.mobile);
    if (inputNormalized.length < 10) {
      throw new ConflictException({
        message: "Invalid mobile number",
      });
    }

    // Check for duplicate - try common formats (9876543210, +919876543210, 919876543210, 09876543210)
    const variants = [
      inputNormalized,
      `+91${inputNormalized}`,
      `91${inputNormalized}`,
      `0${inputNormalized}`,
      createLeadDto.mobile,
    ].filter((v, i, a) => a.indexOf(v) === i);

    const checkExisting = async (existing: LeadDocument | null) => {
      if (!existing) return;
      const isSameOwner =
        String((existing as any).createdBy) === String(createdBy);
      if (isSameOwner) {
        throw new ConflictException({
          message: "Lead already exists - redirecting to edit",
          leadId: String(existing._id),
        });
      }
      throw new ConflictException({
        message:
          "A lead with this mobile number already exists. Each lead is managed by one team member; duplicates are not allowed.",
      });
    };

    for (const v of variants) {
      const existing = await this.leadModel.findOne({ mobile: v }).exec();
      await checkExisting(existing);
    }

    // Also check via regex for any mobile ending with these 10 digits (catches stored format variations)
    const existingByRegex = await this.leadModel
      .findOne({
        mobile: new RegExp(`${inputNormalized.replace(/([.*+?^${}()|[\]\\])/g, "\\$1")}\\s*$`),
      })
      .exec();
    await checkExisting(existingByRegex);

    // Create new lead (only mobile is required; other fields optional)
    const payload: Record<string, unknown> = {
      mobile: createLeadDto.mobile,
      createdBy: new Types.ObjectId(createdBy),
    };
    if (createLeadDto.influencerId) {
      payload.influencerId = new Types.ObjectId(createLeadDto.influencerId);
    }
    ["name", "state", "city", "address", "pincode", "email", "sourceCode", "callStatus", "rating", "notes", "followUpDate", "converted", "gstStatus", "salesAmount", "paymentInfoShared"].forEach(
      (key) => {
        const v = (createLeadDto as any)[key];
        if (v !== undefined && v !== null) payload[key] = v;
      },
    );
    if ((createLeadDto as any).converted === true) {
      payload.conversionDate = new Date();
    }
    return this.leadModel.create(payload);
  }

  async update(
    id: string,
    updateLeadDto: UpdateLeadDto,
  ): Promise<LeadDocument | null> {
    const existing = await this.leadModel.findById(id).exec();
    if (!existing) return null;

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
      paymentInfoShared,
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
    if (converted !== undefined) {
      update.converted = converted;
      if (converted === true && !existing.conversionDate) {
        update.conversionDate = new Date();
      }
    }
    if (gstStatus !== undefined) update.gstStatus = gstStatus;
    if (salesAmount !== undefined) update.salesAmount = salesAmount;
    if (paymentInfoShared !== undefined) update.paymentInfoShared = paymentInfoShared;

    const mongoUpdate: Record<string, unknown> = {};
    if (Object.keys(update).length) mongoUpdate.$set = update;
    if (converted === false) mongoUpdate.$unset = { conversionDate: 1 };

    if (!Object.keys(mongoUpdate).length) {
      return existing;
    }

    const updated = await this.leadModel
      .findByIdAndUpdate(id, mongoUpdate, { new: true })
      .exec();

    if (updated) {
      await this.syncLinkedSaleAfterLeadUpdate(id, updateLeadDto);
    }
    return updated;
  }

  /**
   * Keeps the Sale collection aligned with Lead when amount/GST/conversion/influencer fields change.
   * Dashboard revenue and GST metrics aggregate Sale documents.
   */
  private async syncLinkedSaleAfterLeadUpdate(
    leadId: string,
    dto: UpdateLeadDto,
  ): Promise<void> {
    const oid = new Types.ObjectId(leadId);

    if (dto.converted === false) {
      await this.saleModel.deleteMany({ leadId: oid }).exec();
      return;
    }

    const sale = await this.saleModel.findOne({ leadId: oid }).exec();
    if (!sale) return;

    const saleUpdate: Record<string, unknown> = {};
    if (dto.salesAmount !== undefined) {
      saleUpdate.saleAmount =
        dto.salesAmount == null ? 0 : Number(dto.salesAmount);
    }
    if (dto.gstStatus !== undefined) {
      saleUpdate.gstStatus = dto.gstStatus;
    }
    if (dto.influencerId) {
      saleUpdate.influencerId = new Types.ObjectId(dto.influencerId);
    }
    if (dto.sourceCode !== undefined) {
      saleUpdate.sourceCode = dto.sourceCode;
    }

    if (Object.keys(saleUpdate).length) {
      await this.saleModel
        .updateOne({ _id: sale._id }, { $set: saleUpdate })
        .exec();
    }
  }

  async remove(id: string): Promise<LeadDocument | null> {
    const oid = new Types.ObjectId(id);
    await this.saleModel.deleteMany({ leadId: oid }).exec();
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
    /** When set (e.g. for non-admin), restricts results to leads created by this user ID. Takes precedence over filter.createdBy. */
    createdByFilter?: string | null;
  }): Promise<LeadDocument[]> {
    const baseFilter =
      opts?.filter && Object.keys(opts.filter).length
        ? buildFilter(opts.filter, LEAD_FILTER_ALLOWLIST)
        : {};
    const mongoFilter = { ...baseFilter };
    if (opts?.createdByFilter && Types.ObjectId.isValid(opts.createdByFilter)) {
      mongoFilter.createdBy = new Types.ObjectId(opts.createdByFilter);
    } else if (opts?.createdByFilter === null) {
      // Admin requesting all leads: do not filter by createdBy even if it leaked into query params
      delete mongoFilter.createdBy;
    }
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
      callStatus?: "CONNECTED" | "NOT_CONNECTED" | "BUSY" | "WRONG" | "WRONG_NUMBER";
      rating?: number;
      notes?: string;
      followUpDate?: Date | null;
      converted?: boolean;
      /** When converted becomes true, stamps conversionDate if not already set */
      conversionAt?: Date;
      gstStatus?: "APPLIED" | "APPLIED_THROUGH_US" | "YES" | "NO";
    },
  ): Promise<LeadDocument | null> {
    const existing = await this.leadModel.findById(leadId).exec();
    const toSet: Record<string, unknown> = {};
    if (snapshot.callStatus !== undefined)
      toSet.callStatus = snapshot.callStatus;
    if (snapshot.rating !== undefined) toSet.rating = snapshot.rating;
    if (snapshot.notes !== undefined) toSet.notes = snapshot.notes;
    if (snapshot.followUpDate !== undefined)
      toSet.followUpDate = snapshot.followUpDate;
    if (snapshot.converted !== undefined) toSet.converted = snapshot.converted;
    if (snapshot.gstStatus !== undefined) toSet.gstStatus = snapshot.gstStatus;
    if (
      snapshot.converted === true &&
      existing &&
      !existing.conversionDate
    ) {
      toSet.conversionDate = snapshot.conversionAt ?? new Date();
    }
    const mongoUpdate: Record<string, unknown> = { $set: toSet };
    return this.leadModel
      .findByIdAndUpdate(leadId, mongoUpdate, { new: true })
      .exec();
  }

  /**
   * Update lead when converted to sale (converted = true, salesAmount set).
   */
  async updateConversion(
    leadId: string,
    converted: boolean,
    salesAmount: number | null,
    conversionAt?: Date,
  ): Promise<LeadDocument | null> {
    const existing = await this.leadModel.findById(leadId).exec();
    const at = conversionAt ?? new Date();
    const set: Record<string, unknown> = { converted, salesAmount };
    if (converted === true && !existing?.conversionDate) {
      set.conversionDate = at;
    }
    if (!converted) {
      return this.leadModel
        .findByIdAndUpdate(
          leadId,
          { $set: { converted, salesAmount }, $unset: { conversionDate: 1 } },
          { new: true },
        )
        .exec();
    }
    return this.leadModel
      .findByIdAndUpdate(leadId, { $set: set }, { new: true })
      .exec();
  }

  /**
   * Backfill conversionDate for legacy documents so reporting does not depend on updatedAt.
   */
  async backfillMissingConversionDates(): Promise<{
    fromSales: number;
    fromUpdatedAt: number;
  }> {
    let fromSales = 0;
    const saleRows = await this.saleModel
      .find()
      .select({ leadId: 1, saleDate: 1 })
      .lean()
      .exec();
    for (const s of saleRows) {
      if (!s.leadId) continue;
      const res = await this.leadModel
        .updateOne(
          {
            _id: s.leadId,
            converted: true,
            $or: [
              { conversionDate: { $exists: false } },
              { conversionDate: null },
            ],
          },
          { $set: { conversionDate: s.saleDate } },
        )
        .exec();
      fromSales += res.modifiedCount ?? 0;
    }
    const res2 = await this.leadModel
      .updateMany(
        {
          converted: true,
          $or: [
            { conversionDate: { $exists: false } },
            { conversionDate: null },
          ],
        },
        [{ $set: { conversionDate: "$updatedAt" } }],
      )
      .exec();
    return { fromSales, fromUpdatedAt: res2.modifiedCount ?? 0 };
  }
}
