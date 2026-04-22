import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LeadsService } from "./leads.service";
import { LeadsController } from "./leads.controller";
import { Lead, LeadSchema } from "./schemas/lead.schema";
import { Sale, SaleSchema } from "../sales/schemas/sale.schema";
import { ReportingConversionDateBackfill } from "./reporting-conversion-date.backfill";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: Sale.name, schema: SaleSchema },
    ]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService, ReportingConversionDateBackfill],
  exports: [LeadsService],
})
export class LeadsModule {}
