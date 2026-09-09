import type { Route } from "next";
export const PROJECT_PREFIX = "midam-project-v1:";
export interface ProjectRecord {
  id: string;
  title: string;
  updatedAt: string;
  status: "draft" | "result" | "published";
  kind: "input" | "metal" | "car";
  thumbnail: string;
  payload: unknown;
}
export function readProject(id: string): ProjectRecord | null {
  const raw = localStorage.getItem(PROJECT_PREFIX + id);
  if (!raw) return null;
  const value = JSON.parse(raw) as ProjectRecord;
  if (
    value.id !== id ||
    typeof value.title !== "string" ||
    !["input", "metal", "car"].includes(value.kind) ||
    !["draft", "result", "published"].includes(value.status) ||
    typeof value.thumbnail !== "string" ||
    !Number.isFinite(Date.parse(value.updatedAt))
  ) {
    throw new Error("Invalid saved project");
  }
  return value;
}
export function saveProject(record: ProjectRecord) {
  localStorage.setItem(PROJECT_PREFIX + record.id, JSON.stringify(record));
}
export function projectHref(project: Pick<ProjectRecord, "id" | "kind">) {
  return `/seller/products/new?project=${encodeURIComponent(project.id)}${project.kind === "input" ? "" : `&sample=${project.kind}`}` as Route;
}
