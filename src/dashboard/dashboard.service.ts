import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Lead, LeadDocument } from "../leads/schemas/lead.schema";
import {
  LeadInteraction,
  LeadInteractionDocument,
} from "../lead-interactions/schemas/lead-interaction.schema";
import { Sale, SaleDocument } from "../sales/schemas/sale.schema";
import { User, UserDocument } from "../users/schemas/user.schema";
import { Types } from "mongoose";

/** Count sale as GST customer: gstStatus YES/APPLIED or legacy gstCustomer true */
function isGstCustomer(sale: SaleDocument): boolean {
  if (sale.gstStatus === "YES" || sale.gstStatus === "APPLIED") return true;
  if ((sale as any).gstCustomer === true) return true; // backward compat
  return false;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Lead.name) private leadModel: Model<LeadDocument>,
    @InjectModel(LeadInteraction.name)
    private leadInteractionModel: Model<LeadInteractionDocument>,
    @InjectModel(Sale.name) private saleModel: Model<SaleDocument>,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async getAdminSummary(startDate?: Date, endDate?: Date) {
    const dateMatch: any = {};
    if (startDate || endDate) {
      dateMatch.createdAt = {};
      if (startDate) dateMatch.createdAt.$gte = startDate;
      if (endDate) dateMatch.createdAt.$lte = endDate;
    }

    // Total Leads
    const totalLeads = await this.leadModel.countDocuments(dateMatch);

    // Get all interactions with date filter
    const interactionMatch: any = {};
    if (startDate || endDate) {
      interactionMatch.createdAt = {};
      if (startDate) interactionMatch.createdAt.$gte = startDate;
      if (endDate) interactionMatch.createdAt.$lte = endDate;
    }

    const interactions = await this.leadInteractionModel
      .find(interactionMatch)
      .exec();

    // Interested (rating >= 3 and not wrong number)
    const interested = interactions.filter(
      (i) => i.rating >= 3 && i.callStatus !== "WRONG",
    ).length;

    // Non-Interested (rating <= 2 and not wrong number)
    const nonInterested = interactions.filter(
      (i) => i.rating <= 2 && i.callStatus !== "WRONG",
    ).length;

    // Wrong Numbers
    const wrongNumbers = interactions.filter(
      (i) => i.callStatus === "WRONG",
    ).length;

    // Pending Leads (leads without any interactions)
    const leadIdsWithInteractions = new Set(
      interactions.map((i) => i.leadId.toString()),
    );
    const allLeadIds = (await this.leadModel.find(dateMatch).exec()).map((l) =>
      l._id.toString(),
    );
    const pendingLeads = allLeadIds.filter(
      (id) => !leadIdsWithInteractions.has(id),
    ).length;

    // Sales data
    const saleMatch: any = {};
    if (startDate || endDate) {
      saleMatch.saleDate = {};
      if (startDate) saleMatch.saleDate.$gte = startDate;
      if (endDate) saleMatch.saleDate.$lte = endDate;
    }

    const sales = await this.saleModel.find(saleMatch).exec();
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const gstCustomers = sales.filter((s) => isGstCustomer(s)).length;
    const gstCustomersPercentage =
      totalSales > 0 ? (gstCustomers / totalSales) * 100 : 0;

    return {
      totalLeads,
      interested,
      nonInterested,
      wrongNumbers,
      pendingLeads,
      totalSales,
      totalRevenue,
      gstCustomersPercentage: parseFloat(gstCustomersPercentage.toFixed(2)),
    };
  }

  async getSalesExecutivesPerformance(startDate?: Date, endDate?: Date) {
    const interactionMatch: any = {};
    const saleMatch: any = {};

    if (startDate || endDate) {
      interactionMatch.createdAt = {};
      saleMatch.saleDate = {};
      if (startDate) {
        interactionMatch.createdAt.$gte = startDate;
        saleMatch.saleDate.$gte = startDate;
      }
      if (endDate) {
        interactionMatch.createdAt.$lte = endDate;
        saleMatch.saleDate.$lte = endDate;
      }
    }

    const interactions = await this.leadInteractionModel
      .find(interactionMatch)
      .exec();
    const sales = await this.saleModel.find(saleMatch).exec();

    // Group by sales executive
    const execMap = new Map<string, any>();

    // Process interactions
    interactions.forEach((interaction) => {
      const execId = interaction.salesExecutiveId.toString();
      if (!execMap.has(execId)) {
        execMap.set(execId, {
          salesExecutiveId: execId,
          totalLeads: 0,
          followUps: 0,
          sales: 0,
          conversionPercentage: 0,
        });
      }
      const exec = execMap.get(execId);
      exec.totalLeads++;
      if (interaction.followUpDate) {
        exec.followUps++;
      }
    });

    // Process sales
    sales.forEach((sale) => {
      const execId = sale.salesExecutiveId.toString();
      if (!execMap.has(execId)) {
        execMap.set(execId, {
          salesExecutiveId: execId,
          totalLeads: 0,
          followUps: 0,
          sales: 0,
          conversionPercentage: 0,
        });
      }
      const exec = execMap.get(execId);
      exec.sales++;
    });

    // Calculate conversion percentages and get user names
    const executives = await Promise.all(
      Array.from(execMap.values()).map(async (exec) => {
        const user = await this.userModel
          .findById(exec.salesExecutiveId)
          .exec();
        exec.conversionPercentage =
          exec.totalLeads > 0
            ? parseFloat(((exec.sales / exec.totalLeads) * 100).toFixed(2))
            : 0;
        return {
          ...exec,
          name: user?.name || "Unknown",
          email: user?.email || "",
        };
      }),
    );

    return executives;
  }

  async getInfluencerWiseSales(startDate?: Date, endDate?: Date) {
    const match: any = {};
    if (startDate || endDate) {
      match.saleDate = {};
      if (startDate) match.saleDate.$gte = startDate;
      if (endDate) match.saleDate.$lte = endDate;
    }

    const sales = await this.saleModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            influencerId: "$influencerId",
            sourceCode: "$sourceCode",
          },
          totalSales: { $sum: 1 },
          totalRevenue: { $sum: "$saleAmount" },
        },
      },
      {
        $lookup: {
          from: "influencers",
          localField: "_id.influencerId",
          foreignField: "_id",
          as: "influencer",
        },
      },
      {
        $unwind: {
          path: "$influencer",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          influencerId: "$_id.influencerId",
          influencerName: "$influencer.name",
          sourceCode: "$_id.sourceCode",
          totalSales: 1,
          totalRevenue: 1,
        },
      },
    ]);

    return sales;
  }

  async getNonAdminSummary(
    salesExecutiveId: string,
    startDate?: Date,
    endDate?: Date,
  ) {
    const interactionMatch: any = {
      salesExecutiveId: new Types.ObjectId(salesExecutiveId),
    };
    const saleDateMatch: any = {
      salesExecutiveId: new Types.ObjectId(salesExecutiveId),
    };

    if (startDate || endDate) {
      interactionMatch.createdAt = {};
      saleDateMatch.saleDate = {};
      if (startDate) {
        interactionMatch.createdAt.$gte = startDate;
        saleDateMatch.saleDate.$gte = startDate;
      }
      if (endDate) {
        interactionMatch.createdAt.$lte = endDate;
        saleDateMatch.saleDate.$lte = endDate;
      }
    }

    // Get interactions created by this executive
    const interactions = await this.leadInteractionModel
      .find(interactionMatch)
      .exec();

    // Get unique lead IDs from interactions
    const leadIds = [
      ...new Set(interactions.map((i) => i.leadId.toString())),
    ].map((id) => new Types.ObjectId(id));

    // Calculate metrics - unique leads this executive has interacted with
    const totalLeads = leadIds.length;
    const interested = interactions.filter(
      (i) => i.rating >= 3 && i.callStatus !== "WRONG",
    ).length;
    const nonInterested = interactions.filter(
      (i) => i.rating <= 2 && i.callStatus !== "WRONG",
    ).length;
    const wrongNumbers = interactions.filter(
      (i) => i.callStatus === "WRONG",
    ).length;

    // For pending leads, we need to check leads created by this executive that don't have interactions
    // But since we're scoping by interactions, pending would be 0 for this executive's view
    // OR we could check leads created by this executive without any interactions by anyone
    const leadsCreatedByExecutive = await this.leadModel
      .find({ createdBy: new Types.ObjectId(salesExecutiveId) })
      .exec();

    const leadIdsWithInteractions = new Set(
      interactions.map((i) => i.leadId.toString()),
    );

    // Pending leads: leads created by this executive that have no interactions
    const allInteractionsForCreatedLeads = await this.leadInteractionModel
      .find({ leadId: { $in: leadsCreatedByExecutive.map((l) => l._id) } })
      .exec();
    const allLeadIdsWithInteractions = new Set(
      allInteractionsForCreatedLeads.map((i) => i.leadId.toString()),
    );
    const pendingLeads = leadsCreatedByExecutive.filter(
      (l) => !allLeadIdsWithInteractions.has(l._id.toString()),
    ).length;

    // Sales
    const sales = await this.saleModel.find(saleDateMatch).exec();
    const totalSales = sales.length;
    const totalRevenue = sales.reduce((sum, sale) => sum + sale.saleAmount, 0);
    const gstCustomers = sales.filter((s) => isGstCustomer(s)).length;
    const gstCustomersPercentage =
      totalSales > 0 ? (gstCustomers / totalSales) * 100 : 0;

    // Current month sales
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthSales = sales.filter(
      (s) => s.saleDate >= currentMonthStart,
    );
    const currentMonthRevenue = currentMonthSales.reduce(
      (sum, sale) => sum + sale.saleAmount,
      0,
    );

    return {
      totalLeads,
      interested,
      nonInterested,
      wrongNumbers,
      pendingLeads,
      totalSales,
      totalRevenue,
      gstCustomersPercentage: parseFloat(gstCustomersPercentage.toFixed(2)),
      currentMonthSales: currentMonthSales.length,
      currentMonthRevenue,
    };
  }
}
