import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { LeadsService } from "./leads.service";

/**
 * One-time style backfill on startup: copy saleDate → conversionDate, then snapshot updatedAt
 * for converted leads still missing conversionDate. Makes legacy rows stable for reporting.
 */
@Injectable()
export class ReportingConversionDateBackfill implements OnModuleInit {
  private readonly logger = new Logger(ReportingConversionDateBackfill.name);

  constructor(private readonly leadsService: LeadsService) {}

  async onModuleInit(): Promise<void> {
    try {
      const { fromSales, fromUpdatedAt } =
        await this.leadsService.backfillMissingConversionDates();
      if (fromSales > 0 || fromUpdatedAt > 0) {
        this.logger.log(
          `conversionDate backfill: ${fromSales} from sales, ${fromUpdatedAt} from updatedAt`,
        );
      }
    } catch (err) {
      this.logger.error("conversionDate backfill failed", err);
    }
  }
}
