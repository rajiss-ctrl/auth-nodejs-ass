const express = require('express');
require("dotenv").config()



const app = express();
app.use(express.json());
app.use(express.urlencoded({extended: false}));
const mongoose = require("mongoose");
const authRouter = require('./route/authRoute');




mongoose.connect(process.env.MONGODB_CONNECTION_STRING)
.then(()=>{
    console.log("mongodb connected successfully")
}).catch((error)=>{
    console.log("Error:", error)
})

app.use("/auth", authRouter)


const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
