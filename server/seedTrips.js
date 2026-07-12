const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Trip = require("./models/Trip");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");

dotenv.config({ path: __dirname + "/../.env" });

const seedTrips = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding trips...");

    await Trip.deleteMany({});
    console.log("Cleared existing trips");

    const vehicles = await Vehicle.find();
    const drivers = await Driver.find();

    if (vehicles.length < 3 || drivers.length < 3) {
      console.log("Need at least 3 vehicles and 3 drivers. Run seedVehicles and seedDrivers first.");
      process.exit(1);
    }

    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 86400000);
    const daysFromNow = (d) => new Date(now.getTime() + d * 86400000);

    const available = vehicles.filter((v) => v.status === "available");
    const vOnTrip = vehicles.find((v) => v.status === "on_trip") || vehicles[0];
    const dOnTrip = drivers.find((d) => d.status === "on_trip") || drivers[0];

    const trips = [
      // Completed trips
      {
        vehicle: available[0]?._id || vehicles[0]._id,
        driver: available[0]?._id ? drivers.find((d) => d.status === "available")?._id || drivers[0]._id : drivers[1]._id,
        origin: "Mumbai",
        destination: "Pune",
        distance: 150,
        cargoDescription: "Electronics",
        cargoWeight: 12,
        cargoUnit: "tons",
        scheduledDeparture: daysAgo(5),
        actualDeparture: daysAgo(5),
        arrival: daysAgo(4),
        status: "completed",
        tripCost: 18000,
        notes: "Fragile goods — handle with care",
      },
      {
        vehicle: available[1]?._id || vehicles[1]._id,
        driver: drivers[2]?._id || drivers[0]._id,
        origin: "Delhi",
        destination: "Jaipur",
        distance: 280,
        cargoDescription: "Textiles",
        cargoWeight: 8,
        cargoUnit: "tons",
        scheduledDeparture: daysAgo(4),
        actualDeparture: daysAgo(4),
        arrival: daysAgo(3),
        status: "completed",
        tripCost: 22000,
      },
      {
        vehicle: vehicles[2]._id,
        driver: drivers[3]?._id || drivers[0]._id,
        origin: "Chennai",
        destination: "Bangalore",
        distance: 350,
        cargoDescription: "Auto Parts",
        cargoWeight: 1.5,
        cargoUnit: "tons",
        scheduledDeparture: daysAgo(3),
        actualDeparture: daysAgo(3),
        arrival: daysAgo(2),
        status: "completed",
        tripCost: 15000,
      },
      // In progress trip
      {
        vehicle: vOnTrip._id,
        driver: dOnTrip._id,
        origin: "Ahmedabad",
        destination: "Mumbai",
        distance: 530,
        cargoDescription: "Chemicals",
        cargoWeight: 20,
        cargoUnit: "tons",
        scheduledDeparture: daysAgo(1),
        actualDeparture: daysAgo(1),
        status: "in_progress",
        notes: "Temperature-controlled transport",
      },
      // Scheduled trips
      {
        vehicle: vehicles[3]?._id || vehicles[0]._id,
        driver: drivers[4]?._id || drivers[0]._id,
        origin: "Delhi",
        destination: "Lucknow",
        distance: 550,
        cargoDescription: "Furniture",
        cargoWeight: 10,
        cargoUnit: "tons",
        scheduledDeparture: daysFromNow(1),
        status: "scheduled",
        tripCost: 25000,
      },
      {
        vehicle: vehicles[4]?._id || vehicles[1]._id,
        driver: drivers[5]?._id || drivers[1]._id,
        origin: "Kolkata",
        destination: "Patna",
        distance: 600,
        cargoDescription: "Pharmaceuticals",
        cargoWeight: 5,
        cargoUnit: "tons",
        scheduledDeparture: daysFromNow(2),
        status: "scheduled",
      },
      // Cancelled trip
      {
        vehicle: vehicles[5]?._id || vehicles[2]._id,
        driver: drivers[6]?._id || drivers[2]._id,
        origin: "Mumbai",
        destination: "Nagpur",
        distance: 800,
        cargoDescription: "Machinery",
        cargoWeight: 18,
        cargoUnit: "tons",
        scheduledDeparture: daysAgo(2),
        status: "cancelled",
        notes: "Cancelled due to vehicle breakdown",
      },
    ];

    const created = await Trip.insertMany(trips);
    console.log(`Seeded ${created.length} trips`);
    process.exit(0);
  } catch (error) {
    console.error("Trip seeding error:", error);
    process.exit(1);
  }
};

seedTrips();
