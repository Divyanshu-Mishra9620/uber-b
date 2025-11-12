const rideModel=require("../models/ride.model")
const mapService=require("./maps.service")
const crypto = require('crypto');

const getFare=async({pickup,destination})=>{


    if(!pickup || !destination){
        throw new Error("Pickup and destination are required to calculate fare")
    }

    const distanceTime=await mapService.getDistanceAndTime(pickup,destination);

    const baseFare = {
        auto: 30,
        car: 50,
        moto: 20
    };

    const perKmRate = {
        auto: 10,
        car: 15,
        moto: 8
    };

    const perMinuteRate = {
        auto: 2,
        car: 3,
        moto: 1.5
    };

    const fare = {
        auto: Math.round(baseFare.auto + ((distanceTime.distance_km) * perKmRate.auto) + ((distanceTime.duration_min) * perMinuteRate.auto)),
        car: Math.round(baseFare.car + ((distanceTime.distance_km) * perKmRate.car) + ((distanceTime.duration_min) * perMinuteRate.car)),
        moto: Math.round(baseFare.moto + ((distanceTime.distance_km) * perKmRate.moto) + ((distanceTime.duration_min) * perMinuteRate.moto))
    };

    return fare;
}

const getOtp=(num)=>{
    function generateOtp(num) {
        const otp = crypto.randomInt(Math.pow(10, num - 1), Math.pow(10, num)).toString();
        return otp;
    }
    return generateOtp(num);
}

const createRide=async({user,pickup,destination,vehicleType})=>{
    if(!user || !pickup || !destination || !vehicleType){
        throw new Error("All fields are required to create a ride")
    }

    const fare=await getFare({pickup,destination});

    const newRide=await rideModel.create({
        userId:user,
        pickup,
        destination,
        vehicleType,
        otp: getOtp(6),
        fare: fare[vehicleType]
    })

    return newRide;
}

const confirmRide=async({rideId,captain})=>{
     if (!rideId) {
        throw new Error('Ride id is required');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'accepted',
        captain: captain._id
    })

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('userId').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    console.log("ride.service.confirmRide")
    console.log(ride)

    return ride;
}

const startRide=async({rideId,otp,captain})=>{
    if (!rideId || !otp) {
        throw new Error('Ride id and OTP are required');
    }

    const ride = await rideModel.findOne({
        _id: rideId
    }).populate('userId').populate('captain').select('+otp');

    console.log("ride.service.startRide")
    console.log(ride)

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'accepted') {
        throw new Error('Ride not accepted');
    }

    if (ride.otp !== otp) {
        throw new Error('Invalid OTP');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'ongoing'
    })

    return ride;
}

const endRide=async({rideId,captain})=>{
    if (!rideId) {
        throw new Error('Ride id is required');
    }

    const ride = await rideModel.findOne({
        _id: rideId,
        captain: captain._id
    }).populate('userId').populate('captain').select('+otp');

    if (!ride) {
        throw new Error('Ride not found');
    }

    if (ride.status !== 'ongoing') {
        throw new Error('Ride not ongoing');
    }

    await rideModel.findOneAndUpdate({
        _id: rideId
    }, {
        status: 'completed'
    })

    return ride;
}


module.exports={createRide,getFare,confirmRide,startRide,endRide}