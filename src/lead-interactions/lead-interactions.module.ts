import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { LeadInteractionsService } from "./lead-interactions.service";
import { LeadInteractionsController } from "./lead-interactions.controller";
import {
  LeadInteraction,
  LeadInteractionSchema,
} from "./schemas/lead-interaction.schema";
import { LeadsModule } from "../leads/leads.module";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: LeadInteraction.name, schema: LeadInteractionSchema },
    ]),
    LeadsModule,
  ],
  controllers: [LeadInteractionsController],
  providers: [LeadInteractionsService],
  exports: [LeadInteractionsService],
})
export class LeadInteractionsModule {}
