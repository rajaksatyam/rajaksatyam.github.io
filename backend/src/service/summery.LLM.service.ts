
// import { GoogleGenAI } from "@google/genai"
// import { EnvConfig } from "../config/env.config.js"
// import { logger } from "../utility/logger.utility.js"

// const PROMPT = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the content at the provided URL.

// STEP 1 — Use the Google Search tool to:
// - Search for the exact URL to find metadata, titles, descriptions
// - Search for the video/post title + "transcript" or "full transcript"
// - Search for the video/post title + "summary" or "explained"
// - Search for any fact-checking articles related to the claims made
// - Collect as much detail as possible before composing your response

// STEP 2 — Compose your response.

// ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE A SINGLE RAW VALID JSON OBJECT.
// - Do NOT write anything before the opening {
// - Do NOT write anything after the closing }
// - Do NOT use markdown, backticks, or \`\`\`json fences
// - Do NOT add explanations outside the JSON
// - CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.

// Return this exact structure:
// {
//   "title": "string with 1 relevant emoji at start — use the actual video/post title",
//   "source": {
//     "url": "the original URL provided",
//     "platform": "detected platform (e.g. Instagram, YouTube, Twitter, Reddit, Article)",
//     "contentType": "video | image | article | post | other",
//     "author": "channel name, username, or author if found",
//     "publishedAt": "publication date if found, else empty string"
//   },
//   "summary": {
//     "overview": "3-5 sentence detailed overview covering the main topic, context, and conclusion of the content",
//     "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3", "detailed point 4", "detailed point 5"]
//   },
//   "transcription": [
//     {
//       "timestamp": "MM:SS",
//       "text": "Full verbatim or near-verbatim transcript segment. Include as many entries as needed to cover the ENTIRE content — do not truncate or summarize here. For non-video content use 00:00 for all entries."
//     }
//   ],
//   "verification": {
//     "claims": [
//       {
//         "claim": "specific claim made in the content",
//         "verdict": "true | false | misleading | unverified",
//         "explanation": "evidence or reasoning from search results"
//       }
//     ],
//     "overallVerdict": "accurate | inaccurate | partially accurate | unverified",
//     "factCheckReport": "comprehensive paragraph summarizing which claims are confirmed, corrected, or need context based on search results"
//   },
//   "resources": [
//     {
//       "platform": "source name",
//       "url": "full URL",
//       "relevance": "one line why this matters"
//     }
//   ]
// }`;


// interface TranscriptionEntry {
//   timestamp: string
//   text: string
// }

// export interface Analysis {
//   title: string
//   source?: {
//     url: string
//     platform: string
//     contentType: string
//     author?: string
//     publishedAt?: string
//   }
//   summary: {
//     overview: string
//     keyPoints: string[]
//   }
//   transcription: TranscriptionEntry[]
//   verification: {
//     claims?: {
//       claim: string
//       verdict: string
//       explanation: string
//     }[]
//     overallVerdict?: string
//     factCheckReport: string
//     verdict?: "accurate" | "inaccurate" | "partially accurate" | "unverified"
//   }
//   resources: {
//     platform: string
//     url: string
//     relevance: string
//   }[]
// }


// const extractJSON = (raw: string): string => {
//   return raw
//     .replace(/^```json\s*/i, "")
//     .replace(/^```\s*/i, "")
//     .replace(/```\s*$/i, "")
//     .trim()
// }

// const geminiAI = new GoogleGenAI({ apiKey: EnvConfig.GEMINI_KEY })




// const analyzeWithGemini = async (cdnURL: string): Promise<Analysis> => {

//   const response = await geminiAI.models.generateContent({
//     model: "gemini-2.5-flash-lite",
//     config: {
//       tools: [{ googleSearch: {} }],
//     },
//     contents: `This is vido cdnURL: [${cdnURL}] ${PROMPT}`,
//   })

//   const rawText = response.text ?? ""
//   const cleaned = extractJSON(rawText)
//   const parsed: Analysis = JSON.parse(cleaned)
//   return parsed
// }




// export const analyzeVideo = async (cdnURL: string): Promise<Analysis> => {


//   try {
//     const result = await analyzeWithGemini(cdnURL)
//     logger.info("Analysis completed via Gemini")
//     return result
//   } catch (geminiError) {
//     logger.warn(geminiError, "Gemini error:")
//     throw new Error(
//       "LLM providers failed. Please check your API keys and video file."
//     )
//   }

// }

// import { GoogleGenAI } from "@google/genai";

// const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// export const analyzeVideo = async (cdnURL:string) => {
//   try {
//     const promptText = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the provided video.

// STEP 1 — Watch the video fully to extract metadata, visual context, and audio cues.
// STEP 2 — Transcribe the spoken audio verbatim with accurate timestamps.
// STEP 3 — Compose your response based strictly on the video content.

// ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE CONTAINED WITHIN A MARKDOWN JSON CODE BLOCK.
// - You MUST wrap your entire response inside \`\`\`json and \`\`\` fences.
// - Do NOT write any conversational text or explanations outside the code block.
// - Ensure the contents are a single, fully valid JSON object matching the requested schema.
// - CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.

// Return this exact structure:
// {
//   "title": "string with 1 relevant emoji at start — use the actual video title or a highly descriptive one if missing",
//   "source": {
//     "url": "the original URL provided",
//     "platform": "Instagram",
//     "contentType": "video",
//     "author": "channel name or username if visible in video, else unknown",
//     "publishedAt": ""
//   },
//   "summary": {
//     "overview": "3-5 sentence detailed overview covering the main topic, context, and conclusion of the video",
//     "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3"]
//   },
//   "transcription": [
//     {
//       "timestamp": "MM:SS",
//       "text": "Full verbatim or near-verbatim transcript segment."
//     }
//   ],
//   "verification": {
//     "claims": [],
//     "overallVerdict": "verified",
//     "factCheckReport": "Not applicable for this short media asset."
//   },
//   "resources": []
// }`;

//     const response = await ai.models.generateContent({
//       model: "gemini-2.5-flash", // Use a multimodal model that handles video natively
//       contents: [
//         {
//           fileData: {
//             fileUri: cdnURL,
//             mimeType: "video/mp4"
//           }
//         },
//         {
//           text: promptText
//         }
//       ]
//     });

//     const rawText = response.text;

//     // Extract the JSON block safely from the markdown wrapper
//     const jsonMatch = rawText.match(/```json([\s\S]*?)```/);
//     const cleanJsonText = jsonMatch ? jsonMatch[1].trim() : rawText.trim();

//     return JSON.parse(cleanJsonText);

//   } catch (error) {
//     console.error("Gemini processing failed:", error);
//     throw error;
//   }
// }


















// import { GoogleGenAI } from "@google/genai";
// import { EnvConfig } from "../config/env.config.js";
// import { AppError } from "../errors/AppErrors.errors.js";


// export interface Analysis {
//   title: string;
//   source: {
//     url: string;
//     platform: string;
//     contentType: string;
//     author: string;
//     publishedAt: string;
//   };
//   summary: {
//     overview: string;
//     keyPoints: string[];
//   };
//   transcription: Array<{
//     timestamp: string;
//     text: string;
//   }>;
//   verification: {
//     claims: Array<{
//       claim: string;
//       verdict: string;
//       explanation: string;
//     }>;
//     overallVerdict: string;
//     factCheckReport: string;
//   };
//   resources: Array<{
//     platform: string;
//     url: string;
//     relevance: string;
//   }>;
// }


// const apiKey = EnvConfig.GEMINI_KEY;
// if (!apiKey) {
//   throw new AppError("CRITICAL: GEMINI_API_KEY environment variable is missing.",404);
// }

// const ai = new GoogleGenAI({ apiKey });


// export async function analyzeVideo(cdnURL: string): Promise<Analysis> {
//   const promptText = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the provided video.

// STEP 1 — Watch the video fully to extract metadata, visual context, and audio cues.
// STEP 2 — Transcribe the spoken audio verbatim with accurate timestamps.
// STEP 3 — Compose your response based strictly on the video content.

// ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE CONTAINED WITHIN A MARKDOWN JSON CODE BLOCK.
// - You MUST wrap your entire response inside \`\`\`json and \`\`\` fences.
// - Do NOT write any conversational text or explanations outside the code block.
// - Ensure the contents are a single, fully valid JSON object matching the requested schema.
// - CRITICAL: All internal double quotes (") inside your string values MUST be escaped as \\" to ensure valid JSON syntax. Newlines must be escaped as \\n.

// Return this exact structure:
// {
//   "title": "string with 1 relevant emoji at start — use the actual video title or a highly descriptive one if missing",
//   "source": {
//     "url": "the original URL provided",
//     "platform": "Instagram",
//     "contentType": "video",
//     "author": "channel name or username if visible in video, else unknown",
//     "publishedAt": ""
//   },
//   "summary": {
//     "overview": "3-5 sentence detailed overview covering the main topic, context, and conclusion of the video",
//     "keyPoints": ["detailed point 1", "detailed point 2", "detailed point 3"]
//   },
//   "transcription": [
//     {
//       "timestamp": "MM:SS",
//       "text": "Full verbatim or near-verbatim transcript segment."
//     }
//   ],
//   "verification": {
//     "claims": [],
//     "overallVerdict": "verified",
//     "factCheckReport": "Not applicable for this short media asset."
//   },
//   "resources": []
// }`;

//   const response = await ai.models.generateContent({
//     model: "gemini-2.5-flash",
//     contents: [
//       { fileData: { fileUri: cdnURL, mimeType: "video/mp4" } },
//       { text: promptText }
//     ]
//   });

 
//   const rawText: string = response.text ?? ""; 
  
//   if (!rawText) {
//     throw new Error("LLM provider returned an empty or undefined response text.");
//   }

 
//   const jsonMatch = rawText.match(/```json([\s\S]*?)```/);
//   const cleanJsonText = jsonMatch && jsonMatch[1] ? jsonMatch[1].trim() : rawText.trim();

//   return JSON.parse(cleanJsonText) as Analysis;
// }






import { GoogleGenAI } from "@google/genai";
import { EnvConfig } from "../config/env.config.js";

export interface Analysis {
  title: string;
  source: { url: string; platform: string; contentType: string; author: string; publishedAt: string; };
  summary: { overview: string; keyPoints: string[]; };
  transcription: Array<{ timestamp: string; text: string; }>;
  verification: {
    claims: Array<{
      claim: string;
      verdict: "true" | "false" | "misleading" | "unverified";
      explanation: string;
    }>;
    overallVerdict: string;
    factCheckReport: string;
  };
  resources: Array<{
    title: string;
    url: string;
    relevance: string;
  }>;
}

const apiKey = EnvConfig.GEMINI_KEY;
if (!apiKey) {
  throw new Error("CRITICAL: GEMINI_API_KEY environment variable is missing.");
}
const ai = new GoogleGenAI({ apiKey });

export async function analyzeVideo(cdnURL: string): Promise<Analysis> {
  // CRITICAL: We rewrite the prompt to FORBADE the model from skipping fact checking.
  const promptText = `You are a Web Content & Video Analysis AI. Your job is to deeply analyze the provided video.

STEP 1 — Watch the video fully to extract metadata, visual context, and audio cues.
STEP 2 — Transcribe the spoken audio verbatim with accurate timestamps.
STEP 3 — Extract and critically analyze any claims made, including pseudo-scientific assertions, supernatural claims, or factual statements about individuals/celebrities.

CRITICAL FACT-CHECKING RULES:
- Do NOT skip fact-checking. Treat pseudo-scientific claims (like palmistry changing a future path) or factual claims about celebrities using palmistry as testable assertions.
- Use your Google Search tool to find consensus articles, scientific refutations, or relevant reports.
- Populate the "verification.claims" array with at least 1-2 distinct claims found in the transcript.
- Populate the "resources" array with real, active URLs found via Google Search that offer context, scientific consensus, or debunking reports regarding the claims. Never leave "resources" empty if unverified or false claims are present.

ABSOLUTE RULE — YOUR ENTIRE RESPONSE MUST BE CONTAINED WITHIN A MARKDOWN JSON CODE BLOCK FENCED WITH \`\`\`json AND \`\`\`.

Return this exact structure:
{
  "title": "string with 1 relevant emoji at start",
  "source": { "url": "${cdnURL}", "platform": "Instagram", "contentType": "video", "author": "unknown", "publishedAt": "" },
  "summary": { "overview": "3-5 sentence detailed overview", "keyPoints": [] },
  "transcription": [{ "timestamp": "MM:SS", "text": "verbatim text" }],
  "verification": {
    "claims": [
      {
        "claim": "The specific statement made in the video",
        "verdict": "false", 
        "explanation": "Detailed scientific or factual reason explaining why this claim is false, misleading, or unverified."
      }
    ],
    "overallVerdict": "A single word summarizing the video veracity (e.g., Pseudoscience, Misleading, True)",
    "factCheckReport": "A concise analytical summary of your verification findings."
  },
  "resources": [
    {
      "title": "Title of the supporting article/resource found via search",
      "url": "Full HTTP URL path to the reference article",
      "relevance": "Why this link helps the user understand the facts."
    }
  ]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      { fileData: { fileUri: cdnURL, mimeType: "video/mp4" } },
      { text: promptText }
    ],
    // FIX: This enables the live Google Search grounding engine 
    // so Gemini can dynamically fetch real verification resource links.
    config: {
      tools: [{ googleSearch: {} }]
    }
  });

  const rawText: string = response.text ?? ""; 
  if (!rawText) {
    throw new Error("LLM provider returned an empty or undefined response text.");
  }

  const jsonMatch = rawText.match(/```json([\s\S]*?)```/);
  const cleanJsonText = jsonMatch && jsonMatch[1] ? jsonMatch[1].trim() : rawText.trim();

  return JSON.parse(cleanJsonText) as Analysis;
}




