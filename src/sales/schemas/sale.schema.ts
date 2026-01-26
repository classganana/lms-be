import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SaleDocument = Sale & Document;

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class Sale {
  @Prop({ type: Types.ObjectId, ref: 'Lead', required: true, unique: true })
  leadId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  salesExecutiveId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Influencer', required: true })
  influencerId: Types.ObjectId;

  @Prop({ required: true })
  sourceCode: string;

  @Prop({ required: true })
  saleAmount: number;

  @Prop({ required: true })
  gstCustomer: boolean;

  @Prop({ required: true, default: Date.now })
  saleDate: Date;

  createdAt?: Date;
}

export const SaleSchema = SchemaFactory.createForClass(Sale);

