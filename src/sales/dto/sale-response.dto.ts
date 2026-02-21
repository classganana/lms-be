import { ApiProperty } from "@nestjs/swagger";

export class SaleResponseDto {
  @ApiProperty({ example: "60d0fe4f5311236168a109ca", description: "Sale ID" })
  _id: string;

  @ApiProperty({ example: "60d0fe4f5311236168a109ca", description: "Lead ID" })
  leadId: string;

  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Sales executive ID",
  })
  salesExecutiveId: string;

  @ApiProperty({
    example: "60d0fe4f5311236168a109ca",
    description: "Influencer ID",
  })
  influencerId: string;

  @ApiProperty({ example: "SRC123", description: "Source code" })
  sourceCode: string;

  @ApiProperty({ example: 5000, description: "Sale amount" })
  saleAmount: number;

  @ApiProperty({
    example: "YES",
    enum: ["APPLIED", "YES", "NO"],
    description: "GST status",
  })
  gstStatus?: "APPLIED" | "YES" | "NO";

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Sale date",
  })
  saleDate: Date;

  @ApiProperty({
    example: "2026-01-22T16:07:52.623Z",
    description: "Creation timestamp",
  })
  createdAt?: Date;
}
