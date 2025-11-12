const express=require("express")
const router=express.Router();
const {body}=require("express-validator")
const {registerUser,loginUser,getUserProfile,logoutUser}=require("../controllers/user.controller")
const {authUser}=require("../middlewares/auth.middleware")

router.post("/register",[
    body("email").isEmail().withMessage("Invalid Email"),
    body("fullname.firstname").isLength({min: 3}).withMessage("First name must be atleast 3 character long"),
    body("password").isLength({min: 6}).withMessage("Password must be atleast 6 char long")
],
registerUser,
)

router.post("/login",[
    body("email").isEmail().withMessage("Invalid Email"),
    body("password").isLength({min: 6}).withMessage("Password must be atleast 6 char long")
],
loginUser )

// getting user profile only if user is logged in
router.get("/profile",authUser,getUserProfile)

// to logout the user he must be logged in first
router.get("/logout",authUser,logoutUser)

module.exports=router