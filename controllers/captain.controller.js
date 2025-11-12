const captainModel = require("../models/captian.model");
const blacklistTokenModel = require("../models/blacklistToken.model");
const {createCaptain} = require("../services/captain.service");
const { validationResult } = require("express-validator");

async function registerCaptain(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        console.log("hello")
        return res.status(400).json({ errors: errors.array() });
    }

    const { fullname, email, password, vehicle } = req.body;

    const isCaptainExists = await captainModel.findOne({email});
    if (isCaptainExists) {
        return res.status(400).json({ message: "Captain with this email already exists" });
    }

    const hashedPassword = await captainModel.hashPassword(password);

    const captain = await createCaptain({
        firstname: fullname.firstname,
        lastname: fullname.lastname,
        email,
        password: hashedPassword,
        color: vehicle.color,
        plate: vehicle.plate,
        capacity: vehicle.capacity,
        vehicleType: vehicle.vehicleType
    });

    const token = captain.generateAuthToken();

    console.log("hi")

    res.status(201).json({ token, captain });
}

async function loginCaptain(req, res, next) {
    const errors=validationResult(req);
    if(!errors.isEmpty()){
        return res.status(400).json({errors: errors.array()});
    }

    const {email,password}=req.body;
    const captain=await captainModel.findOne({email}).select("+password")
    if(!captain){
        return res.status(401).json({message: 'Invalid email or password'});
    }

    const isMatch= await captain.comparePassword(password);

    if(!isMatch){
        return res.status(401).json({message: 'Invalid email or password'});
    }

    const token = captain.generateAuthToken();
    res.cookie("token", token);

    res.status(201).json({ token, captain });
}

// this will only be called if captain is logged in and if yes then it has captain details in req.captain
async function getCaptainProfile(req, res, next) {
    res.status(200).json({ captain: req.captain });
}

// this will only be called if captain is logged in and if yes then it will find token and clear cookie and put token in blacklisted model
async function logoutCaptain(req, res, next) {
    const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
    res.clearCookie("token");

    await blacklistTokenModel.create({ token });

    res.status(200).json({ message: "Logged out successfully" });
}

module.exports = {
    registerCaptain,
    loginCaptain,
    getCaptainProfile,
    logoutCaptain,
}