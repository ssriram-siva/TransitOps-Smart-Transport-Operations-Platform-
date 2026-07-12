const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Driver = require("./models/Driver");

dotenv.config({ path: __dirname + "/../.env" });

const drivers = [
  {
    name: "Rajesh Kumar",
    phone: "+91-9876543210",
    email: "rajesh@email.com",
    licenseNumber: "MH-12-2021-001234",
    licenseExpiry: "2027-03-15",
    licenseClass: "HMV",
    city: "Mumbai",
    status: "available",
    totalTrips: 42,
    rating: 4.9,
  },
  {
    name: "Amit Singh",
    phone: "+91-9876543211",
    email: "amit@email.com",
    licenseNumber: "KA-01-2022-005678",
    licenseExpiry: "2028-06-20",
    licenseClass: "HMV",
    city: "Bangalore",
    status: "on_trip",
    totalTrips: 38,
    rating: 4.8,
  },
  {
    name: "Priya Patel",
    phone: "+91-9876543212",
    email: "priya@email.com",
    licenseNumber: "DL-01-2020-009012",
    licenseExpiry: "2026-01-10",
    licenseClass: "LMV",
    city: "Delhi",
    status: "available",
    totalTrips: 35,
    rating: 4.7,
  },
  {
    name: "Vikram Rao",
    phone: "+91-9876543213",
    email: "vikram@email.com",
    licenseNumber: "TN-07-2023-003456",
    licenseExpiry: "2029-08-05",
    licenseClass: "HPMV",
    city: "Chennai",
    status: "off_duty",
    totalTrips: 31,
    rating: 4.6,
  },
  {
    name: "Suresh Patel",
    phone: "+91-9876543214",
    email: "suresh@email.com",
    licenseNumber: "GJ-05-2019-007890",
    licenseExpiry: "2025-12-25",
    licenseClass: "HMV",
    city: "Ahmedabad",
    status: "suspended",
    totalTrips: 18,
    rating: 4.1,
  },
  {
    name: "Anil Sharma",
    phone: "+91-9876543215",
    email: "anil@email.com",
    licenseNumber: "RJ-14-2022-002345",
    licenseExpiry: "2026-08-30",
    licenseClass: "HMV",
    city: "Jaipur",
    status: "available",
    totalTrips: 29,
    rating: 4.5,
  },
  {
    name: "Deepak Verma",
    phone: "+91-9876543216",
    email: "deepak@email.com",
    licenseNumber: "UP-32-2021-006789",
    licenseExpiry: "2027-01-15",
    licenseClass: "HMV",
    city: "Lucknow",
    status: "available",
    totalTrips: 22,
    rating: 4.4,
  },
  {
    name: "Ravi Shankar",
    phone: "+91-9876543217",
    email: "ravi@email.com",
    licenseNumber: "WB-06-2023-004567",
    licenseExpiry: "2025-11-20",
    licenseClass: "NTL",
    city: "Kolkata",
    status: "available",
    totalTrips: 15,
    rating: 4.2,
  },
];

const seedDrivers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for driver seeding...");

    const existingCount = await Driver.countDocuments();
    if (existingCount > 0) {
      console.log(`Found ${existingCount} existing drivers. Skipping...`);
      process.exit(0);
    }

    const created = await Driver.insertMany(drivers);
    console.log(`${created.length} drivers seeded successfully`);

    process.exit(0);
  } catch (error) {
    console.error("Driver seed error:", error.message);
    process.exit(1);
  }
};

seedDrivers();
