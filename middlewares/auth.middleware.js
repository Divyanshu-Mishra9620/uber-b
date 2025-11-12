const userModel=require("../models/user.model")
const captainModel=require("../models/captian.model")
const blacklistTokenModel=require("../models/blacklistToken.model")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")

// creating middleware for checking that user is logged in or not
async function authUser(req,res,next){
    const token=req.cookies.token  || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({message: "unauthorized"})
    }

    const isBlacklisted=await blacklistTokenModel.findOne({token: token});
    
    if(isBlacklisted)
        return res.status(401).json({message: "Unauthorized"})

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        console.log(decoded)
        const user=await userModel.findById(decoded._id)
        console.log("middleware user"+user)

        req.user=user;

        console.log("middleware"+req.user)

        return next();
    }catch (err){
        return res.status(401).json({message : "Unauthorized"})
    }
}

// creating middleware for checking that captain is logged in or not
async function authCaptain(req,res,next){
    const token=req.cookies.token || req.headers.authorization?.split(" ")[1];

    if(!token){
        return res.status(401).json({message: "unauthorized"})
    }

    const isBlacklisted=await blacklistTokenModel.findOne({token: token});
    
    if(isBlacklisted)
        return res.status(401).json({message: "Unauthorized"})

    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET)
        const captain=await captainModel.findById(decoded._id)

        req.captain=captain;

        return next();
    }catch (err){
        return res.status(401).json({message : "Unauthorized"})
    }
}


module.exports={authUser,authCaptain}