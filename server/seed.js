const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("./models/User");

dotenv.config({ path: __dirname + "/../.env" });

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected for seeding...");

    const existingAdmin = await User.findOne({ email: "admin@transitops.com" });
    if (existingAdmin) {
      console.log("Admin user already exists. Skipping...");
      process.exit(0);
    }

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

    const viewer = await User.create({
      name: "Guest Viewer",
      email: "viewer@transitops.com",
      password: "viewer123",
      role: "viewer",
      phone: "+91-9876543212",
    });

    console.log("Seed users created:");
    console.log(`  Admin:      admin@transitops.com / admin123`);
    console.log(`  Dispatcher: dispatcher@transitops.com / dispatcher123`);
    console.log(`  Viewer:     viewer@transitops.com / viewer123`);

    process.exit(0);
  } catch (error) {
    console.error("Seed error:", error.message);
    process.exit(1);
  }
};

seedAdmin();
