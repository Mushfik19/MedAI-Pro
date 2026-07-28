export const predictionKeys = {
  all: ["predictions"] as const,
  assessment: (id: string) => [...predictionKeys.all, "assessment", id] as const,
  symptoms: (search: string) => ["catalog", "symptoms", search] as const,
  history: (query: string, status: string) =>
    [...predictionKeys.all, "history", query, status] as const,
}
