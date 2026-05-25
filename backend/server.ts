
import app from "./src/app.js"
import connectToDB from "./src/config/db.config.js"
import { EnvConfig } from "./src/config/env.config.js"
connectToDB()

app.listen(EnvConfig.PORT,()=>{
    console.log(`Server is running on port ${EnvConfig.PORT}`)
})

