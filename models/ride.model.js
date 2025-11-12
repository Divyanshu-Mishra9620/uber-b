const mongoose=require("mongoose")
const rideSchema=new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"user",
        required:true
    },
    captain:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"captain", // not req because as ride is created and captain accepts it then put here
    },
    pickup:{
        type:String,
        required:true,
    },
    destination:{
        type:String,
        required:true,
    },
    fare:{
        type:Number,
        required:true,
    },
    status:{
        type:String,
        enum:["pending","accepted","completed","cancelled","ongoing"], // pending when created but captain has not accepted, accepted when captain accepts it, completed when ride is completed, cancelled when captain cancels it
        default:"pending"
    },
    duration:{
        type:Number, // in seconds
    },
    distance:{
        type:Number, // in meters
    },
    //below fields are for payment verification
    paymentID:{
        type:String,
    },
    orderId:{
        type:String,
    },
    signature:{
        type:String,
    },

    otp:{ // otp only goes to user and not to captain
        type: String,
        select: false,
        required: true
    }
})

module.exports=mongoose.model("ride",rideSchema)