/**
 * Captain Data Transfer Object (DTO)
 * Standardizes captain response format
 */
export class CaptainDTO {
  constructor(captain) {
    this.id = captain._id;
    this.email = captain.email;
    this.firstName = captain.firstName;
    this.lastName = captain.lastName;
    this.phone = captain.phone;
    this.vehicleType = captain.vehicleType;
    this.vehiclePlate = captain.vehiclePlate;
    this.location = captain.location || { latitude: 0, longitude: 0 };
    this.status = captain.status;
    this.rating = captain.rating || 0;
    this.totalRides = captain.totalRides || 0;
  }

  static fromArray(captains) {
    return captains.map((captain) => new CaptainDTO(captain));
  }

  toJSON() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      phone: this.phone,
      vehicleType: this.vehicleType,
      vehiclePlate: this.vehiclePlate,
      location: this.location,
      status: this.status,
      rating: this.rating,
      totalRides: this.totalRides,
    };
  }
}

export default CaptainDTO;
