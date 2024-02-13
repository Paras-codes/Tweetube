import {config} from  "dotenv"
import database from "./db/db.js";
 
config();

database()
.then(()=>{
    app.listen(process.env.PORT||8000,()=>{
        console.log(`Server is listening on PORT ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Mongo Db  connection failed",err);
})
