const captainModel=require("../models/captian.model")

async function createCaptain({firstname, lastname,email,password,color,plate,capacity,vehicleType})
{
   if(!firstname || !email || !password || !color || !plate || !capacity || !vehicleType)
       throw new Error("All Fields are required")

    // we will hash the password before calling this function
    const captain=await captainModel.create({
        fullname:{
            firstname,
            lastname,
        },
        email,
        password,
        vehicle:{
            color,
            plate,
            capacity,
            vehicleType,
        },
    })

    return captain;
}

module.exports={createCaptain}