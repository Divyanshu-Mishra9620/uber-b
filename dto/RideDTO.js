/**
 * Ride Data Transfer Object (DTO)
 * Standardizes ride response format across all API endpoints
 */
export class RideDTO {
  constructor(ride) {
    this.id = ride._id;
    this.userId = ride.userId;
    this.captainId = ride.captainId || null;
    this.pickup = ride.pickup;
    this.dropoff = ride.dropoff;
    this.fare = ride.fare;
    this.status = ride.status;
    this.distance = ride.distance;
    this.duration = ride.duration;
    this.createdAt = ride.createdAt;
    this.acceptedAt = ride.acceptedAt || null;
    this.completedAt = ride.completedAt || null;
    this.cancelledAt = ride.cancelledAt || null;
  }

  static fromArray(rides) {
    return rides.map((ride) => new RideDTO(ride));
  }

  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      captainId: this.captainId,
      pickup: this.pickup,
      dropoff: this.dropoff,
      fare: this.fare,
      status: this.status,
      distance: this.distance,
      duration: this.duration,
      createdAt: this.createdAt,
      acceptedAt: this.acceptedAt,
      completedAt: this.completedAt,
      cancelledAt: this.cancelledAt,
    };
  }
}

export default RideDTO;
