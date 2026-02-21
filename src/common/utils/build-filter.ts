import { Types } from "mongoose";

const RESERVED = ["page", "limit", "sortBy", "sortOrder"];

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Build MongoDB filter from query object. Only keys in allowlist are applied. */
export function buildFilter(
  query: Record<string, string | undefined>,
  allowlist: Record<
    string,
    "string" | "objectId" | "boolean" | "number" | "stringExact"
  >,
): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  for (const [key, type] of Object.entries(allowlist)) {
    const raw = query[key];
    if (raw === undefined || raw === "") continue;
    switch (type) {
      case "string":
        filter[key] = new RegExp(escapeRegex(raw), "i");
        break;
      case "stringExact":
        filter[key] = raw;
        break;
      case "objectId":
        if (Types.ObjectId.isValid(raw)) filter[key] = new Types.ObjectId(raw);
        break;
      case "boolean":
        if (raw === "true") filter[key] = true;
        else if (raw === "false") filter[key] = false;
        break;
      case "number": {
        const n = Number(raw);
        if (!Number.isNaN(n)) filter[key] = n;
        break;
      }
    }
  }
  return filter;
}

/** Extract filter params from full query, excluding reserved and non-allowlist keys */
export function getFilterQuery(
  query: Record<string, any>,
  allowlist: Record<string, unknown>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const key of Object.keys(allowlist)) {
    const v = query[key];
    if (v !== undefined && v !== "" && !RESERVED.includes(key)) {
      out[key] = String(v);
    }
  }
  return out;
}
