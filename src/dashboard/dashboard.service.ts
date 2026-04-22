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

/** Count sale as GST customer: gstStatus YES/APPLIED/APPLIED_THROUGH_US or legacy gstCustomer true */
function isGstCustomer(sale: SaleDocument): boolean {
  if (sale.gstStatus === "YES" || sale.gstStatus === "APPLIED" || sale.gstStatus === "APPLIED_THROUGH_US") return true;
  if ((sale as any).gstCustomer === true) return true; // backward compat
  return false;
}

/** Local calendar month bounds (same convention as getEmployeeSales default range). */
function calendarMonthBoundsLocal(ref = new Date()): {
  dateStart: Date;
  dateEnd: Date;
} {
  return {
    dateStart: new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0),
    dateEnd: new Date(
      ref.getFullYear(),
      ref.getMonth() + 1,
      0,
      23,
      59,
      59,
      999,
    ),
  };
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

  /**
   * Revenue attributed to conversions in [dateStart, dateEnd] (by lead.conversionDate).
   * Sale rows: current saleAmount on Sale, only if a Lead still exists ($lookup + unwind).
   * Lead-only: converted leads with salesAmount and no Sale document, same conversion window.
   */
  private async sumRevenueByConversionWindow(
    dateStart: Date,
    dateEnd: Date,
    salesExecutiveId?: Types.ObjectId,
  ): Promise<number> {
    const convWindow = { $gte: dateStart, $lte: dateEnd };
    const salePreMatch: Record<string, unknown> = {};
    if (salesExecutiveId) {
      salePreMatch.salesExecutiveId = salesExecutiveId;
    }

    const fromSalesAgg = await this.saleModel
      .aggregate([
        { $match: salePreMatch },
        {
          $lookup: {
            from: this.leadModel.collection.name,
            localField: "leadId",
            foreignField: "_id",
            as: "lead",
          },
        },
        { $unwind: "$lead" },
        { $match: { "lead.conversionDate": convWindow } },
        { $group: { _id: null, total: { $sum: "$saleAmount" } } },
      ])
      .exec();

    const allSaleLeadIds = (
      (await this.saleModel.distinct("leadId")) as unknown[]
    ).filter((id) => id != null) as Types.ObjectId[];

    const leadMatch: Record<string, unknown> = {
      converted: true,
      salesAmount: { $gt: 0 },
      conversionDate: convWindow,
      _id: { $nin: allSaleLeadIds },
    };
    if (salesExecutiveId) leadMatch.createdBy = salesExecutiveId;

    const fromLeadsAgg = await this.leadModel
      .aggregate([
        { $match: leadMatch },
        { $group: { _id: null, total: { $sum: "$salesAmount" } } },
      ])
      .exec();

    const fromSales = (fromSalesAgg[0]?.total as number) ?? 0;
    const fromLeads = (fromLeadsAgg[0]?.total as number) ?? 0;
    return fromSales + fromLeads;
  }

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

    // Build a set of converted lead IDs so converted leads are excluded
    const convertedLeadIds = new Set(
      interactions
        .filter((i) => i.converted)
        .map((i) => i.leadId.toString()),
    );

    // Interested (rating >= 3, not wrong number, and not converted)
    const interested = interactions.filter(
      (i) =>
        i.rating >= 3 &&
        i.callStatus !== "WRONG" && i.callStatus !== "WRONG_NUMBER" &&
        !convertedLeadIds.has(i.leadId.toString()),
    ).length;

    // Non-Interested (rating <= 2 and not wrong number)
    const nonInterested = interactions.filter(
      (i) => i.rating <= 2 && i.callStatus !== "WRONG" && i.callStatus !== "WRONG_NUMBER",
    ).length;

    // Wrong Numbers
    const wrongNumbers = interactions.filter(
      (i) => i.callStatus === "WRONG" || i.callStatus === "WRONG_NUMBER",
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

    const conversionMatch: any = { converted: true };
    if (startDate || endDate) {
      conversionMatch.conversionDate = {};
      if (startDate) conversionMatch.conversionDate.$gte = startDate;
      if (endDate) conversionMatch.conversionDate.$lte = endDate;
    }
    const conversionsInPeriod =
      await this.leadModel.countDocuments(conversionMatch);

    const { dateStart, dateEnd } = calendarMonthBoundsLocal();
    const thisMonthRevenue = await this.sumRevenueByConversionWindow(
      dateStart,
      dateEnd,
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
      conversionsInPeriod,
      thisMonthRevenue: parseFloat(thisMonthRevenue.toFixed(2)),
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

  async getEmployeeSales(startDate?: Date, endDate?: Date) {
    const now = new Date();
    let dateStart: Date;
    let dateEnd: Date;

    if (startDate || endDate) {
      dateStart = startDate
        ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate(), 0, 0, 0, 0)
        : new Date(0);
      dateEnd = endDate
        ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate(), 23, 59, 59, 999)
        : new Date(8640000000000000);
    } else {
      dateStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    }

    const dateFilter = { $gte: dateStart, $lte: dateEnd };

    // 1) Sale model: convert endpoint creates these. Filter by saleDate.
    const saleResults = await this.saleModel
      .aggregate([
        { $match: { saleDate: dateFilter } },
        { $group: { _id: "$salesExecutiveId", total: { $sum: "$saleAmount" } } },
      ])
      .exec();

    // 2) Lead model: revenue recorded on lead without a Sale row in this window. Bucket by conversionDate.
    const leadResults = await this.leadModel
      .aggregate([
        {
          $match: {
            converted: true,
            salesAmount: { $gt: 0 },
            conversionDate: dateFilter,
            // Exclude leads that have a Sale in this period (those are counted via saleDate above)
            _id: {
              $nin: (
                await this.saleModel.distinct("leadId", { saleDate: dateFilter })
              ).map((id: any) => id),
            },
          },
        },
        { $group: { _id: "$createdBy", total: { $sum: "$salesAmount" } } },
      ])
      .exec();

    const merged = new Map<string, number>();
    for (const r of saleResults) {
      const id = r._id?.toString();
      if (id) merged.set(id, (merged.get(id) || 0) + r.total);
    }
    for (const r of leadResults) {
      const id = r._id?.toString();
      if (id) merged.set(id, (merged.get(id) || 0) + r.total);
    }

    const userIds = Array.from(merged.keys());
    const users =
      userIds.length > 0
        ? await this.userModel
            .find({ _id: { $in: userIds.map((id) => new Types.ObjectId(id)) } })
            .exec()
        : [];

    const userMap = new Map(users.map((u) => [u._id.toString(), u.name || "Unknown"]));
    const employees = Array.from(merged.entries())
      .map(([userId, sales]) => ({
        id: userId,
        name: userMap.get(userId) || "Unknown",
        sales,
      }))
      .sort((a, b) => b.sales - a.sales);

    return {
      month: startDate || endDate ? "custom" : "current",
      employees,
    };
  }

  async getUserDailyActivity(salesExecutiveId: string, date?: Date) {
    // Normalize to given date's start/end in UTC (or today if not provided) so server timezone doesn't shift the day
    const target = date ? new Date(date) : new Date();
    const startOfDay = new Date(
      Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        target.getUTCDate(),
        0,
        0,
        0,
        0,
      ),
    );
    const endOfDay = new Date(
      Date.UTC(
        target.getUTCFullYear(),
        target.getUTCMonth(),
        target.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );

    const execObjectId = new Types.ObjectId(salesExecutiveId);

    // Leads created today by this user
    const createdLeads = await this.leadModel
      .find({
        createdBy: execObjectId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })
      .exec();

    // Interactions created today by this user
    const interactionsToday = await this.leadInteractionModel
      .find({
        salesExecutiveId: execObjectId,
        createdAt: { $gte: startOfDay, $lt: endOfDay },
      })
      .exec();

    const interactedLeadIdStrings = Array.from(
      new Set(interactionsToday.map((i) => i.leadId.toString())),
    );

    const interactedLeads =
      interactedLeadIdStrings.length > 0
        ? await this.leadModel
            .find({
              _id: {
                $in: interactedLeadIdStrings.map(
                  (id) => new Types.ObjectId(id),
                ),
              },
            })
            .exec()
        : [];

    const createdLeadIds = createdLeads.map((l) => l._id.toString());
    const interactedLeadIds = interactedLeadIdStrings;

    // Scope: leads created by this user OR has any interaction by this user
    const [createdByLeadIds, interactedLeadIdsFromInteractions] = await Promise.all([
      this.leadModel.distinct("_id", { createdBy: execObjectId }),
      this.leadInteractionModel.distinct("leadId", {
        salesExecutiveId: execObjectId,
      }),
    ]);
    const allRelevantLeadIds = Array.from(
      new Set([
        ...createdByLeadIds.map((id) => id.toString()),
        ...interactedLeadIdsFromInteractions.map((id) => id.toString()),
      ]),
    );

    // Follow-up Today: leads updated today but NOT created today (exclude newly created)
    const followUpLeads =
      allRelevantLeadIds.length > 0
        ? await this.leadModel
            .find({
              _id: {
                $in: allRelevantLeadIds.map((id) => new Types.ObjectId(id)),
              },
              updatedAt: { $gte: startOfDay, $lt: endOfDay },
              createdAt: { $lt: startOfDay },
            })
            .exec()
        : [];
    const updatedTodayCount = followUpLeads.length;

    // Total Leads Touched = Created Today + Follow-up Today
    const leadMap = new Map<string, LeadDocument>();
    createdLeads.forEach((l) => leadMap.set(l._id.toString(), l));
    followUpLeads.forEach((l) => leadMap.set(l._id.toString(), l));

    const user = await this.userModel.findById(execObjectId).exec();

    return {
      date: startOfDay.toISOString().slice(0, 10),
      userId: salesExecutiveId,
      userName: user?.name || "Unknown",
      createdCount: createdLeadIds.length,
      touchedCount: updatedTodayCount,
      leads: Array.from(leadMap.values()).map((l) => ({
        id: l._id.toString(),
        name: l.name || "",
        mobile: l.mobile,
        state: l.state || "",
        city: l.city || "",
        converted: l.converted,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
      })),
      createdLeadIds,
      interactedLeadIds,
    };
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

    // Build a set of converted lead IDs so converted leads are excluded
    const convertedLeadIds = new Set(
      interactions
        .filter((i) => i.converted)
        .map((i) => i.leadId.toString()),
    );

    // Get unique lead IDs from interactions
    const leadIds = [
      ...new Set(interactions.map((i) => i.leadId.toString())),
    ].map((id) => new Types.ObjectId(id));

    // Calculate metrics - unique leads this executive has interacted with
    const totalLeads = leadIds.length;
    const interested = interactions.filter(
      (i) =>
        i.rating >= 3 &&
        i.callStatus !== "WRONG" && i.callStatus !== "WRONG_NUMBER" &&
        !convertedLeadIds.has(i.leadId.toString()),
    ).length;
    const nonInterested = interactions.filter(
      (i) => i.rating <= 2 && i.callStatus !== "WRONG" && i.callStatus !== "WRONG_NUMBER",
    ).length;
    const wrongNumbers = interactions.filter(
      (i) => i.callStatus === "WRONG" || i.callStatus === "WRONG_NUMBER",
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

    const execOid = new Types.ObjectId(salesExecutiveId);

    // Sales (table rows always scoped to this executive via saleDateMatch)
    const sales = await this.saleModel.find(saleDateMatch).exec();
    let totalSales = sales.length;
    let totalRevenue = sales.reduce((sum, sale) => sum + sale.saleAmount, 0);

    // All-time totals: add revenue on leads they own with no Sale row (same attribution as employee-sales)
    if (!startDate && !endDate) {
      const allLeadIdsWithSale = (
        (await this.saleModel.distinct("leadId")) as unknown[]
      ).filter((id) => id != null) as Types.ObjectId[];
      const [leadOnlyRow] = await this.leadModel
        .aggregate([
          {
            $match: {
              converted: true,
              salesAmount: { $gt: 0 },
              createdBy: execOid,
              _id: { $nin: allLeadIdsWithSale },
            },
          },
          {
            $group: {
              _id: null,
              revenue: { $sum: "$salesAmount" },
              n: { $sum: 1 },
            },
          },
        ])
        .exec();
      totalRevenue += (leadOnlyRow?.revenue as number) ?? 0;
      totalSales += (leadOnlyRow?.n as number) ?? 0;
    }

    const gstCustomers = sales.filter((s) => isGstCustomer(s)).length;
    const gstCustomersPercentage =
      sales.length > 0 ? (gstCustomers / sales.length) * 100 : 0;
    const { dateStart, dateEnd } = calendarMonthBoundsLocal();
    const thisMonthRevenue = await this.sumRevenueByConversionWindow(
      dateStart,
      dateEnd,
      execOid,
    );

    const convWindow = { $gte: dateStart, $lte: dateEnd };
    const currentMonthSalesAgg = await this.saleModel
      .aggregate([
        { $match: { salesExecutiveId: execOid } },
        {
          $lookup: {
            from: this.leadModel.collection.name,
            localField: "leadId",
            foreignField: "_id",
            as: "lead",
          },
        },
        { $unwind: "$lead" },
        { $match: { "lead.conversionDate": convWindow } },
        { $count: "n" },
      ])
      .exec();
    const allSaleLeadIds = (
      (await this.saleModel.distinct("leadId")) as unknown[]
    ).filter((id) => id != null) as Types.ObjectId[];
    const leadOnlyConversions = await this.leadModel
      .countDocuments({
        converted: true,
        salesAmount: { $gt: 0 },
        createdBy: execOid,
        conversionDate: convWindow,
        _id: { $nin: allSaleLeadIds },
      })
      .exec();
    const currentMonthSales =
      ((currentMonthSalesAgg[0]?.n as number) ?? 0) + leadOnlyConversions;

    const conversionMatch: any = {
      converted: true,
      createdBy: new Types.ObjectId(salesExecutiveId),
    };
    if (startDate || endDate) {
      conversionMatch.conversionDate = {};
      if (startDate) conversionMatch.conversionDate.$gte = startDate;
      if (endDate) conversionMatch.conversionDate.$lte = endDate;
    }
    const conversionsInPeriod =
      await this.leadModel.countDocuments(conversionMatch);

    return {
      totalLeads,
      interested,
      nonInterested,
      wrongNumbers,
      pendingLeads,
      totalSales,
      totalRevenue,
      gstCustomersPercentage: parseFloat(gstCustomersPercentage.toFixed(2)),
      currentMonthSales,
      currentMonthRevenue: parseFloat(thisMonthRevenue.toFixed(2)),
      thisMonthRevenue: parseFloat(thisMonthRevenue.toFixed(2)),
      conversionsInPeriod,
    };
  }
}
