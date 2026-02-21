import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { SalesService } from "./sales.service";
import { SalesController } from "./sales.controller";
import { Sale, SaleSchema } from "./schemas/sale.schema";
import { LeadsModule } from "../leads/leads.module";
import { LeadInteractionsModule } from "../lead-interactions/lead-interactions.module";

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Sale.name, schema: SaleSchema }]),
    LeadsModule,
    LeadInteractionsModule,
  ],
  controllers: [SalesController],
  providers: [SalesService],
  exports: [SalesService],
})
export class SalesModule {}
