import { ApiProperty } from "@nestjs/swagger";

export class LeadInteractionResponseDto {
  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Lead interaction ID",
  })
  _id: string;

  @ApiProperty({ example: "60d0fe4f5311236168a109ca", description: "Lead ID" })
  leadId: string;

  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Sales executive ID",
  })
  salesExecutiveId: string;

  @ApiProperty({
    example: "CONNECTED",
    enum: ["CONNECTED", "NOT_CONNECTED", "WRONG"],
    description: "Call status",
  })
  callStatus: "CONNECTED" | "NOT_CONNECTED" | "WRONG";

  @ApiProperty({
    example: 4,
    minimum: 1,
    maximum: 5,
    description: "Rating (1-5)",
  })
  rating: number;

  @ApiProperty({
    example: "Customer showed interest in product",
    description: "Interaction notes",
  })
  notes: string;

  @ApiProperty({
    example: "2026-01-25T10:00:00.000Z",
    nullable: true,
    description: "Follow-up date",
  })
  followUpDate?: Date | null;

  @ApiProperty({
    example: false,
    description: "Whether lead is converted to sale",
  })
  converted: boolean;

  @ApiProperty({
    example: "NO",
    enum: ["APPLIED", "YES", "NO"],
    description: "GST status",
  })
  gstStatus?: "APPLIED" | "YES" | "NO";

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Creation timestamp",
  })
  createdAt?: Date;

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Last update timestamp",
  })
  updatedAt?: Date;
}
