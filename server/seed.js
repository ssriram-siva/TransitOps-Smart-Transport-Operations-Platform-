const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");
const Trip = require("./models/Trip");
const Maintenance = require("./models/Maintenance");
const FuelLog = require("./models/FuelLog");
const Expense = require("./models/Expense");

dotenv.config({ path: __dirname + "/../.env" });

const seedAll = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding...");

    // --- Users ---
    const existingAdmin = await User.findOne({ email: "admin@transitops.com" });
    if (existingAdmin) {
      console.log("Seed data already exists. Skipping...");
      process.exit(0);
    }

    console.log("Seeding users...");
    const admin = await User.create({
      name: "Admin User",
      email: "admin@transitops.com",
      password: "admin123",
      role: "admin",
      phone: "+91-9876543210",
    });

    const dispatcher = await User.create({
      name: "Ravi Kumar",
      email: "dispatcher@transitops.com",
      password: "dispatcher123",
      role: "dispatcher",
      phone: "+91-9876543211",
    });

    await User.create({
      name: "Guest Viewer",
      email: "viewer@transitops.com",
      password: "viewer123",
      role: "viewer",
      phone: "+91-9876543212",
    });

    console.log("  Users created");

    // --- Vehicles ---
    console.log("Seeding vehicles...");
    const vehiclesData = [
      { registrationNumber: "MH-12-AB-1234", type: "truck", make: "Tata", model: "Prima", year: 2022, capacityValue: 25, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-03-15", fitnessExpiry: "2027-03-15", location: { lat: 19.0760, lng: 72.8777, heading: 45, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "KA-01-CD-5678", type: "bus", make: "Ashok Leyland", model: "Viking", year: 2021, capacityValue: 45, capacityUnit: "seats", fuelType: "diesel", status: "available", insuranceExpiry: "2027-06-20", fitnessExpiry: "2027-06-20", location: { lat: 12.9716, lng: 77.5946, heading: 120, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "DL-01-EF-9012", type: "truck", make: "Eicher", model: "Pro 2049", year: 2023, capacityValue: 16, capacityUnit: "tons", fuelType: "diesel", status: "in_shop", insuranceExpiry: "2027-01-10", fitnessExpiry: "2027-01-10", location: { lat: 28.7041, lng: 77.1025, heading: 0, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "TN-07-GH-3456", type: "van", make: "Tata", model: "Ace", year: 2024, capacityValue: 2, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-09-05", fitnessExpiry: "2027-09-05", location: { lat: 13.0827, lng: 80.2707, heading: 200, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "GJ-05-IJ-7890", type: "tanker", make: "Mahindra", model: "Blazo", year: 2020, capacityValue: 20000, capacityUnit: "liters", fuelType: "diesel", status: "available", insuranceExpiry: "2026-12-01", fitnessExpiry: "2026-12-01", location: { lat: 23.0225, lng: 72.5714, heading: 90, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "RJ-14-KL-1111", type: "trailer", make: "Tata", model: "Signa", year: 2022, capacityValue: 30, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-08-18", fitnessExpiry: "2027-08-18", location: { lat: 26.9124, lng: 75.7873, heading: 315, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "UP-32-MN-2222", type: "truck", make: "Ashok Leyland", model: "Captain", year: 2021, capacityValue: 20, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-04-22", fitnessExpiry: "2027-04-22", location: { lat: 26.8467, lng: 80.9462, heading: 170, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "AP-28-OP-3333", type: "bus", make: "Tata", model: "Starbus", year: 2023, capacityValue: 52, capacityUnit: "seats", fuelType: "cng", status: "available", insuranceExpiry: "2027-11-30", fitnessExpiry: "2027-11-30", location: { lat: 17.3850, lng: 78.4867, heading: 60, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "KL-07-QR-4444", type: "van", make: "Eicher", model: "Skyline", year: 2024, capacityValue: 15, capacityUnit: "seats", fuelType: "petrol", status: "available", insuranceExpiry: "2027-07-12", fitnessExpiry: "2027-07-12", location: { lat: 9.9312, lng: 76.2673, heading: 240, speed: 0, updatedAt: new Date() } },
      { registrationNumber: "MP-09-ST-5555", type: "truck", make: "Mahindra", model: "Furio", year: 2022, capacityValue: 18, capacityUnit: "tons", fuelType: "diesel", status: "retired", insuranceExpiry: "2025-06-01", fitnessExpiry: "2025-06-01", location: { lat: 23.2599, lng: 77.4126, heading: 0, speed: 0, updatedAt: new Date() } },
    ];
    const vehicles = await Vehicle.create(vehiclesData);
    console.log(`  ${vehicles.length} vehicles created`);

    // --- Drivers ---
    console.log("Seeding drivers...");
    const driversData = [
      { name: "Rajesh Kumar", phone: "+91-9876543220", email: "rajesh@email.com", licenseNumber: "MH-12-2020-001234", licenseExpiry: "2030-05-15", licenseClass: "HMV", city: "Mumbai", status: "available", totalTrips: 42, rating: 4.9 },
      { name: "Amit Singh", phone: "+91-9876543221", email: "amit@email.com", licenseNumber: "KA-01-2021-005678", licenseExpiry: "2031-08-20", licenseClass: "HMV", city: "Bangalore", status: "available", totalTrips: 38, rating: 4.8 },
      { name: "Priya Patel", phone: "+91-9876543222", email: "priya@email.com", licenseNumber: "DL-01-2019-009012", licenseExpiry: "2029-12-10", licenseClass: "HPMV", city: "Delhi", status: "available", totalTrips: 35, rating: 4.7 },
      { name: "Vikram Rao", phone: "+91-9876543223", email: "vikram@email.com", licenseNumber: "TN-07-2022-003456", licenseExpiry: "2032-03-25", licenseClass: "HMV", city: "Chennai", status: "available", totalTrips: 31, rating: 4.6 },
      { name: "Suresh Patel", phone: "+91-9876543224", email: "suresh@email.com", licenseNumber: "GJ-05-2020-007890", licenseExpiry: "2026-08-01", licenseClass: "HMV", city: "Ahmedabad", status: "off_duty", totalTrips: 28, rating: 4.4 },
      { name: "Anil Sharma", phone: "+91-9876543225", email: "anil@email.com", licenseNumber: "RJ-14-2021-001111", licenseExpiry: "2031-01-15", licenseClass: "HMV", city: "Jaipur", status: "available", totalTrips: 25, rating: 4.5 },
      { name: "Deepak Verma", phone: "+91-9876543226", licenseNumber: "UP-32-2019-002222", licenseExpiry: "2025-11-20", licenseClass: "LMV", city: "Lucknow", status: "suspended", totalTrips: 15, rating: 3.8 },
      { name: "Mohammed Ali", phone: "+91-9876543227", licenseNumber: "AP-28-2023-003333", licenseExpiry: "2033-06-30", licenseClass: "HMV", city: "Hyderabad", status: "available", totalTrips: 20, rating: 4.6 },
    ];
    const drivers = await Driver.create(driversData);
    console.log(`  ${drivers.length} drivers created`);

    // --- Trips ---
    console.log("Seeding trips...");
    const now = new Date();
    const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
    const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

    const tripsData = [
      // Completed trips
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, origin: "Mumbai", destination: "Pune", distance: 150, cargoDescription: "Electronics", cargoWeight: 20, cargoUnit: "tons", scheduledDeparture: daysAgo(30), actualDeparture: daysAgo(30), arrival: daysAgo(29), status: "completed", tripCost: 45000 },
      { vehicle: vehicles[1]._id, driver: drivers[1]._id, origin: "Bangalore", destination: "Chennai", distance: 350, cargoDescription: "Passengers", cargoWeight: 3, cargoUnit: "tons", scheduledDeparture: daysAgo(28), actualDeparture: daysAgo(28), arrival: daysAgo(27), status: "completed", tripCost: 85000 },
      { vehicle: vehicles[3]._id, driver: drivers[2]._id, origin: "Chennai", destination: "Coimbatore", distance: 500, cargoDescription: "Textiles", cargoWeight: 1.5, cargoUnit: "tons", scheduledDeparture: daysAgo(25), actualDeparture: daysAgo(25), arrival: daysAgo(24), status: "completed", tripCost: 35000 },
      { vehicle: vehicles[4]._id, driver: drivers[3]._id, origin: "Ahmedabad", destination: "Rajkot", distance: 250, cargoDescription: "Petroleum", cargoWeight: 18, cargoUnit: "tons", scheduledDeparture: daysAgo(20), actualDeparture: daysAgo(20), arrival: daysAgo(19), status: "completed", tripCost: 55000 },
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, origin: "Mumbai", destination: "Nashik", distance: 200, cargoDescription: "Automotive Parts", cargoWeight: 15, cargoUnit: "tons", scheduledDeparture: daysAgo(15), actualDeparture: daysAgo(15), arrival: daysAgo(14), status: "completed", tripCost: 38000 },
      { vehicle: vehicles[5]._id, driver: drivers[5]._id, origin: "Jaipur", destination: "Delhi", distance: 280, cargoDescription: "Textiles", cargoWeight: 25, cargoUnit: "tons", scheduledDeparture: daysAgo(12), actualDeparture: daysAgo(12), arrival: daysAgo(11), status: "completed", tripCost: 52000 },
      { vehicle: vehicles[6]._id, driver: drivers[1]._id, origin: "Lucknow", destination: "Kanpur", distance: 90, cargoDescription: "FMCG Goods", cargoWeight: 16, cargoUnit: "tons", scheduledDeparture: daysAgo(10), actualDeparture: daysAgo(10), arrival: daysAgo(10), status: "completed", tripCost: 22000 },
      { vehicle: vehicles[1]._id, driver: drivers[2]._id, origin: "Bangalore", destination: "Mysore", distance: 150, cargoDescription: "Passengers", cargoWeight: 3, cargoUnit: "tons", scheduledDeparture: daysAgo(8), actualDeparture: daysAgo(8), arrival: daysAgo(7), status: "completed", tripCost: 40000 },
      { vehicle: vehicles[7]._id, driver: drivers[7]._id, origin: "Hyderabad", destination: "Vijayawada", distance: 275, cargoDescription: "Pharmaceuticals", cargoWeight: 1, cargoUnit: "tons", scheduledDeparture: daysAgo(6), actualDeparture: daysAgo(6), arrival: daysAgo(5), status: "completed", tripCost: 32000 },
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, origin: "Pune", destination: "Mumbai", distance: 150, cargoDescription: "Machinery", cargoWeight: 22, cargoUnit: "tons", scheduledDeparture: daysAgo(4), actualDeparture: daysAgo(4), arrival: daysAgo(3), status: "completed", tripCost: 42000 },
      { vehicle: vehicles[5]._id, driver: drivers[5]._id, origin: "Delhi", destination: "Agra", distance: 230, cargoDescription: "Construction Material", cargoWeight: 28, cargoUnit: "tons", scheduledDeparture: daysAgo(2), actualDeparture: daysAgo(2), arrival: daysAgo(1), status: "completed", tripCost: 48000 },
      // In-progress trip
      { vehicle: vehicles[1]._id, driver: drivers[1]._id, origin: "Chennai", destination: "Bangalore", distance: 350, cargoDescription: "Passengers", cargoWeight: 3, cargoUnit: "tons", scheduledDeparture: daysAgo(1), actualDeparture: daysAgo(1), status: "in_progress", tripCost: 60000 },
      // Scheduled trips
      { vehicle: vehicles[3]._id, driver: drivers[3]._id, origin: "Coimbatore", destination: "Kochi", distance: 200, cargoDescription: "Spices", cargoWeight: 1.8, cargoUnit: "tons", scheduledDeparture: daysFromNow(2), status: "scheduled" },
      { vehicle: vehicles[6]._id, driver: drivers[2]._id, origin: "Lucknow", destination: "Varanasi", distance: 320, cargoDescription: "Handicrafts", cargoWeight: 14, cargoUnit: "tons", scheduledDeparture: daysFromNow(3), status: "scheduled" },
      // Cancelled trip
      { vehicle: vehicles[4]._id, driver: drivers[4]._id, origin: "Ahmedabad", destination: "Mumbai", distance: 530, cargoDescription: "Chemicals", cargoWeight: 18, cargoUnit: "tons", scheduledDeparture: daysAgo(7), status: "cancelled", notes: "Vehicle breakdown" },
    ];
    const trips = await Trip.create(tripsData);
    console.log(`  ${trips.length} trips created`);

    // Update vehicle statuses based on trips
    await Vehicle.findByIdAndUpdate(vehicles[0]._id, { status: "available" });
    await Vehicle.findByIdAndUpdate(vehicles[1]._id, { status: "on_trip" }); // on_trip from in_progress trip
    await Vehicle.findByIdAndUpdate(vehicles[3]._id, { status: "available" });
    await Vehicle.findByIdAndUpdate(vehicles[4]._id, { status: "available" });
    await Vehicle.findByIdAndUpdate(vehicles[5]._id, { status: "available" });
    await Vehicle.findByIdAndUpdate(vehicles[6]._id, { status: "available" });
    await Vehicle.findByIdAndUpdate(vehicles[7]._id, { status: "available" });
    // vehicles[2] = in_shop, vehicles[8] = available, vehicles[9] = retired
    await Driver.findByIdAndUpdate(drivers[1]._id, { status: "on_trip" }); // on_trip from in_progress

    // --- Maintenance ---
    console.log("Seeding maintenance records...");
    const maintenanceData = [
      { vehicle: vehicles[2]._id, type: "repair", description: "Engine overhaul - oil leak repair", scheduledDate: daysAgo(5), status: "in_progress", shop: "Delhi Auto Works", technician: "Ram Mechanic", cost: 35000 },
      { vehicle: vehicles[0]._id, type: "routine", description: "50,000 km scheduled service", scheduledDate: daysFromNow(10), status: "scheduled", shop: "Mumbai Service Center" },
      { vehicle: vehicles[7]._id, type: "inspection", description: "Annual fitness certificate renewal", scheduledDate: daysFromNow(15), status: "scheduled", shop: "Hyderabad RTO" },
      { vehicle: vehicles[3]._id, type: "routine", description: "Oil change + brake pad replacement", scheduledDate: daysAgo(20), completedDate: daysAgo(20), cost: 12500, status: "completed", shop: "Chennai Fleet Care", technician: "Kumar Auto" },
      { vehicle: vehicles[4]._id, type: "breakdown", description: "Flat tire replacement - rear axle", scheduledDate: daysAgo(25), completedDate: daysAgo(25), cost: 8200, status: "completed", shop: "Ahmedabad Roadside" },
      { vehicle: vehicles[0]._id, type: "routine", description: "40,000 km scheduled service", scheduledDate: daysAgo(60), completedDate: daysAgo(60), cost: 9800, status: "completed", shop: "Mumbai Service Center" },
      { vehicle: vehicles[5]._id, type: "repair", description: "Hydraulic system maintenance", scheduledDate: daysAgo(15), completedDate: daysAgo(14), cost: 22000, status: "completed", shop: "Delhi Heavy Works", technician: "Singh Mechanics" },
    ];
    const maintenanceRecords = await Maintenance.create(maintenanceData);
    console.log(`  ${maintenanceRecords.length} maintenance records created`);

    // --- Fuel Logs ---
    console.log("Seeding fuel logs...");
    const fuelLogsData = [
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, date: daysAgo(29), fuelType: "diesel", quantity: 85, costPerUnit: 96.5, totalCost: 8202, odometer: 125000, fuelStation: "HP Petrol Pump, Mumbai" },
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, date: daysAgo(14), fuelType: "diesel", quantity: 78, costPerUnit: 97.0, totalCost: 7566, odometer: 127200, fuelStation: "BP Petrol Pump, Nashik" },
      { vehicle: vehicles[1]._id, driver: drivers[1]._id, date: daysAgo(27), fuelType: "diesel", quantity: 120, costPerUnit: 96.0, totalCost: 11520, odometer: 89000, fuelStation: "IOCL Station, Bangalore" },
      { vehicle: vehicles[3]._id, driver: drivers[2]._id, date: daysAgo(24), fuelType: "diesel", quantity: 45, costPerUnit: 98.0, totalCost: 4410, odometer: 34000, fuelStation: "HP Station, Chennai" },
      { vehicle: vehicles[4]._id, driver: drivers[3]._id, date: daysAgo(19), fuelType: "diesel", quantity: 150, costPerUnit: 95.5, totalCost: 14325, odometer: 67000, fuelStation: "Reliance Petrol, Ahmedabad" },
      { vehicle: vehicles[5]._id, driver: drivers[5]._id, date: daysAgo(11), fuelType: "diesel", quantity: 95, costPerUnit: 97.5, totalCost: 9262, odometer: 52000, fuelStation: "BP Station, Jaipur" },
      { vehicle: vehicles[6]._id, driver: drivers[1]._id, date: daysAgo(10), fuelType: "diesel", quantity: 60, costPerUnit: 96.0, totalCost: 5760, odometer: 41000, fuelStation: "HP Pump, Lucknow" },
      { vehicle: vehicles[7]._id, driver: drivers[7]._id, date: daysAgo(5), fuelType: "cng", quantity: 40, costPerUnit: 78.0, totalCost: 3120, odometer: 22000, fuelStation: "CNG Station, Hyderabad" },
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, date: daysAgo(3), fuelType: "diesel", quantity: 82, costPerUnit: 97.5, totalCost: 7995, odometer: 130500, fuelStation: "IOCL Pump, Pune" },
      { vehicle: vehicles[1]._id, driver: drivers[1]._id, date: daysAgo(1), fuelType: "diesel", quantity: 110, costPerUnit: 96.5, totalCost: 10615, odometer: 92500, fuelStation: "BP Station, Chennai" },
    ];
    const fuelLogs = await FuelLog.create(fuelLogsData);
    console.log(`  ${fuelLogs.length} fuel logs created`);

    // --- Expenses ---
    console.log("Seeding expenses...");
    const expensesData = [
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, date: daysAgo(29), category: "toll", description: "Mumbai-Pune Expressway Toll", amount: 1250, receiptNumber: "TOLL-001" },
      { vehicle: vehicles[1]._id, driver: drivers[1]._id, date: daysAgo(27), category: "toll", description: "Bangalore-Chennai Highway Toll", amount: 850, receiptNumber: "TOLL-002" },
      { vehicle: vehicles[3]._id, driver: drivers[2]._id, date: daysAgo(24), category: "toll", description: "Chennai-Coimbatore Toll", amount: 680, receiptNumber: "TOLL-003" },
      { vehicle: vehicles[4]._id, driver: drivers[3]._id, date: daysAgo(19), category: "parking", description: "Ahmedabad depot parking - 2 days", amount: 400 },
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, date: daysAgo(14), category: "repair", description: "Minor bodywork repair", amount: 4800, receiptNumber: "REP-001" },
      { vehicle: vehicles[5]._id, driver: drivers[5]._id, date: daysAgo(11), category: "toll", description: "Jaipur-Delhi Highway Toll", amount: 720, receiptNumber: "TOLL-004" },
      { vehicle: vehicles[2]._id, date: daysAgo(8), category: "insurance", description: "Q3 2026 Insurance Premium - DL-01-EF-9012", amount: 45000, receiptNumber: "INS-001" },
      { vehicle: vehicles[7]._id, driver: drivers[7]._id, date: daysAgo(5), category: "permit", description: "Interstate Permit Renewal", amount: 3500, receiptNumber: "PRM-001" },
      { vehicle: vehicles[6]._id, driver: drivers[1]._id, date: daysAgo(10), category: "toll", description: "Lucknow-Kanpur Expressway Toll", amount: 450, receiptNumber: "TOLL-005" },
      { vehicle: vehicles[0]._id, driver: drivers[0]._id, date: daysAgo(3), category: "fine", description: "Speeding fine - Pune bypass", amount: 2000, receiptNumber: "FINE-001" },
    ];
    const expenses = await Expense.create(expensesData);
    console.log(`  ${expenses.length} expenses created`);

    console.log("\n=== Seed Complete ===");
    console.log("Login Credentials:");
    console.log("  Admin:      admin@transitops.com / admin123");
    console.log("  Dispatcher: dispatcher@transitops.com / dispatcher123");
    console.log("  Viewer:     viewer@transitops.com / viewer123");
    console.log(`\n  ${vehicles.length} vehicles, ${drivers.length} drivers, ${trips.length} trips`);
    console.log(`  ${maintenanceRecords.length} maintenance records, ${fuelLogs.length} fuel logs, ${expenses.length} expenses`);

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedAll();
