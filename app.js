const dotenv=require("dotenv")
dotenv.config()
const cors=require("cors")
const express=require("express")
const {connectToDb}=require("./db/db")
const userRoute=require("./routes/user.routes")
const cookieParser=require("cookie-parser")
const captainRoute=require("./routes/captain.routes")
const mapsRoute=require("./routes/maps.routes")
const rideRoute=require("./routes/ride.routes")

const app=express();
connectToDb();

app.use(cors());
app.use(express.json())
app.use(express.urlencoded({extended: true}))
app.use(cookieParser())


app.use("/users",userRoute);
app.use("/captains",captainRoute)
app.use("/maps",mapsRoute);
app.use("/rides",rideRoute)


app.get("/",(req,res)=>{
    res.send("Hello World")
})

module.exports=app;