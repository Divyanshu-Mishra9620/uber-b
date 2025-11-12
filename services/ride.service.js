const rideModel = require("../models/ride.model");
const mapService = require("./maps.service");
const crypto = require("crypto");

const getFare = async ({ pickup, destination }) => {
  if (!pickup || !destination) {
    throw new Error("Pickup and destination are required to calculate fare");
  }

  try {
    console.log("🚗 Getting distance and time for fare calculation...");
    const distanceTime = await mapService.getDistanceAndTime(
      pickup,
      destination
    );

    console.log("✅ Distance & Time received:", distanceTime);

    const baseFare = {
      auto: 30,
      car: 50,
      moto: 20,
    };

    const perKmRate = {
      auto: 10,
      car: 15,
      moto: 8,
    };

    const perMinuteRate = {
      auto: 2,
      car: 3,
      moto: 1.5,
    };

    const fare = {
      auto: Math.round(
        baseFare.auto +
          distanceTime.distance_km * perKmRate.auto +
          distanceTime.duration_min * perMinuteRate.auto
      ),
      car: Math.round(
        baseFare.car +
          distanceTime.distance_km * perKmRate.car +
          distanceTime.duration_min * perMinuteRate.car
      ),
      moto: Math.round(
        baseFare.moto +
          distanceTime.distance_km * perKmRate.moto +
          distanceTime.duration_min * perMinuteRate.moto
      ),
    };

    console.log("💰 Calculated fares:", fare);
    return fare;
  } catch (error) {
    console.error("❌ Error in getFare:", error.message);
    throw new Error(`Failed to calculate fare: ${error.message}`);
  }
};

const getOtp = (num) => {
  function generateOtp(num) {
    const otp = crypto
      .randomInt(Math.pow(10, num - 1), Math.pow(10, num))
      .toString();
    return otp;
  }
  return generateOtp(num);
};

const createRide = async ({ user, pickup, destination, vehicleType }) => {
  if (!user || !pickup || !destination || !vehicleType) {
    throw new Error("All fields are required to create a ride");
  }

  try {
    console.log("📝 Creating ride with:", { pickup, destination, vehicleType });

    const fare = await getFare({ pickup, destination });
    console.log("✅ Fare obtained:", fare);

    const newRide = await rideModel.create({
      userId: user,
      pickup,
      destination,
      vehicleType,
      otp: getOtp(6),
      fare: fare[vehicleType],
    });

    console.log("✅ Ride created with ID:", newRide._id);
    return newRide;
  } catch (error) {
    console.error("❌ Error in createRide:", error.message);
    throw new Error(`Failed to create ride: ${error.message}`);
  }
};

const confirmRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "accepted",
      captain: captain._id,
    }
  );

  const ride = await rideModel
    .findOne({
      _id: rideId,
    })
    .populate("userId")
    .populate("captain")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  console.log("ride.service.confirmRide");
  console.log(ride);

  return ride;
};

const startRide = async ({ rideId, otp, captain }) => {
  if (!rideId || !otp) {
    throw new Error("Ride id and OTP are required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
    })
    .populate("userId")
    .populate("captain")
    .select("+otp");

  console.log("\n🔍 Ride details:");
  console.log("  - Ride ID:", ride?._id);
  console.log("  - Status:", ride?.status);
  console.log("  - Stored OTP:", ride?.otp);
  console.log("  - Provided OTP:", otp);
  console.log("  - OTP Match:", ride?.otp === otp);

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "accepted") {
    throw new Error(
      `Ride status is "${ride.status}", expected "accepted". Cannot start ride that hasn't been accepted by a captain.`
    );
  }

  if (ride.otp !== otp) {
    throw new Error(`Invalid OTP. Expected: ${ride.otp}, Got: ${otp}`);
  }

  // Update ride status to ongoing
  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "ongoing",
    }
  );

  console.log("✅ Ride status updated to 'ongoing'");

  return ride;
};

const endRide = async ({ rideId, captain }) => {
  if (!rideId) {
    throw new Error("Ride id is required");
  }

  const ride = await rideModel
    .findOne({
      _id: rideId,
      captain: captain._id,
    })
    .populate("userId")
    .populate("captain")
    .select("+otp");

  if (!ride) {
    throw new Error("Ride not found");
  }

  if (ride.status !== "ongoing") {
    throw new Error("Ride not ongoing");
  }

  await rideModel.findOneAndUpdate(
    {
      _id: rideId,
    },
    {
      status: "completed",
    }
  );

  return ride;
};

module.exports = { createRide, getFare, confirmRide, startRide, endRide };
