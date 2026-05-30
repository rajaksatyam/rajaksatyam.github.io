import YTD from "yt-dlp-exec";
import { analyzeVideo, type Analysis } from './summery.LLM.service';
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";

export const download = async (URL: string) => {

  const downloadsDir = path.resolve("src/downloads");
  if (!fs.existsSync(downloadsDir)) {
    fs.mkdirSync(downloadsDir, { recursive: true });
  }

  const jobId = randomUUID();
  const outputTemplate = `src/downloads/${jobId}.%(ext)s`;

  const cookiesPath = path.resolve("cookies-instagram-com.txt");
  const hasCookies = fs.existsSync(cookiesPath);

  const options: any = {
    noWarnings: true,
    preferFreeFormats: true,
    output: outputTemplate,
    addHeader: ['referer:youtube.com', 'user-agent:googlebot'] as any
  };

  if (hasCookies) {
    options.cookies = cookiesPath;
  }

  await YTD(URL, options);
  const summery: Analysis = await analyzeVideo(jobId);
  return summery;
}