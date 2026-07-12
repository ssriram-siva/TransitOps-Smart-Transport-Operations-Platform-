const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");
const { Server } = require("socket.io");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const { setIO } = require("./utils/socket");
const healthRoutes = require("./routes/health");
const authRoutes = require("./routes/auth");
const vehicleRoutes = require("./routes/vehicles");
const driverRoutes = require("./routes/drivers");
const tripRoutes = require("./routes/trips");
const maintenanceRoutes = require("./routes/maintenance");
const fuelRoutes = require("./routes/fuel");
const expenseRoutes = require("./routes/expenses");
const reportRoutes = require("./routes/reports");
const trackingRoutes = require("./routes/tracking");

dotenv.config({ path: __dirname + "/../.env" });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
  },
});

setIO(io);

connectDB();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);
app.use("/api/drivers", driverRoutes);
app.use("/api/trips", tripRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/fuel", fuelRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/tracking", trackingRoutes);

app.use(errorHandler);

io.on("connection", (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on("join:tracking", () => {
    socket.join("tracking");
  });

  socket.on("join:dashboard", () => {
    socket.join("dashboard");
  });

  socket.on("join:trips", () => {
    socket.join("trips");
  });

  socket.on("vehicle:location:update", (data) => {
    io.to("tracking").emit("vehicle:location", data);
  });

  socket.on("disconnect", () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

server.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
