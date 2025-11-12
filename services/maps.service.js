const axios = require("axios");
const captainModel = require("../models/captian.model");

const getAddressCoordinate = async (address) => {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "UberCloneApp/1.0 (agarwaldevang664@gmail.com)", // Required by Nominatim
      },
    });

    const data = response.data;

    if (!data || data.length === 0) {
      return { error: "Address not found" };
    }

    // Extract latitude & longitude
    return {
      ltd: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("Error in getAddressCoordinate:", error.message);
    return { error: "Failed to fetch coordinates" };
  }
};

const getDistanceAndTime = async (originAddress, destinationAddress) => {
  try {
    if (!originAddress || !destinationAddress) {
      throw new Error("Origin and destination are required");
    }

    const origin = await getAddressCoordinate(originAddress);
    const destination = await getAddressCoordinate(destinationAddress);

    if (!origin || !destination) {
      return { error: "Could not fetch coordinates for one or both addresses" };
    }
    // origin & destination should be objects: { latitude, longitude }
    const url = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.ltd};${destination.lng},${destination.ltd}?overview=false`;

    const response = await axios.get(url);
    const data = response.data;

    if (!data.routes || data.routes.length === 0) {
      return { error: "No route found" };
    }

    const route = data.routes[0];

    return {
      distance_km: (route.distance / 1000).toFixed(2), // meters → km
      duration_min: (route.duration / 60).toFixed(2), // seconds → minutes
    };
  } catch (error) {
    console.error("Error in getDistanceAndTime:", error.message);
    return { error: "Failed to fetch distance and time" };
  }
};

const getAutoCompleteSuggestions = async (input) => {
  try {
    if (!input || input.trim().length === 0) {
      return [];
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      input
    )}&format=json&addressdetails=1&limit=5`;
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "UberCloneApp/1.0 (agarwaldevang664@gmail.com)", // Required by Nominatim
      },
    });

    const data = response.data;
    if (!data || data.length === 0) {
      return { error: "No suggestions found" };
    }
    // Map the results to a simpler format
    return data.map((item) => ({
      display_name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
    }));
  } catch (error) {
    console.error("Error in getAutoCompleteSuggestions:", error.message);
    return [];
  }
};

// const getCaptainsInTheRadius = async (ltd,lng, radiusKm) => {

//   try {
//     // Convert the radius to radians (radius in km / Earth radius in km).
//     const radiusInRadians = radiusKm / 6371;

//     // Use $geoWithin with a $centerSphere query
//     const captains = await captainModel.find({
//       location: {
//         $geoWithin: {
//           $centerSphere: [[lng, lat], radiusInRadians],
//         },
//       },
//     });

//     return captains;
//   } catch (error) {
//     console.error("Error in getCaptainsInTheRadius:", error.message);
//     return [];
//   }
// };

const getCaptainsInTheRadius = async (ltd, lng, radiusKm) => {
  const captains = await captainModel.find({
        location: {
            $geoWithin: {
                $centerSphere: [ [ ltd, lng ], radiusKm / 6371 ]
            }
        }
    });

    return captains;
  }


// try {
//     if (!ltd || !lng || !radiusKm) {
//       throw new Error("Latitude, longitude, and radius are required");
//     }
//     // Convert radius from kilometers to meters
//     const radiusMeters = radiusKm * 1000;
//     // GeoJSON point
//     const captains = await captainModel.find({
//       location: {
//         $geoWithin: {
//           $centerSphere: [[lng, ltd], radiusMeters / 6378137], // Earth's radius in meters
//         },
//       },
//     });
//     return captains;
//   }

module.exports = { getAddressCoordinate, getDistanceAndTime,getAutoCompleteSuggestions,getCaptainsInTheRadius };
