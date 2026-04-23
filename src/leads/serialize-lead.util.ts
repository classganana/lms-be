import { Types } from "mongoose";
import { LeadDocument } from "./schemas/lead.schema";

function toIdString(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (v instanceof Types.ObjectId) return v.toHexString();
  if (typeof v === "object" && v !== null && "$oid" in v) {
    return String((v as { $oid: string }).$oid);
  }
  if (typeof v === "object" && v !== null && "_id" in (v as object)) {
    return toIdString((v as { _id: unknown })._id);
  }
  if (
    v != null &&
    typeof (v as { toString?: () => string }).toString === "function"
  ) {
    const fn = (v as { toString: () => string }).toString;
    if (fn !== Object.prototype.toString) {
      const s = (v as { toString: () => string }).toString();
      if (typeof s === "string" && s && s !== "[object Object]") return s;
    }
  }
  return String(v);
}

function dateToIsoOrNull(d: unknown): string | null {
  if (d == null) return null;
  if (d instanceof Date) {
    return isNaN(d.getTime()) ? null : d.toISOString();
  }
  if (typeof d === "string" || typeof d === "number") {
    const t = new Date(d);
    return isNaN(t.getTime()) ? null : t.toISOString();
  }
  if (typeof d === "object" && d !== null && "$date" in d) {
    const t = new Date(String((d as { $date: string }).$date));
    return isNaN(t.getTime()) ? null : t.toISOString();
  }
  return null;
}

/**
 * Normalizes a Mongoose lead document to a JSON-safe object for the API:
 * - `id` and `_id` as hex strings
 * - `influencerId` / `createdBy` as strings (empty string if absent)
 * - dates as ISO strings or null
 */
export function serializeLeadForClient(lead: LeadDocument | null): Record<
  string,
  unknown
> | null {
  if (!lead) return null;
  const o = lead.toObject
    ? lead.toObject({ virtuals: true })
    : (lead as unknown as Record<string, unknown>);

  const id = toIdString(o._id);

  const infl = o.influencerId;
  const influencerId =
    infl != null && infl !== "" ? toIdString(infl) : "";

  return {
    id,
    _id: id,
    name: o.name ?? "",
    mobile: o.mobile,
    state: o.state ?? "",
    city: o.city,
    address: o.address,
    pincode: o.pincode,
    email: o.email,
    influencerId,
    sourceCode: o.sourceCode ?? "",
    callStatus: o.callStatus ?? null,
    rating: o.rating ?? null,
    notes: o.notes ?? "",
    followUpDate: dateToIsoOrNull(o.followUpDate),
    converted: Boolean(o.converted),
    conversionDate: dateToIsoOrNull(o.conversionDate),
    gstStatus: o.gstStatus ?? "NO",
    gstCustomer: o.gstCustomer,
    salesAmount: o.salesAmount ?? null,
    paymentInfoShared: Boolean(o.paymentInfoShared),
    createdBy: o.createdBy != null ? toIdString(o.createdBy) : undefined,
    createdAt: dateToIsoOrNull(o.createdAt) ?? undefined,
    updatedAt: dateToIsoOrNull(o.updatedAt) ?? undefined,
  };
}

export function serializeLeadsForClient(
  leads: LeadDocument[],
): Record<string, unknown>[] {
  return leads
    .map((doc) => serializeLeadForClient(doc))
    .filter((x): x is Record<string, unknown> => x != null);
}
