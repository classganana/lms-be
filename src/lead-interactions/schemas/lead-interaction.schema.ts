import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type LeadInteractionDocument = LeadInteraction & Document;

@Schema({ timestamps: true })
export class LeadInteraction {
  @Prop({ type: Types.ObjectId, ref: 'Lead', required: true })
  leadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  salesExecutiveId: Types.ObjectId;

  @Prop({
    required: true,
    enum: ['CONNECTED', 'NOT_CONNECTED', 'WRONG'],
  })
  callStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'WRONG';

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  notes: string;

  @Prop({ default: null })
  followUpDate?: Date | null;

  @Prop({ default: false })
  converted: boolean;

  @Prop({ default: false })
  gstCustomer: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const LeadInteractionSchema =
  SchemaFactory.createForClass(LeadInteraction);

