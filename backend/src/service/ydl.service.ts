import YTD from "yt-dlp-exec";
import { analyzeVideo, type Analysis} from './summery.LLM.service.js';

import { logger } from "../utility/logger.utility.js";
import { AppError } from "../errors/AppErrors.errors.js";



export const download = async (URL: string) => {



  const options: any = {
    preferFreeFormats: true,
    dumpSingleJson: true,   // just metadata, no download
    noWarnings: true,
    cookies: '/app/cookies.txt',
    addHeader: ['referer:instagram.com',
      'user-agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'] as any
  };


  const info = await YTD(URL, options);
  const cdnURL = info.url ?? info.formats?.at(-1)?.url
  if (!cdnURL) throw new AppError("Could not extract a media URL from the provided link.", 422);
  const summery:Analysis = await analyzeVideo(cdnURL);

  return summery;
}






