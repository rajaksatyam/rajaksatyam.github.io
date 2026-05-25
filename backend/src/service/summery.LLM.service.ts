import { GoogleGenAI } from "@google/genai"
import { EnvConfig } from "../config/env.config"
import fs from "fs"



const PROMPT = `You are a Video Analysis AI.

ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE A SINGLE RAW JSON OBJECT.
- Do NOT write anything before the opening {
- Do NOT write anything after the closing }
- Do NOT use markdown, backticks, or \`\`\`json fences
- Do NOT add explanations outside the JSON

Use the Google Search tool internally to verify claims, then embed the results inside the JSON fields. Do not output search results separately.

Return this exact structure:
{
  "title": "string with 1 relevant emoji at start",
  "summary": {
    "overview": "2-3 sentence overview",
    "keyPoints": ["point 1", "point 2"]
  },
  "transcription": [
    { "timestamp": "MM:SS", "text": "what was said or shown" }
  ],
  "verification": {
    "factCheckReport": "which claims are confirmed, corrected, or need context",
    "verdict": "accurate | inaccurate | partially accurate"
  },
  "resources": [
    {
      "platform": "source name",
      "url": "full URL",
      "relevance": "one line why this matters"
    }
  ]
}`



// ─── Types ────────────────────────────────────────────────────
// Define the shape of what Gemini returns
// Now your entire app knows exactly what gemini() returns
interface TranscriptionEntry {
  timestamp: string
  text: string
}

export interface GeminiAnalysis {
  title: string
  summary: {
    overview: string
    keyPoints: string[]
  }
  transcription: TranscriptionEntry[]
  verification: {
    factCheckReport: string
    verdict: "accurate" | "inaccurate" | "partially accurate"
  }
  resources: {
    platform: string
    url: string
    relevance: string
  }[]
}

// ─── Setup ────────────────────────────────────────────────────
const GEMINI_KEY = EnvConfig.GEMINI_KEY
const AI = new GoogleGenAI({ apiKey: GEMINI_KEY })

// ─── Find downloaded file ─────────────────────────────────────
const getDownloadedFile = (): string => {
  const files = fs.readdirSync("src/downloads")
  const found = files.find(f => f.startsWith("video"))
  if (!found) throw new Error("No video file found in src/downloads")
  return found
}

// ─── Strip markdown fences if Gemini wraps in ```json ─────────
// Even with instructions, LLMs sometimes add backticks
// This removes them safely
const extractJSON = (raw: string): string => {
  return raw
    .replace(/^```json\s*/i, "") // remove opening ```json
    .replace(/^```\s*/i, "")     // remove opening ```
    .replace(/```\s*$/i, "")     // remove closing ```
    .trim()
}

// ─── Main Function ────────────────────────────────────────────
export const gemini = async (): Promise<GeminiAnalysis> => {
  const downloadedFile = getDownloadedFile()
  const filePath = `src/downloads/${downloadedFile}`

  // ── 1. Upload video ────────────────────────────────────────
  console.log("📤 Uploading video...")
  const uploadVideo = await AI.files.upload({
    file: filePath,
    config: { mimeType: "video/mp4" }, // pick one — not "video/mkv/mp4"
  })
  console.log(`✅ Upload successful: ${uploadVideo.uri}`)

  // ── 2. Wait for processing ─────────────────────────────────
  let fileStatus = await AI.files.get({ name: uploadVideo.name! })

  while (fileStatus.state === "PROCESSING") {
    console.log("⏳ Processing... retrying in 5s")
    await new Promise(resolve => setTimeout(resolve, 5000))
    fileStatus = await AI.files.get({ name: uploadVideo.name! })
  }

  if (fileStatus.state === "FAILED") {
    throw new Error("Video processing failed on Google's servers.")
  }

  console.log("✅ Video ready for analysis")

  // ── 3. Generate content ────────────────────────────────────
  const response = await AI.models.generateContent({
    model: "gemini-2.5-flash",
    config: {
      tools: [{ googleSearch: {} }],

    },
    contents: [
      {
        // ← CORRECT structure: role + parts array
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: uploadVideo.uri!,
              mimeType: uploadVideo.mimeType!,
            },
          },
          {
            text: PROMPT,
          },
        ],
      },
    ],
  })

  // ── 4. Clean up video file ─────────────────────────────────
  fs.rm(filePath, { force: true }, (err) => {
    if (err) console.error("Cleanup failed:", err)
    else console.log("🗑️ Video file cleaned up")
  })

  // ── 5. Parse response as JSON ──────────────────────────────
  const rawText = response.text ?? ""

  try {
    const cleaned = extractJSON(rawText)
    const parsed:GeminiAnalysis = JSON.parse(cleaned)
    return parsed

  } catch {
    // If JSON.parse fails, log the raw response so you can debug
    console.error("Failed to parse Gemini response as JSON:")
    console.error(rawText)
    throw new Error("Gemini returned invalid JSON")
  }
}