
import { GoogleGenAI } from "@google/genai"
import { EnvConfig } from "../config/env.config.js"
import { logger } from "../utility/logger.utility.js"

const PROMPT = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the content at the provided URL.

STEP 1 — Use the Google Search tool to:
- Search for the exact URL to find metadata, titles, descriptions
- Search for the video/post title + "transcript" or "full transcript"
- Search for the video/post title + "summary" or "explained"
- Search for any fact-checking articles related to the claims made
- Collect as much detail as possible before composing your response

STEP 2 — Compose your response.

ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE A SINGLE RAW VALID JSON OBJECT.
- Do NOT write anything before the opening {
- Do NOT write anything after the closing }
- Do NOT use markdown, backticks, or \`\`\`json fences
- Do NOT add explanations outside the JSON
- CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.

Return this exact structure:
{
  "title": "string with 1 relevant emoji at start — use the actual video/post title",
  "source": {
    "url": "the original URL provided",
    "platform": "detected platform (e.g. Instagram, YouTube, Twitter, Reddit, Article)",
    "contentType": "video | image | article | post | other",
    "author": "channel name, username, or author if found",
    "publishedAt": "publication date if found, else empty string"
  },
  "summary": {
    "overview": "3-5 sentence detailed overview covering the main topic, context, and conclusion of the content",
    "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3", "detailed point 4", "detailed point 5"]
  },
  "transcription": [
    {
      "timestamp": "MM:SS",
      "text": "Full verbatim or near-verbatim transcript segment. Include as many entries as needed to cover the ENTIRE content — do not truncate or summarize here. For non-video content use 00:00 for all entries."
    }
  ],
  "verification": {
    "claims": [
      {
        "claim": "specific claim made in the content",
        "verdict": "true | false | misleading | unverified",
        "explanation": "evidence or reasoning from search results"
      }
    ],
    "overallVerdict": "accurate | inaccurate | partially accurate | unverified",
    "factCheckReport": "comprehensive paragraph summarizing which claims are confirmed, corrected, or need context based on search results"
  },
  "resources": [
    {
      "platform": "source name",
      "url": "full URL",
      "relevance": "one line why this matters"
    }
  ]
}`;


interface TranscriptionEntry {
  timestamp: string
  text: string
}

export interface Analysis {
  title: string
  source?: {
    url: string
    platform: string
    contentType: string
    author?: string
    publishedAt?: string
  }
  summary: {
    overview: string
    keyPoints: string[]
  }
  transcription: TranscriptionEntry[]
  verification: {
    claims?: {
      claim: string
      verdict: string
      explanation: string
    }[]
    overallVerdict?: string
    factCheckReport: string
    verdict?: "accurate" | "inaccurate" | "partially accurate" | "unverified"
  }
  resources: {
    platform: string
    url: string
    relevance: string
  }[]
}


const extractJSON = (raw: string): string => {
  return raw
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim()
}

const geminiAI = new GoogleGenAI({ apiKey: EnvConfig.GEMINI_KEY })




const analyzeWithGemini = async (cdnURL: string): Promise<Analysis> => {

  const response = await geminiAI.models.generateContent({
    model: "gemini-2.5-flash-lite",
    config: {
      tools: [{ googleSearch: {} }],
    },
    contents: `cdnURL: [${cdnURL}] ${PROMPT}`,
  })

  const rawText = response.text ?? ""
  const cleaned = extractJSON(rawText)
  const parsed: Analysis = JSON.parse(cleaned)
  return parsed
}




export const analyzeVideo = async (cdnURL: string): Promise<Analysis> => {


  try {
    const result = await analyzeWithGemini(cdnURL)
    logger.info("Analysis completed via Gemini")
    return result
  } catch (geminiError) {
    logger.warn(geminiError, "Gemini error:")
    throw new Error(
      "LLM providers failed. Please check your API keys and video file."
    )
  }

}





