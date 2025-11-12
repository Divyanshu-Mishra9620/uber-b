const userModel=require("../models/user.model")

async function createUser({firstname, lastname,email,password})
{
    if(!firstname || !email || !password)
        throw new Error("All Fields are required")

    // we will hash the password befor calling this function
    const user=await userModel.create({
        fullname:{
            firstname,
            lastname,
        },
        email,password,
    })

    return user;
}

module.exports={createUser}