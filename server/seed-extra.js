const mongoose = require("mongoose");
const dotenv = require("dotenv");
const Vehicle = require("./models/Vehicle");
const Driver = require("./models/Driver");
const FuelLog = require("./models/FuelLog");
const Expense = require("./models/Expense");
const Maintenance = require("./models/Maintenance");

dotenv.config({ path: __dirname + "/../.env" });

const now = new Date();
const daysAgo = (d) => new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
const daysFromNow = (d) => new Date(now.getTime() + d * 24 * 60 * 60 * 1000);

const seedExtra = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for extra seeding...");

    const vehicles = await Vehicle.find();
    const drivers = await Driver.find();
    if (vehicles.length === 0 || drivers.length === 0) {
      console.error("No vehicles or drivers found. Run seed.js first.");
      process.exit(1);
    }
    console.log(`Found ${vehicles.length} vehicles, ${drivers.length} drivers`);

    const vid = (i) => vehicles[i % vehicles.length]._id;
    const did = (i) => drivers[i % drivers.length]._id;

    // --- 15 Extra Vehicles ---
    console.log("Seeding 15 extra vehicles...");
    const extraVehicles = [
      { registrationNumber: "MH-04-XY-6001", type: "truck", make: "Tata", model: "Signa 4825", year: 2023, capacityValue: 28, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-10-10", fitnessExpiry: "2027-10-10", location: { lat: 18.5204, lng: 73.8567, heading: 110, speed: 0, updatedAt: now } },
      { registrationNumber: "KA-05-ZZ-6002", type: "van", make: "Maruti", model: "Super Carry", year: 2024, capacityValue: 1.5, capacityUnit: "tons", fuelType: "petrol", status: "available", insuranceExpiry: "2028-01-15", fitnessExpiry: "2028-01-15", location: { lat: 13.0358, lng: 77.5970, heading: 270, speed: 0, updatedAt: now } },
      { registrationNumber: "DL-03-AB-6003", type: "truck", make: "Ashok Leyland", model: "U-4825", year: 2022, capacityValue: 22, capacityUnit: "tons", fuelType: "diesel", status: "on_trip", insuranceExpiry: "2027-05-20", fitnessExpiry: "2027-05-20", location: { lat: 28.5494, lng: 77.2780, heading: 90, speed: 45, updatedAt: now } },
      { registrationNumber: "TN-01-CD-6004", type: "bus", make: "Tata", model: "Starbus Ultra", year: 2023, capacityValue: 40, capacityUnit: "seats", fuelType: "diesel", status: "available", insuranceExpiry: "2027-08-30", fitnessExpiry: "2027-08-30", location: { lat: 13.0569, lng: 80.2425, heading: 180, speed: 0, updatedAt: now } },
      { registrationNumber: "GJ-01-EF-6005", type: "tanker", make: "Tata", model: "Signa 2518", year: 2021, capacityValue: 25000, capacityUnit: "liters", fuelType: "diesel", status: "available", insuranceExpiry: "2027-03-01", fitnessExpiry: "2027-03-01", location: { lat: 21.1702, lng: 72.8311, heading: 45, speed: 0, updatedAt: now } },
      { registrationNumber: "RJ-20-GH-6006", type: "truck", make: "Eicher", model: "Pro 2059", year: 2024, capacityValue: 19, capacityUnit: "tons", fuelType: "diesel", status: "in_shop", insuranceExpiry: "2028-02-10", fitnessExpiry: "2028-02-10", location: { lat: 26.9124, lng: 75.7873, heading: 0, speed: 0, updatedAt: now } },
      { registrationNumber: "UP-65-IJ-6007", type: "van", make: "Tata", model: "Ace Gold", year: 2023, capacityValue: 2, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-11-05", fitnessExpiry: "2027-11-05", location: { lat: 25.4358, lng: 81.8463, heading: 350, speed: 0, updatedAt: now } },
      { registrationNumber: "AP-09-KL-6008", type: "trailer", make: "Mahindra", model: "Blazo 40", year: 2022, capacityValue: 35, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2027-07-22", fitnessExpiry: "2027-07-22", location: { lat: 16.5062, lng: 80.6480, heading: 135, speed: 0, updatedAt: now } },
      { registrationNumber: "KL-10-MN-6009", type: "bus", make: "Ashok Leyland", model: "Viking CNG", year: 2024, capacityValue: 48, capacityUnit: "seats", fuelType: "cng", status: "available", insuranceExpiry: "2028-04-18", fitnessExpiry: "2028-04-18", location: { lat: 10.8505, lng: 76.2711, heading: 225, speed: 0, updatedAt: now } },
      { registrationNumber: "MP-11-OP-6010", type: "truck", make: "Tata", model: "Prima LX", year: 2021, capacityValue: 32, capacityUnit: "tons", fuelType: "diesel", status: "retired", insuranceExpiry: "2025-12-31", fitnessExpiry: "2025-12-31", location: { lat: 22.5726, lng: 88.3639, heading: 0, speed: 0, updatedAt: now } },
      { registrationNumber: "MH-12-QR-6011", type: "van", make: "Eicher", model: "Pro 1049", year: 2023, capacityValue: 1.2, capacityUnit: "tons", fuelType: "petrol", status: "available", insuranceExpiry: "2027-09-15", fitnessExpiry: "2027-09-15", location: { lat: 19.0760, lng: 72.8777, heading: 60, speed: 0, updatedAt: now } },
      { registrationNumber: "KA-02-ST-6012", type: "tanker", make: "Ashok Leyland", model: "Boss 1615", year: 2022, capacityValue: 18000, capacityUnit: "liters", fuelType: "diesel", status: "available", insuranceExpiry: "2027-06-10", fitnessExpiry: "2027-06-10", location: { lat: 12.2958, lng: 76.6394, heading: 310, speed: 0, updatedAt: now } },
      { registrationNumber: "TN-08-UV-6013", type: "truck", make: "Mahindra", model: "Furio 16", year: 2024, capacityValue: 16, capacityUnit: "tons", fuelType: "diesel", status: "on_trip", insuranceExpiry: "2028-03-25", fitnessExpiry: "2028-03-25", location: { lat: 11.0168, lng: 76.9558, heading: 155, speed: 60, updatedAt: now } },
      { registrationNumber: "RJ-06-WX-6014", type: "bus", make: "Tata", model: "Magna", year: 2021, capacityValue: 35, capacityUnit: "seats", fuelType: "diesel", status: "available", insuranceExpiry: "2027-04-05", fitnessExpiry: "2027-04-05", location: { lat: 24.5854, lng: 73.7125, heading: 0, speed: 0, updatedAt: now } },
      { registrationNumber: "DL-09-YZ-6015", type: "trailer", make: "Eicher", model: "Skyline 3316", year: 2023, capacityValue: 26, capacityUnit: "tons", fuelType: "diesel", status: "available", insuranceExpiry: "2028-01-30", fitnessExpiry: "2028-01-30", location: { lat: 28.7041, lng: 77.1025, heading: 90, speed: 0, updatedAt: now } },
    ];

    const newVehicles = await Vehicle.insertMany(extraVehicles, { ordered: false }).catch(e => {
      console.log(`  Some vehicles skipped (duplicates): ${e.insertedDocs?.length || 0} inserted`);
      return e.insertedDocs || [];
    });
    console.log(`  ${newVehicles.length} extra vehicles created`);

    const allVehicles = await Vehicle.find();
    const allDrivers = await Driver.find();
    const vId = (i) => allVehicles[i % allVehicles.length]._id;
    const dId = (i) => allDrivers[i % allDrivers.length]._id;

    // --- 15 Extra Fuel Logs ---
    console.log("Seeding 15 extra fuel logs...");
    const extraFuelLogs = [
      { vehicle: vId(0), driver: dId(0), date: daysAgo(35), fuelType: "diesel", quantity: 90, costPerUnit: 96.2, totalCost: 8658, odometer: 135000, fuelStation: "HP Petrol Pump, Pune" },
      { vehicle: vId(1), driver: dId(1), date: daysAgo(33), fuelType: "petrol", quantity: 35, costPerUnit: 104.5, totalCost: 3657, odometer: 12000, fuelStation: "IOCL Station, Bangalore South" },
      { vehicle: vId(2), driver: dId(2), date: daysAgo(31), fuelType: "diesel", quantity: 100, costPerUnit: 95.8, totalCost: 9580, odometer: 78000, fuelStation: "BP Petrol Pump, Noida" },
      { vehicle: vId(3), driver: dId(3), date: daysAgo(28), fuelType: "diesel", quantity: 80, costPerUnit: 97.2, totalCost: 7776, odometer: 45000, fuelStation: "HP Station, Tambaram" },
      { vehicle: vId(4), driver: dId(4), date: daysAgo(26), fuelType: "diesel", quantity: 200, costPerUnit: 94.8, totalCost: 18960, odometer: 52000, fuelStation: "Reliance Petrol, Surat" },
      { vehicle: vId(5), driver: dId(5), date: daysAgo(24), fuelType: "diesel", quantity: 70, costPerUnit: 96.8, totalCost: 6776, odometer: 33000, fuelStation: "BP Station, Ajmer Road" },
      { vehicle: vId(6), driver: dId(6), date: daysAgo(22), fuelType: "diesel", quantity: 55, costPerUnit: 95.5, totalCost: 5252, odometer: 28000, fuelStation: "HP Pump, Varanasi" },
      { vehicle: vId(7), driver: dId(7), date: daysAgo(20), fuelType: "diesel", quantity: 130, costPerUnit: 96.0, totalCost: 12480, odometer: 61000, fuelStation: "IOCL Station, Guntur" },
      { vehicle: vId(8), driver: dId(0), date: daysAgo(18), fuelType: "cng", quantity: 38, costPerUnit: 79.5, totalCost: 3021, odometer: 15000, fuelStation: "CNG Station, Kochi" },
      { vehicle: vId(9), driver: dId(1), date: daysAgo(16), fuelType: "diesel", quantity: 95, costPerUnit: 97.0, totalCost: 9215, odometer: 88000, fuelStation: "BP Pump, Bhopal" },
      { vehicle: vId(10), driver: dId(2), date: daysAgo(14), fuelType: "petrol", quantity: 40, costPerUnit: 105.0, totalCost: 4200, odometer: 8500, fuelStation: "IOCL Station, Thane" },
      { vehicle: vId(11), driver: dId(3), date: daysAgo(12), fuelType: "diesel", quantity: 160, costPerUnit: 95.2, totalCost: 15232, odometer: 44000, fuelStation: "HP Station, Mysore" },
      { vehicle: vId(12), driver: dId(4), date: daysAgo(10), fuelType: "diesel", quantity: 75, costPerUnit: 96.5, totalCost: 7237, odometer: 21000, fuelStation: "BP Station, Madurai" },
      { vehicle: vId(13), driver: dId(5), date: daysAgo(8), fuelType: "diesel", quantity: 65, costPerUnit: 97.8, totalCost: 6357, odometer: 55000, fuelStation: "HP Pump, Udaipur" },
      { vehicle: vId(14), driver: dId(6), date: daysAgo(5), fuelType: "diesel", quantity: 110, costPerUnit: 96.3, totalCost: 10593, odometer: 39000, fuelStation: "Reliance Petrol, Dwarka" },
    ];
    const newFuelLogs = await FuelLog.insertMany(extraFuelLogs);
    console.log(`  ${newFuelLogs.length} extra fuel logs created`);

    // --- 15 Extra Expenses ---
    console.log("Seeding 15 extra expenses...");
    const extraExpenses = [
      { vehicle: vId(0), driver: dId(0), date: daysAgo(35), category: "toll", description: "Pune-Mumbai Expressway Toll", amount: 1150, receiptNumber: "TOLL-016" },
      { vehicle: vId(1), driver: dId(1), date: daysAgo(33), category: "parking", description: "Bangalore Airport Parking - 3 days", amount: 900 },
      { vehicle: vId(2), driver: dId(2), date: daysAgo(31), category: "toll", description: "Delhi-Noida-Direct Expressway Toll", amount: 980, receiptNumber: "TOLL-017" },
      { vehicle: vId(3), driver: dId(3), date: daysAgo(28), category: "permit", description: "TN State Entry Permit", amount: 1800, receiptNumber: "PRM-002" },
      { vehicle: vId(4), driver: dId(4), date: daysAgo(26), category: "toll", description: "Ahmedabad-Surat NH-48 Toll", amount: 1350, receiptNumber: "TOLL-018" },
      { vehicle: vId(5), driver: dId(5), date: daysAgo(24), category: "repair", description: "Suspension spring replacement", amount: 7500, receiptNumber: "REP-002" },
      { vehicle: vId(6), driver: dId(6), date: daysAgo(22), category: "toll", description: "Lucknow-Varanasi Expressway Toll", amount: 620, receiptNumber: "TOLL-019" },
      { vehicle: vId(7), driver: dId(7), date: daysAgo(20), category: "insurance", description: "Annual Comprehensive Policy - AP-09-KL-6008", amount: 52000, receiptNumber: "INS-002" },
      { vehicle: vId(8), driver: dId(0), date: daysAgo(18), category: "parking", description: "Kochi Bus Terminal Parking - 1 day", amount: 350 },
      { vehicle: vId(9), driver: dId(1), date: daysAgo(16), category: "fine", description: "Overloading penalty - NHAI", amount: 5000, receiptNumber: "FINE-002" },
      { vehicle: vId(10), driver: dId(2), date: daysAgo(14), category: "toll", description: "Thane-Pune Toll Plaza", amount: 540, receiptNumber: "TOLL-020" },
      { vehicle: vId(11), driver: dId(3), date: daysAgo(12), category: "repair", description: "AC compressor replacement", amount: 18500, receiptNumber: "REP-003" },
      { vehicle: vId(12), driver: dId(4), date: daysAgo(10), category: "permit", description: "Interstate Permit - TN to Kerala", amount: 2200, receiptNumber: "PRM-003" },
      { vehicle: vId(13), driver: dId(5), date: daysAgo(8), category: "toll", description: "Udaipur-Jaipur Highway Toll", amount: 870, receiptNumber: "TOLL-021" },
      { vehicle: vId(14), driver: dId(6), date: daysAgo(5), category: "other", description: "GPS tracker installation", amount: 6500, receiptNumber: "OTH-001" },
    ];
    const newExpenses = await Expense.insertMany(extraExpenses);
    console.log(`  ${newExpenses.length} extra expenses created`);

    // --- 15 Extra Maintenance ---
    console.log("Seeding 15 extra maintenance records...");
    const extraMaintenance = [
      { vehicle: vId(0), type: "routine", description: "60,000 km scheduled service - full inspection", scheduledDate: daysAgo(35), completedDate: daysAgo(34), cost: 14500, status: "completed", shop: "Pune Tata Service Center", technician: "Ramesh Verma", partsReplaced: ["Engine oil filter", "Air filter", "Fuel filter"] },
      { vehicle: vId(1), type: "routine", description: "Oil change + wheel alignment", scheduledDate: daysAgo(30), completedDate: daysAgo(30), cost: 3800, status: "completed", shop: "Bangalore Auto Care", technician: "Suresh K" },
      { vehicle: vId(2), type: "repair", description: "Clutch plate replacement", scheduledDate: daysAgo(28), completedDate: daysAgo(27), cost: 18000, status: "completed", shop: "Noida Heavy Vehicles", technician: "Ajay Mechanic", partsReplaced: ["Clutch plate", "Clutch bearing"] },
      { vehicle: vId(3), type: "inspection", description: "Quarterly safety inspection", scheduledDate: daysAgo(25), completedDate: daysAgo(25), cost: 2000, status: "completed", shop: "Chennai RTO Center" },
      { vehicle: vId(4), type: "breakdown", description: "Fuel pump failure - emergency replacement", scheduledDate: daysAgo(22), completedDate: daysAgo(21), cost: 12000, status: "completed", shop: "Surat Road Assistance", technician: "Bhavesh Patel", partsReplaced: ["Fuel pump", "Fuel filter"] },
      { vehicle: vId(5), type: "repair", description: "Brake drum machining + shoe replacement", scheduledDate: daysAgo(18), completedDate: daysAgo(17), cost: 8500, status: "completed", shop: "Ajmer Auto Works", technician: "Mohit Sharma", partsReplaced: ["Brake drums x4", "Brake shoes x8"] },
      { vehicle: vId(6), type: "routine", description: "25,000 km service - general checkup", scheduledDate: daysAgo(15), completedDate: daysAgo(15), cost: 5500, status: "completed", shop: "Varanasi Service Hub" },
      { vehicle: vId(7), type: "inspection", description: "Pre-trip safety inspection", scheduledDate: daysAgo(12), completedDate: daysAgo(12), cost: 1500, status: "completed", shop: "Guntur Fleet Check" },
      { vehicle: vId(8), type: "routine", description: "CNG kit servicing + filter replacement", scheduledDate: daysAgo(10), completedDate: daysAgo(10), cost: 4200, status: "completed", shop: "Kochi CNG Center", partsReplaced: ["CNG filter", "Spark plugs"] },
      { vehicle: vId(9), type: "repair", description: "Alternator rebuild", scheduledDate: daysAgo(5), status: "in_progress", shop: "Bhopal Auto Electric", technician: "Deepak Joshi" },
      { vehicle: vId(10), type: "routine", description: "10,000 km first free service", scheduledDate: daysFromNow(5), status: "scheduled", shop: "Thane Maruti Service" },
      { vehicle: vId(11), type: "breakdown", description: "Radiator overheating - coolant flush", scheduledDate: daysAgo(3), completedDate: daysAgo(3), cost: 6800, status: "completed", shop: "Mysore Cooling Solutions", technician: "Anil Raj", partsReplaced: ["Coolant", "Thermostat"] },
      { vehicle: vId(12), type: "inspection", description: "Pollution certificate renewal", scheduledDate: daysFromNow(8), status: "scheduled", shop: "Madurai PUC Center" },
      { vehicle: vId(13), type: "routine", description: "50,000 km major service", scheduledDate: daysFromNow(12), status: "scheduled", shop: "Udaipur Mahindra Service" },
      { vehicle: vId(14), type: "repair", description: "Turbocharger replacement", scheduledDate: daysAgo(2), status: "in_progress", shop: "Dwarka Heavy Repairs", technician: "Vikram Singh", partsReplaced: ["Turbocharger assembly"] },
    ];
    const newMaintenance = await Maintenance.insertMany(extraMaintenance);
    console.log(`  ${newMaintenance.length} extra maintenance records created`);

    // Summary
    const totalVehicles = await Vehicle.countDocuments();
    const totalDrivers = await Driver.countDocuments();
    const totalFuel = await FuelLog.countDocuments();
    const totalExpenses = await Expense.countDocuments();
    const totalMaintenance = await Maintenance.countDocuments();

    console.log("\n=== Extra Seed Complete ===");
    console.log(`  Total: ${totalVehicles} vehicles, ${totalDrivers} drivers`);
    console.log(`         ${totalFuel} fuel logs, ${totalExpenses} expenses, ${totalMaintenance} maintenance`);

    process.exit(0);
  } catch (error) {
    console.error("Extra seed error:", error.message);
    process.exit(1);
  }
};

seedExtra();
