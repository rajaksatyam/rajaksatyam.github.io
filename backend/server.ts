
import app from "./src/app.js"
import connectToDB from "./src/config/db.config.js"
import { EnvConfig } from "./src/config/env.config.js"
import { logger } from "./src/utility/logger.utility.js"
connectToDB()

app.listen(EnvConfig.PORT,()=>{
    logger.info(`Server is running on port ${EnvConfig.PORT}`)
})

