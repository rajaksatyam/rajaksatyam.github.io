import YTD from "yt-dlp-exec";
import { analyzeVideo,} from './summery.LLM.service.js';

import { logger } from "../utility/logger.utility.js";



export const download = async (URL: string) => {

  // const downloadsDir = path.resolve("src/downloads");
  // if (!fs.existsSync(downloadsDir)) {
  //   fs.mkdirSync(downloadsDir, { recursive: true });
  // }

  // const jobId = randomUUID();
  // const outputTemplate = `src/downloads/${jobId}.%(ext)s`;

  // const cookiesPath = path.resolve("cookies-instagram-com.txt");
  // const hasCookies = fs.existsSync(cookiesPath);

  // const options: any = {
  //   noWarnings: true,
  //   preferFreeFormats: true,
  //   output: outputTemplate,
  //   addHeader: ['referer:youtube.com', 'user-agent:googlebot'] as any
  // };

  const options: any = {
    preferFreeFormats: true,
    dumpSingleJson: true,   // just metadata, no download
    noWarnings: true,
    cookies: '/app/cookies.txt',
    addHeader: ['referer:instagram.com',
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'] as any
  };

  // if (hasCookies) {
  //   options.cookies = cookiesPath;
  // }

  const info = await YTD(URL, options);
  const cdnURL = info.url ?? info.formats?.at(-1)?.url
  logger.info(cdnURL)
  const summery = await analyzeVideo(cdnURL);

  return summery;
}






