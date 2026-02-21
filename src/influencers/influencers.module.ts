import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { InfluencersService } from "./influencers.service";
import {
  AdminInfluencersController,
  SalesInfluencersController,
} from "./influencers.controller";
import { Influencer, InfluencerSchema } from "./schemas/influencer.schema";

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Influencer.name, schema: InfluencerSchema },
    ]),
  ],
  controllers: [AdminInfluencersController, SalesInfluencersController],
  providers: [InfluencersService],
  exports: [InfluencersService],
})
export class InfluencersModule {}
