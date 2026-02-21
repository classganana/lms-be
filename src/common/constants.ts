export const Constants = {
  MONGO_PROVIDER: "MONGO_PROVIDER",
};

/** GST status: APPLIED = GST applied on invoice, YES = registered, NO = not registered */
export const GST_STATUS = ["APPLIED", "YES", "NO"] as const;
export type GstStatus = (typeof GST_STATUS)[number];
