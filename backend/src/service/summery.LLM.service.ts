import { GoogleGenAI } from "@google/genai"
import { EnvConfig } from "../config/env.config"
import fs from "fs"
// import OpenAI from "openai"
import { logger } from "../utility/logger.utility"

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


interface TranscriptionEntry {
  timestamp: string
  text: string
}

export interface Analysis {
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


const geminiAI = new GoogleGenAI({ apiKey: EnvConfig.GEMINI_KEY })
// const openAI = new OpenAI({ apiKey: EnvConfig.OPENAI_KEY })


const getDownloadedFile = (jobId: string): string => {
  const files = fs.readdirSync("src/downloads")
  const found = files.find(f => f.startsWith(jobId))
  if (!found) throw new Error("No video file found in src/downloads")
  return found
}

const extractJSON = (raw: string): string => {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

const getFileExtInfo = (jobId: string): [string, string] => {
  const downloadedFile = getDownloadedFile(jobId)
  const filePath = `src/downloads/${downloadedFile}`
  const ext = downloadedFile.split(".").pop()?.toLowerCase()

  const mimeMap: Record<string, string> = {
    webm: "video/webm",
    mkv: "video/x-matroska",
    mov: "video/quicktime",
    avi: "video/x-msvideo",
  }

  const mimeType = mimeMap[ext ?? ""] ?? "video/mp4"
  return [mimeType, filePath]
}


const analyzeWithGemini = async (jobId: string): Promise<Analysis> => {
  const [mimeType, filePath] = getFileExtInfo(jobId)

 logger.debug("Uploading video...")
  const uploadVideo = await geminiAI.files.upload({
    file: filePath,
    config: { mimeType },
  })
  logger.debug(`Upload successful: ${uploadVideo.uri}`)

  let fileStatus = await geminiAI.files.get({ name: uploadVideo.name! })
  while (fileStatus.state === "PROCESSING") {
    logger.debug("Processing... retrying in 5s")
    await new Promise(resolve => setTimeout(resolve, 5000))
    fileStatus = await geminiAI.files.get({ name: uploadVideo.name! })
  }

  if (fileStatus.state === "FAILED") {
    throw new Error("Video processing failed on Google's servers.")
  }

  logger.debug("Video ready for analysis")

  const response = await geminiAI.models.generateContent({
    model: "gemini-2.5-flash-lite",
    config: {
      tools: [{ googleSearch: {} }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            fileData: {
              fileUri: uploadVideo.uri!,
              mimeType: uploadVideo.mimeType!,
            },
          },
          { text: PROMPT },
        ],
      },
    ],
  })

  const rawText = response.text ?? ""
  const cleaned = extractJSON(rawText)
  const parsed: Analysis = JSON.parse(cleaned)
  return parsed
}




export const analyzeVideo = async (jobId: string): Promise<Analysis> => {
  const [, filePath] = getFileExtInfo(jobId)

  try {
    const result = await analyzeWithGemini(jobId)
    logger.info("Analysis completed via Gemini")
    return result
  } catch (geminiError) {
    logger.warn("Gemini failed, switching to OpenAI fallback...")
    logger.warn(geminiError,"Gemini error:")
      throw new Error(
        "All LLM providers failed. Please check your API keys and video file."
      )
    }
   finally {

    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.rm(filePath, { force: true })
        logger.info("Video file cleaned up")
      }
    } catch (cleanupErr) {
      logger.error(cleanupErr,"Cleanup failed:")
    }
  }
}