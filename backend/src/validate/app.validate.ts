import { z } from "zod";

export const AnalyzeSchema = z.object({
  url: z
    .url("Enter a valid URL")
    .refine(
      (v) =>
        v.includes("youtube.com") ||
        v.includes("youtu.be") ||
        v.includes("instagram.com") ||
        // v.startsWith("http"),
      "Paste a YouTube, Instagram or blog URL"
    ),
});

export type AnalyzeInput = z.infer<typeof AnalyzeSchema>;
