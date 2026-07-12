const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Vehicle = require("./models/Vehicle");

dotenv.config({ path: __dirname + "/../.env" });

const vehicles = [
  {
    registrationNumber: "MH-12-AB-1234",
    type: "truck",
    make: "Tata",
    model: "Prima",
    year: 2022,
    capacityValue: 25,
    capacityUnit: "tons",
    fuelType: "diesel",
    status: "available",
    insuranceExpiry: "2027-03-15",
    fitnessExpiry: "2027-03-15",
  },
  {
    registrationNumber: "KA-01-CD-5678",
    type: "bus",
    make: "Ashok Leyland",
    model: "Viking",
    year: 2021,
    capacityValue: 52,
    capacityUnit: "seats",
    fuelType: "diesel",
    status: "on_trip",
    insuranceExpiry: "2026-12-01",
    fitnessExpiry: "2026-12-01",
  },
  {
    registrationNumber: "DL-01-EF-9012",
    type: "truck",
    make: "Eicher",
    model: "Pro 6016",
    year: 2020,
    capacityValue: 16,
    capacityUnit: "tons",
    fuelType: "diesel",
    status: "in_shop",
    insuranceExpiry: "2026-08-20",
    fitnessExpiry: "2026-08-20",
  },
  {
    registrationNumber: "TN-07-GH-3456",
    type: "van",
    make: "Tata",
    model: "Ace",
    year: 2023,
    capacityValue: 2,
    capacityUnit: "tons",
    fuelType: "diesel",
    status: "available",
    insuranceExpiry: "2028-01-10",
    fitnessExpiry: "2028-01-10",
  },
  {
    registrationNumber: "GJ-05-IJ-7890",
    type: "truck",
    make: "Mahindra",
    model: "Blazo",
    year: 2021,
    capacityValue: 31,
    capacityUnit: "tons",
    fuelType: "diesel",
    status: "on_trip",
    insuranceExpiry: "2026-11-05",
    fitnessExpiry: "2026-11-05",
  },
  {
    registrationNumber: "RJ-14-KL-2345",
    type: "bus",
    make: "Tata",
    model: "Starbus",
    year: 2018,
    capacityValue: 45,
    capacityUnit: "seats",
    fuelType: "diesel",
    status: "retired",
    insuranceExpiry: "2025-06-30",
    fitnessExpiry: "2025-06-30",
  },
  {
    registrationNumber: "UP-32-MN-6789",
    type: "tanker",
    make: "Ashok Leyland",
    model: "Captain",
    year: 2022,
    capacityValue: 10000,
    capacityUnit: "liters",
    fuelType: "diesel",
    status: "available",
    insuranceExpiry: "2027-05-20",
    fitnessExpiry: "2027-05-20",
  },
  {
    registrationNumber: "MH-02-OP-1357",
    type: "trailer",
    make: "Tata",
    model: "Signa",
    year: 2023,
    capacityValue: 40,
    capacityUnit: "tons",
    fuelType: "diesel",
    status: "available",
    insuranceExpiry: "2028-02-28",
    fitnessExpiry: "2028-02-28",
  },
];

const seedVehicles = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for vehicle seeding...");

    const existingCount = await Vehicle.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing vehicles. Skipping...`);
      process.exit(0);
    }

    const created = await Vehicle.insertMany(vehicles);
    console.log(`${created.length} vehicles seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("Vehicle seed error:", error.message);
    process.exit(1);
  }
};

seedVehicles();
