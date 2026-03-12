import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type LeadInteractionDocument = LeadInteraction & Document;

@Schema({ timestamps: true })
export class LeadInteraction {
  @Prop({ type: Types.ObjectId, ref: "Lead", required: true })
  leadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: "User", required: true })
  salesExecutiveId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ["CONNECTED", "NOT_CONNECTED", "BUSY", "WRONG", "WRONG_NUMBER"],
  })
  callStatus: "CONNECTED" | "NOT_CONNECTED" | "BUSY" | "WRONG" | "WRONG_NUMBER";

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  notes: string;

  @Prop({ default: null })
  followUpDate?: Date | null;

  @Prop({ default: false })
  converted: boolean;

  @Prop({ required: false, enum: ["APPLIED", "APPLIED_THROUGH_US", "YES", "NO"], default: "NO" })
  gstStatus?: "APPLIED" | "APPLIED_THROUGH_US" | "YES" | "NO";

  @Prop({ required: false })
  gstCustomer?: boolean; // deprecated, use gstStatus

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadInteractionSchema =
  SchemaFactory.createForClass(LeadInteraction);
