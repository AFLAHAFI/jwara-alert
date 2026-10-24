/** Kinds of health centre. Shared by the client form and the server (no server-only imports here). */
export type FacilityKind = "phc" | "fhc" | "chc" | "taluk" | "district" | "private" | "other";
export const FACILITY_KINDS: FacilityKind[] = ["phc", "fhc", "chc", "taluk", "district", "private", "other"];
