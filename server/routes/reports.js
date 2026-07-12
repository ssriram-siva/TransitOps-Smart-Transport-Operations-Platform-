const express = require("express");
const mongoose = require("mongoose");
const Vehicle = require("../models/Vehicle");
const Driver = require("../models/Driver");
const Trip = require("../models/Trip");
const Maintenance = require("../models/Maintenance");
const FuelLog = require("../models/FuelLog");
const Expense = require("../models/Expense");
const { protect, authorize } = require("../middleware/auth");

const router = express.Router();

// GET /api/reports/dashboard
router.get("/dashboard", protect, async (req, res, next) => {
  try {
    const [
      totalVehicles,
      vehicleStatus,
      totalDrivers,
      driverStatus,
      tripStatus,
      recentTrips,
      fuelSummary,
      expenseSummary,
      maintenanceCost,
    ] = await Promise.all([
      Vehicle.countDocuments(),
      Vehicle.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Driver.countDocuments(),
      Driver.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Trip.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      Trip.find().sort("-createdAt").limit(5)
        .populate("vehicle", "registrationNumber type")
        .populate("driver", "name"),
      FuelLog.aggregate([
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$totalCost" },
            totalQuantity: { $sum: "$quantity" },
          },
        },
      ]),
      Expense.aggregate([
        { $group: { _id: null, totalAmount: { $sum: "$amount" } } },
      ]),
      Maintenance.aggregate([
        { $match: { status: "completed" } },
        { $group: { _id: null, totalCost: { $sum: "$cost" } } },
      ]),
    ]);

    const vStatusMap = { available: 0, on_trip: 0, in_shop: 0, retired: 0 };
    vehicleStatus.forEach((s) => { vStatusMap[s._id] = s.count; });

    const dStatusMap = { available: 0, on_trip: 0, suspended: 0, off_duty: 0 };
    driverStatus.forEach((s) => { dStatusMap[s._id] = s.count; });

    const tStatusMap = { scheduled: 0, dispatched: 0, in_progress: 0, completed: 0, cancelled: 0 };
    tripStatus.forEach((s) => { tStatusMap[s._id] = s.count; });

    const totalTrips = Object.values(tStatusMap).reduce((a, b) => a + b, 0);
    const activeFleet = vStatusMap.available + vStatusMap.on_trip;
    const utilization = totalVehicles > 0 ? Math.round((activeFleet / totalVehicles) * 100) : 0;

    const fuelTotal = fuelSummary.length > 0 ? fuelSummary[0].totalCost : 0;
    const expenseTotal = expenseSummary.length > 0 ? expenseSummary[0].totalAmount : 0;
    const maintenanceTotal = maintenanceCost.length > 0 ? maintenanceCost[0].totalCost : 0;
    const operatingCost = fuelTotal + expenseTotal + maintenanceTotal;

    const completedTrips = tStatusMap.completed;
    const avgCostPerTrip = completedTrips > 0 ? Math.round(operatingCost / completedTrips) : 0;

    res.status(200).json({
      success: true,
      dashboard: {
        vehicles: { total: totalVehicles, ...vStatusMap, utilization },
        drivers: { total: totalDrivers, ...dStatusMap },
        trips: { total: totalTrips, ...tStatusMap },
        costs: {
          fuel: fuelTotal,
          expenses: expenseTotal,
          maintenance: maintenanceTotal,
          totalOperating: operatingCost,
          avgCostPerTrip,
        },
        recentTrips,
      },
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/fleet-utilization
router.get("/fleet-utilization", protect, async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const monthlyTrips = await Trip.aggregate([
      { $match: { createdAt: { $gte: startDate } } },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          totalTrips: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          revenue: { $sum: { $ifNull: ["$tripCost", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const totalVehicles = await Vehicle.countDocuments();

    const utilization = monthlyTrips.map((m) => ({
      month: monthNames[m._id.month - 1],
      trips: m.totalTrips,
      completed: m.completed,
      revenue: m.revenue,
      utilization: totalVehicles > 0 ? Math.round((m.completed / totalVehicles) * 100) : 0,
    }));

    res.status(200).json({ success: true, utilization });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/fuel-efficiency
router.get("/fuel-efficiency", protect, async (req, res, next) => {
  try {
    const efficiency = await FuelLog.aggregate([
      {
        $lookup: {
          from: "vehicles",
          localField: "vehicle",
          foreignField: "_id",
          as: "vehicleData",
        },
      },
      { $unwind: "$vehicleData" },
      {
        $group: {
          _id: "$vehicle",
          registrationNumber: { $first: "$vehicleData.registrationNumber" },
          make: { $first: "$vehicleData.make" },
          model: { $first: "$vehicleData.model" },
          totalFuel: { $sum: "$quantity" },
          totalCost: { $sum: "$totalCost" },
          fillUps: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "trips",
          let: { vehicleId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$vehicle", "$$vehicleId"] }, status: "completed" } },
            { $group: { _id: null, totalDistance: { $sum: { $ifNull: ["$distance", 0] } } } },
          ],
          as: "tripData",
        },
      },
      {
        $addFields: {
          totalDistance: { $ifNull: [{ $arrayElemAt: ["$tripData.totalDistance", 0] }, 0] },
          kmPerLiter: {
            $cond: [
              { $gt: ["$totalFuel", 0] },
              { $round: [{ $divide: [{ $ifNull: [{ $arrayElemAt: ["$tripData.totalDistance", 0] }, 0] }, "$totalFuel"] }, 1] },
              0,
            ],
          },
          costPerKm: {
            $cond: [
              { $gt: [{ $ifNull: [{ $arrayElemAt: ["$tripData.totalDistance", 0] }, 0] }, 0] },
              {
                $round: [
                  { $divide: ["$totalCost", { $ifNull: [{ $arrayElemAt: ["$tripData.totalDistance", 0] }, 0] }] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
      { $sort: { kmPerLiter: -1 } },
    ]);

    res.status(200).json({ success: true, efficiency });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/operational-cost
router.get("/operational-cost", protect, async (req, res, next) => {
  try {
    const { months = 6 } = req.query;
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - parseInt(months));

    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const [fuelByMonth, expenseByMonth, maintenanceByMonth, tripRevenue] = await Promise.all([
      FuelLog.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: { month: { $month: "$date" }, year: { $year: "$date" } },
            total: { $sum: "$totalCost" },
          },
        },
      ]),
      Expense.aggregate([
        { $match: { date: { $gte: startDate } } },
        {
          $group: {
            _id: { month: { $month: "$date" }, year: { $year: "$date" } },
            total: { $sum: "$amount" },
          },
        },
      ]),
      Maintenance.aggregate([
        { $match: { completedDate: { $gte: startDate }, status: "completed" } },
        {
          $group: {
            _id: { month: { $month: "$completedDate" }, year: { $year: "$completedDate" } },
            total: { $sum: { $ifNull: ["$cost", 0] } },
          },
        },
      ]),
      Trip.aggregate([
        { $match: { createdAt: { $gte: startDate }, status: "completed" } },
        {
          $group: {
            _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
            revenue: { $sum: { $ifNull: ["$tripCost", 0] } },
            trips: { $sum: 1 },
          },
        },
      ]),
    ]);

    const monthlyMap = {};

    fuelByMonth.forEach((f) => {
      const key = `${f._id.year}-${f._id.month}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: monthNames[f._id.month - 1], fuel: 0, expense: 0, maintenance: 0, revenue: 0, trips: 0 };
      monthlyMap[key].fuel = f.total;
    });

    expenseByMonth.forEach((e) => {
      const key = `${e._id.year}-${e._id.month}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: monthNames[e._id.month - 1], fuel: 0, expense: 0, maintenance: 0, revenue: 0, trips: 0 };
      monthlyMap[key].expense = e.total;
    });

    maintenanceByMonth.forEach((m) => {
      const key = `${m._id.year}-${m._id.month}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: monthNames[m._id.month - 1], fuel: 0, expense: 0, maintenance: 0, revenue: 0, trips: 0 };
      monthlyMap[key].maintenance = m.total;
    });

    tripRevenue.forEach((t) => {
      const key = `${t._id.year}-${t._id.month}`;
      if (!monthlyMap[key]) monthlyMap[key] = { month: monthNames[t._id.month - 1], fuel: 0, expense: 0, maintenance: 0, revenue: 0, trips: 0 };
      monthlyMap[key].revenue = t.revenue;
      monthlyMap[key].trips = t.trips;
    });

    const monthlyData = Object.values(monthlyMap).map((m) => ({
      ...m,
      totalCost: m.fuel + m.expense + m.maintenance,
      profit: m.revenue - (m.fuel + m.expense + m.maintenance),
    }));

    res.status(200).json({ success: true, monthlyData });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/vehicle-roi
router.get("/vehicle-roi", protect, async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find().select("registrationNumber make model year type");

    const roi = await Promise.all(
      vehicles.map(async (v) => {
        const [tripData, fuelCost, expenseCost, maintenanceCost] = await Promise.all([
          Trip.aggregate([
            { $match: { vehicle: v._id, status: "completed" } },
            {
              $group: {
                _id: null,
                totalTrips: { $sum: 1 },
                totalRevenue: { $sum: { $ifNull: ["$tripCost", 0] } },
                totalDistance: { $sum: { $ifNull: ["$distance", 0] } },
              },
            },
          ]),
          FuelLog.aggregate([
            { $match: { vehicle: v._id } },
            { $group: { _id: null, total: { $sum: "$totalCost" } } },
          ]),
          Expense.aggregate([
            { $match: { vehicle: v._id } },
            { $group: { _id: null, total: { $sum: "$amount" } } },
          ]),
          Maintenance.aggregate([
            { $match: { vehicle: v._id, status: "completed" } },
            { $group: { _id: null, total: { $sum: { $ifNull: ["$cost", 0] } } } },
          ]),
        ]);

        const revenue = tripData.length > 0 ? tripData[0].totalRevenue : 0;
        const trips = tripData.length > 0 ? tripData[0].totalTrips : 0;
        const distance = tripData.length > 0 ? tripData[0].totalDistance : 0;
        const fuel = fuelCost.length > 0 ? fuelCost[0].total : 0;
        const expenses = expenseCost.length > 0 ? expenseCost[0].total : 0;
        const maintenance = maintenanceCost.length > 0 ? maintenanceCost[0].total : 0;
        const totalCost = fuel + expenses + maintenance;
        const profit = revenue - totalCost;
        const roiPercent = totalCost > 0 ? Math.round((profit / totalCost) * 100) : 0;

        return {
          vehicle: {
            _id: v._id,
            registrationNumber: v.registrationNumber,
            make: v.make,
            model: v.model,
            year: v.year,
            type: v.type,
          },
          trips,
          revenue,
          totalCost,
          profit,
          roiPercent,
          distance,
          fuelCost: fuel,
          expenseCost: expenses,
          maintenanceCost: maintenance,
        };
      })
    );

    roi.sort((a, b) => b.roiPercent - a.roiPercent);

    res.status(200).json({ success: true, roi });
  } catch (error) {
    next(error);
  }
});

// GET /api/reports/csv/:type
router.get("/csv/:type", protect, async (req, res, next) => {
  try {
    const { type } = req.params;
    const { startDate, endDate } = req.query;
    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    let csvData = [];
    let filename = "";

    if (type === "fuel") {
      const filter = {};
      if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;
      const logs = await FuelLog.find(filter)
        .populate("vehicle", "registrationNumber")
        .populate("driver", "name")
        .sort("-date");

      filename = "fuel_logs.csv";
      csvData = [["Date", "Vehicle", "Driver", "Fuel Type", "Quantity", "Cost/Unit", "Total Cost", "Station"]];
      logs.forEach((l) => {
        csvData.push([
          new Date(l.date).toLocaleDateString("en-IN"),
          l.vehicle?.registrationNumber || "",
          l.driver?.name || "",
          l.fuelType,
          l.quantity,
          l.costPerUnit,
          l.totalCost,
          l.fuelStation || "",
        ]);
      });
    } else if (type === "expenses") {
      const filter = {};
      if (Object.keys(dateFilter).length > 0) filter.date = dateFilter;
      const expenses = await Expense.find(filter)
        .populate("vehicle", "registrationNumber")
        .populate("driver", "name")
        .sort("-date");

      filename = "expenses.csv";
      csvData = [["Date", "Vehicle", "Driver", "Category", "Description", "Amount", "Receipt #"]];
      expenses.forEach((e) => {
        csvData.push([
          new Date(e.date).toLocaleDateString("en-IN"),
          e.vehicle?.registrationNumber || "",
          e.driver?.name || "",
          e.category,
          e.description,
          e.amount,
          e.receiptNumber || "",
        ]);
      });
    } else if (type === "trips") {
      const filter = {};
      if (Object.keys(dateFilter).length > 0) filter.createdAt = dateFilter;
      const trips = await Trip.find(filter)
        .populate("vehicle", "registrationNumber")
        .populate("driver", "name")
        .sort("-createdAt");

      filename = "trips.csv";
      csvData = [["Date", "Origin", "Destination", "Vehicle", "Driver", "Status", "Distance", "Cost"]];
      trips.forEach((t) => {
        csvData.push([
          new Date(t.createdAt).toLocaleDateString("en-IN"),
          t.origin,
          t.destination,
          t.vehicle?.registrationNumber || "",
          t.driver?.name || "",
          t.status,
          t.distance || "",
          t.tripCost || "",
        ]);
      });
    } else if (type === "maintenance") {
      const filter = {};
      if (Object.keys(dateFilter).length > 0) filter.scheduledDate = dateFilter;
      const records = await Maintenance.find(filter)
        .populate("vehicle", "registrationNumber")
        .sort("-scheduledDate");

      filename = "maintenance.csv";
      csvData = [["Date", "Vehicle", "Type", "Description", "Status", "Cost", "Shop"]];
      records.forEach((m) => {
        csvData.push([
          new Date(m.scheduledDate).toLocaleDateString("en-IN"),
          m.vehicle?.registrationNumber || "",
          m.type,
          m.description,
          m.status,
          m.cost || "",
          m.shop || "",
        ]);
      });
    } else if (type === "vehicles") {
      const vehicles = await Vehicle.find().sort("-createdAt");
      filename = "vehicles.csv";
      csvData = [["Reg #", "Type", "Make", "Model", "Year", "Capacity", "Fuel", "Status"]];
      vehicles.forEach((v) => {
        csvData.push([v.registrationNumber, v.type, v.make, v.model, v.year, `${v.capacityValue} ${v.capacityUnit}`, v.fuelType, v.status]);
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid export type" });
    }

    const csv = csvData.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
    res.status(200).send(csv);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
