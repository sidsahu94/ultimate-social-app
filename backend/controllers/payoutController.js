// backend/controllers/payoutController.js

const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const User = require("../models/User");

exports.create = async (req, res) => {
  let session = null;
  try {
    session = await mongoose.startSession();
    session.startTransaction();
  } catch (_) {
    session = null;
  }
  const sessionOpts = session ? { session } : {};

  try {
    const amount = Number(req.body.amount);
    const { method = "manual", details } = req.body;

    if (!Number.isFinite(amount) || amount < 10) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ message: "Minimum withdrawal is 10 coins" });
    }

    // Atomic balance deduction with balance guard
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user._id, "wallet.balance": { $gte: amount } },
      { $inc: { "wallet.balance": -amount, "wallet.totalSent": amount } },
      { ...sessionOpts, new: true }
    );

    if (!updatedUser) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(400).json({ message: "Insufficient wallet balance" });
    }

    const payoutList = await Payout.create(
      [
        {
          creator: req.user._id,
          amount,
          method,
          note: details || "Withdrawal Request",
          status: "pending"
        }
      ],
      sessionOpts
    );

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    return res.status(201).json(payoutList[0]);
  } catch (err) {
    if (session) {
      try { await session.abortTransaction(); } catch (_) {}
      session.endSession();
    }
    const msg = err.message || "Server error processing payout";
    return res.status(msg.includes("balance") ? 400 : 500).json({ message: msg });
  }
};

exports.list = async (req, res) => {
  try {

    const items =
      await Payout.find()
        .populate(
          "creator",
          "name email avatar wallet"
        )
        .sort({
          createdAt: -1
        });

    res.json(items);

  } catch {

    res.status(500).json({
      message:
        "Server error"
    });
  }
};

exports.markPaid = async (req, res) => {
  try {

    const payout =
      await Payout.findById(
        req.params.id
      );

    if (!payout) {
      return res
        .status(404)
        .json({
          message:
            "Payout not found"
        });
    }

    if (
      payout.status ===
      "paid"
    ) {
      return res
        .status(400)
        .json({
          message:
            "Already paid"
        });
    }

    payout.status = "paid";
    payout.paidAt =
      new Date();

    await payout.save();

    req.app
      .get("io")
      ?.to(
        String(
          payout.creator
        )
      )
      .emit(
        "notification",
        {
          type:
            "system",

          message:
            `Your withdrawal of ${payout.amount} coins has been processed!`
        }
      );

    res.json(payout);

  } catch {

    res.status(500).json({
      message:
        "Server error"
    });
  }
};