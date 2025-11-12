const axios = require("axios");
const captainModel = require("../models/captian.model");

const getAddressCoordinate = async (address) => {
  try {
    if (!address || address.trim().length === 0) {
      throw new Error("Address is required");
    }

    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      address
    )}&format=json&limit=1`;

    console.log("🔍 Searching address:", address);

    const response = await axios.get(url, {
      headers: {
        "User-Agent": "UberCloneApp/1.0 (agarwaldevang664@gmail.com)",
      },
      timeout: 8000, // 8 second timeout
    });

    const data = response.data;

    if (!data || data.length === 0) {
      throw new Error(`Address "${address}" not found in the system`);
    }

    console.log("✅ Address found:", address, "→", data[0].display_name);

    // Extract latitude & longitude
    return {
      ltd: parseFloat(data[0].lat),
      lng: parseFloat(data[0].lon),
    };
  } catch (error) {
    console.error("❌ Error in getAddressCoordinate:", error.message);
    throw error;
  }
};

const getDistanceAndTime = async (originAddress, destinationAddress) => {
  try {
    if (!originAddress || !destinationAddress) {
      throw new Error("Origin and destination are required");
    }

    console.log(
      "📍 Getting coordinates for:",
      originAddress,
      "→",
      destinationAddress
    );

    const origin = await getAddressCoordinate(originAddress);
    const destination = await getAddressCoordinate(destinationAddress);

    console.log("✅ Origin coordinates:", origin);
    console.log("✅ Destination coordinates:", destination);

    // Calculate using Haversine as primary method (more reliable)
    console.log("📏 Using Haversine distance calculation...");
    const distance = calculateHaversineDistance(
      origin.ltd,
      origin.lng,
      destination.ltd,
      destination.lng
    );

    // Try OSRM for more accurate routing, but don't fail if it times out
    try {
      const url = `http://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.ltd};${destination.lng},${destination.ltd}?overview=false`;

      console.log("🔗 Attempting OSRM route...");

      const response = await axios.get(url, {
        timeout: 5000, // 5 second timeout
      });

      const data = response.data;

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        console.log("✅ OSRM route found");
        return {
          distance_km: (route.distance / 1000).toFixed(2),
          duration_min: (route.duration / 60).toFixed(2),
        };
      }
    } catch (osrmError) {
      console.warn(
        "⚠️ OSRM timeout/error, falling back to Haversine:",
        osrmError.message
      );
    }

    // Fallback: Use Haversine calculation
    console.log("📊 Using fallback Haversine calculation");
    return {
      distance_km: distance.toFixed(2),
      duration_min: (distance * 1.5).toFixed(2), // Rough estimate: 1.5 min per km
    };
  } catch (error) {
    console.error("❌ Error in getDistanceAndTime:", error.message);
    throw error;
  }
};

// Haversine formula to calculate distance between two coordinates
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
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
  try {
    if (!ltd || !lng || !radiusKm) {
      throw new Error("Latitude, longitude, and radius are required");
    }

    const captains = await captainModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [[lng, ltd], radiusKm / 6371],
        },
      },
    });

    return captains;
  } catch (error) {
    console.error("Error in getCaptainsInTheRadius:", error.message);
    throw error;
  }
};

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

module.exports = {
  getAddressCoordinate,
  getDistanceAndTime,
  getAutoCompleteSuggestions,
  getCaptainsInTheRadius,
};
