import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Sale, SaleDocument } from "./schemas/sale.schema";
import { ConvertLeadDto } from "./dto/convert-lead.dto";
import { Types } from "mongoose";
import { LeadsService } from "../leads/leads.service";
import { LeadInteractionsService } from "../lead-interactions/lead-interactions.service";
import { buildFilter } from "../common/utils/build-filter";

/** Allowlist of filterable keys for sales. Add a key here to allow filtering by that field. */
export const SALE_FILTER_ALLOWLIST: Record<
  string,
  "string" | "objectId" | "boolean" | "number" | "stringExact"
> = {
  influencerId: "objectId",
  sourceCode: "string",
  gstStatus: "stringExact",
  leadId: "objectId",
  saleAmount: "number",
};
/** Keys used only for special handling (date range, mobile→leadId). Pass to getFilterQuery so they are accepted. */
export const SALE_QUERY_ALLOWLIST = {
  ...SALE_FILTER_ALLOWLIST,
  saleDateFrom: "string" as const,
  saleDateTo: "string" as const,
  mobile: "string" as const,
};

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
      throw new NotFoundException("Lead not found");
    }

    // Check if lead is already converted
    const existingSale = await this.saleModel
      .findOne({ leadId: new Types.ObjectId(convertLeadDto.leadId) })
      .exec();

    if (existingSale) {
      throw new ConflictException("Lead has already been converted");
    }

    // Get the latest interaction to check if converted is true
    const interactions = await this.leadInteractionsService.findByLeadId(
      convertLeadDto.leadId,
    );

    const latestInteraction = interactions[interactions.length - 1];
    if (!latestInteraction) {
      throw new BadRequestException(
        "Lead must have at least one interaction before conversion",
      );
    }

    if (!latestInteraction.converted) {
      // Update the interaction to mark as converted
      latestInteraction.converted = true;
      await latestInteraction.save();
    }

    if (!lead.influencerId || !lead.sourceCode) {
      throw new BadRequestException(
        "Lead must have influencer and source code set before conversion",
      );
    }

    // Create sale
    const sale = await this.saleModel.create({
      leadId: new Types.ObjectId(convertLeadDto.leadId),
      salesExecutiveId: new Types.ObjectId(salesExecutiveId),
      influencerId: lead.influencerId,
      sourceCode: lead.sourceCode,
      saleAmount: convertLeadDto.saleAmount,
      gstStatus: convertLeadDto.gstStatus,
      saleDate: new Date(convertLeadDto.saleDate),
    });

    // Keep Lead document in sync: mark as converted and set sales amount
    await this.leadsService.updateConversion(
      convertLeadDto.leadId,
      true,
      convertLeadDto.saleAmount,
    );

    return sale;
  }

  async findMySales(
    salesExecutiveId: string,
    opts?: {
      skip?: number;
      limit?: number;
      sort?: Record<string, 1 | -1>;
      filter?: Record<string, string>;
    },
  ): Promise<SaleDocument[]> {
    const filter: any = {
      salesExecutiveId: new Types.ObjectId(salesExecutiveId),
    };
    Object.assign(filter, await this.buildSaleFilter(opts?.filter));
    let q = this.saleModel.find(filter);
    if (opts?.sort && Object.keys(opts.sort).length) {
      q = q.sort(opts.sort);
    } else {
      q = q.sort({ saleDate: -1 });
    }
    if (opts?.skip != null) q = q.skip(opts.skip);
    if (opts?.limit != null && opts.limit > 0) q = q.limit(opts.limit);
    return q.exec();
  }

  async findAll(opts?: {
    skip?: number;
    limit?: number;
    sort?: Record<string, 1 | -1>;
    filter?: Record<string, string>;
  }): Promise<SaleDocument[]> {
    const filter: any = await this.buildSaleFilter(opts?.filter);
    let q = this.saleModel.find(filter);
    if (opts?.sort && Object.keys(opts.sort).length) {
      q = q.sort(opts.sort);
    } else {
      q = q.sort({ saleDate: -1 });
    }
    if (opts?.skip != null) q = q.skip(opts.skip);
    if (opts?.limit != null && opts.limit > 0) q = q.limit(opts.limit);
    return q.exec();
  }

  /** Build mongo filter from generic filter params (allowlist) + saleDate range + mobile→leadId. */
  private async buildSaleFilter(
    filterParams?: Record<string, string>,
  ): Promise<Record<string, unknown>> {
    if (!filterParams || !Object.keys(filterParams).length) return {};
    const { saleDateFrom, saleDateTo, mobile, ...rest } = filterParams;
    const mongo = buildFilter(rest, SALE_FILTER_ALLOWLIST) as Record<
      string,
      unknown
    >;
    if (mobile) {
      const lead = await this.leadsService.findByMobile(mobile);
      if (!lead) return { _id: null };
      (mongo as any).leadId = (lead as any)._id;
    }
    if (saleDateFrom || saleDateTo) {
      (mongo as any).saleDate = {};
      if (saleDateFrom) (mongo as any).saleDate.$gte = new Date(saleDateFrom);
      if (saleDateTo) (mongo as any).saleDate.$lte = new Date(saleDateTo);
    }
    return mongo;
  }

  async findOne(id: string): Promise<SaleDocument | null> {
    return this.saleModel.findById(id).exec();
  }
}
