export const Constants = {
  MONGO_PROVIDER: "MONGO_PROVIDER",
};

/** GST status: YES = registered, NO = not registered, APPLIED = GST applied on invoice, APPLIED_THROUGH_US = GST applied through us */
export const GST_STATUS = ["YES", "NO", "APPLIED", "APPLIED_THROUGH_US"] as const;
export type GstStatus = (typeof GST_STATUS)[number];
