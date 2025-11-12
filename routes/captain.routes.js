const express=require("express")
const router=express.Router();
const {body}=require("express-validator")
const {registerCaptain,loginCaptain,getCaptainProfile,logoutCaptain}=require("../controllers/captain.controller");
const { authCaptain } = require("../middlewares/auth.middleware");

router.post("/register",[
    body("email").isEmail().withMessage("Please enter a valid email address"),
    body("fullname.firstname").isLength({min:6}).withMessage("First name must be at least 6 characters long"),
    body("password").isLength({min:6}).withMessage("Password must be at least 6 characters long"),
    body("vehicle.color").isLength({min:3}).withMessage("Vehicle color must be at least 3 characters long"),
    body("vehicle.plate").isLength({min:3}).withMessage("Vehicle plate must be at least 3 characters long"),
    body("vehicle.capacity").isInt({min:1}).withMessage("Vehicle capacity must be atleast one"),
    body("vehicle.vehicleType").isIn(["car", "bike", "auto"]).withMessage("Vehicle type must be one of the following: car, bike, auto")
],registerCaptain);

router.post("/login", [
    body("email").isEmail().withMessage("Please enter a valid email address"),
    body("password").isLength({min:6}).withMessage("Password must be at least 6 characters long")
], loginCaptain)

// getting captain profile only if captain is logged in
router.get("/profile",authCaptain,getCaptainProfile);

// to logout the captain he must be logged in first
router.get("/logout", authCaptain, logoutCaptain);

module.exports=router;