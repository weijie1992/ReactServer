const express = require("express"); //express light weight server
const morgan = require("morgan"); //to check http request status code
const bodyParser = require("body-parser");//for JSON body
const cors = require("cors");//Cross origin request
const fs = require("fs");
const {userAuthCheck} = require("./middlewares/userAuthCheck");
require("dotenv").config({
    path:"./.env"
}); //Environment variables

const connectDB = require("./connectDB"); //init mongo db
connectDB();

const app = express(); //init app from express

app.use(bodyParser.json());

//setup only for Dev, cors and morgan
if(process.env.NODE_ENV==="DEV") {
    app.use(cors({
        origin:process.env.CLIENT_URL
    }));
    app.use(morgan("dev"));
}

//test route
app.get("/",userAuthCheck,(req,res) => {
    res.send({data:"test route"})
});

//App.Router
// const authRouter = require("./routes/auth.route");
// app.use("/api/",authRouter);
fs.readdirSync("./routes").map((route)=>{
    return app.use("/api", require("./routes/"+route));
});

//Error handler
app.use((req,res,next) => {
    res.status(404).json({
        success:false,
        message:"page not found"
    })
});


const PORT = process.env.PORT;

app.listen(PORT,()=> {
    console.log(`Express Server is up and listening on ${PORT}`);
})
