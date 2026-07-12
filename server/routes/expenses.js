const express = require("express");
const { body, validationResult } = require("express-validator");
const Expense = require("../models/Expense");
const { protect, authorize } = require("../middleware/auth");
const { getIO } = require("../utils/socket");

const router = express.Router();

const validate = (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ success: false, message: errors.array()[0].msg });
    return false;
  }
  return true;
};

// GET /api/expenses
router.get("/", protect, async (req, res, next) => {
  try {
    const { category, search, vehicle, startDate, endDate } = req.query;
    const filter = {};

    if (category && category !== "all") filter.category = category;
    if (vehicle) filter.vehicle = vehicle;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    if (search) {
      filter.$or = [
        { description: { $regex: search, $options: "i" } },
        { receiptNumber: { $regex: search, $options: "i" } },
      ];
    }

    const expenses = await Expense.find(filter)
      .populate("vehicle", "registrationNumber type make model")
      .populate("driver", "name")
      .sort("-date");

    const summary = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const byCategory = await Expense.aggregate([
      { $match: filter },
      {
        $group: {
          _id: "$category",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const monthSummary = await Expense.aggregate([
      {
        $match: {
          ...filter,
          date: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      },
      {
        $group: {
          _id: null,
          monthAmount: { $sum: "$amount" },
        },
      },
    ]);

    const categoryMap = {};
    byCategory.forEach((c) => {
      categoryMap[c._id] = { amount: c.totalAmount, count: c.count };
    });

    res.status(200).json({
      success: true,
      count: expenses.length,
      summary: {
        total: expenses.length,
        totalAmount: summary.length > 0 ? summary[0].totalAmount : 0,
        monthAmount: monthSummary.length > 0 ? monthSummary[0].monthAmount : 0,
        byCategory: categoryMap,
      },
      expenses,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/expenses/:id
router.get("/:id", protect, async (req, res, next) => {
  try {
    const expense = await Expense.findById(req.params.id)
      .populate("vehicle", "registrationNumber type make model")
      .populate("driver", "name phone");
    if (!expense) {
      return res.status(404).json({ success: false, message: "Expense not found" });
    }
    res.status(200).json({ success: true, expense });
  } catch (error) {
    next(error);
  }
});

// POST /api/expenses
router.post(
  "/",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("vehicle").notEmpty().withMessage("Vehicle is required"),
    body("category")
      .isIn(["toll", "repair", "insurance", "parking", "permit", "fine", "other"])
      .withMessage("Invalid category"),
    body("description")
      .trim()
      .notEmpty()
      .withMessage("Description is required"),
    body("amount").isFloat({ min: 0.01 }).withMessage("Amount must be positive"),
    body("date").isISO8601().withMessage("Valid date is required"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;
      const expense = await Expense.create(req.body);

      const populated = await Expense.findById(expense._id)
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name");

      const io = getIO();
      io.to("dashboard").emit("dashboard:update");

      res.status(201).json({ success: true, expense: populated });
    } catch (error) {
      next(error);
    }
  }
);

// PUT /api/expenses/:id
router.put(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  [
    body("category")
      .optional()
      .isIn(["toll", "repair", "insurance", "parking", "permit", "fine", "other"])
      .withMessage("Invalid category"),
    body("description")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Description cannot be empty"),
    body("amount")
      .optional()
      .isFloat({ min: 0.01 })
      .withMessage("Amount must be positive"),
  ],
  async (req, res, next) => {
    try {
      if (!validate(req, res)) return;

      const expense = await Expense.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })
        .populate("vehicle", "registrationNumber type make model")
        .populate("driver", "name");

      if (!expense) {
        return res.status(404).json({ success: false, message: "Expense not found" });
      }

      res.status(200).json({ success: true, expense });
    } catch (error) {
      next(error);
    }
  }
);

// DELETE /api/expenses/:id
router.delete(
  "/:id",
  protect,
  authorize("admin", "dispatcher"),
  async (req, res, next) => {
    try {
      const expense = await Expense.findByIdAndDelete(req.params.id);
      if (!expense) {
        return res.status(404).json({ success: false, message: "Expense not found" });
      }
      res.status(200).json({ success: true, message: "Expense deleted" });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
