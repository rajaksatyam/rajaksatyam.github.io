import YTD from "yt-dlp-exec";
import { gemini, type GeminiAnalysis } from './summery.LLM.service'




export const download = async (URL: string) => {
  const output = await YTD(URL, {
    // dumpSingleJson: false,
    cookies: "./../../cookies-instagram-com.txt",
    noWarnings: true,
    preferFreeFormats: true,
    output: "src/downloads/video.%(ext)s",
    addHeader: ['referer:youtube.com', 'user-agent:googlebot'] as any
  });
  const summery: GeminiAnalysis = await gemini();
  return summery;
}