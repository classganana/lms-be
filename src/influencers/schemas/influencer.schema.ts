import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

export type SourceCodeDocument = SourceCode & Document;

@Schema({ _id: false })
export class SourceCode {
  @Prop({ required: true })
  code: string;

  @Prop({ required: true, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" })
  status: "ACTIVE" | "INACTIVE";

  @Prop({ required: true, default: Date.now })
  activatedAt: Date;

  @Prop({ default: null })
  deactivatedAt?: Date | null;
}

export const SourceCodeSchema = SchemaFactory.createForClass(SourceCode);

export type InfluencerDocument = Influencer & Document;

@Schema({ timestamps: true })
export class Influencer {
  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [SourceCodeSchema], default: [] })
  sourceCodes: SourceCode[];

  createdAt?: Date;
  updatedAt?: Date;
}

export const InfluencerSchema = SchemaFactory.createForClass(Influencer);
