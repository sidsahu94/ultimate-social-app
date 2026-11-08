// backend/controllers/payoutController.js

const mongoose = require("mongoose");
const Payout = require("../models/Payout");
const User = require("../models/User");

exports.create = async (req, res) => {

  const session =
    await mongoose.startSession();

  try {

    const amount =
      Number(req.body.amount);

    const {
      method = "manual",
      details
    } = req.body;

    if (
      !Number.isFinite(amount) ||
      amount < 10
    ) {
      return res.status(400).json({
        message:
          "Minimum withdrawal is 10 coins"
      });
    }

    let payout;

    await session.withTransaction(
      async () => {

        const user =
          await User.findById(
            req.user._id
          ).session(session);

        if (!user) {
          throw new Error(
            "User not found"
          );
        }

        if (
          user.wallet.balance <
          amount
        ) {
          throw new Error(
            "Insufficient wallet balance"
          );
        }

        user.wallet.balance -= amount;

        await user.save({
          session
        });

        payout =
          await Payout.create(
            [
              {
                creator:
                  req.user._id,

                amount,

                method,

                note:
                  details ||
                  "Withdrawal Request",

                status:
                  "pending"
              }
            ],
            { session }
          );
      }
    );

    return res
      .status(201)
      .json(payout[0]);

  } catch (err) {

    const msg =
      err.message ||
      "Server error processing payout";

    return res
      .status(
        msg.includes("balance")
          ? 400
          : 500
      )
      .json({
        message: msg
      });

  } finally {
    session.endSession();
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