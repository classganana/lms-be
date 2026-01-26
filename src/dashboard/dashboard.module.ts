import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardService } from './dashboard.service';
import {
  AdminDashboardController,
  SalesDashboardController,
} from './dashboard.controller';
import { Lead, LeadSchema } from '../leads/schemas/lead.schema';
import {
  LeadInteraction,
  LeadInteractionSchema,
} from '../lead-interactions/schemas/lead-interaction.schema';
import { Sale, SaleSchema } from '../sales/schemas/sale.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Lead.name, schema: LeadSchema },
      { name: LeadInteraction.name, schema: LeadInteractionSchema },
      { name: Sale.name, schema: SaleSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AdminDashboardController, SalesDashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

