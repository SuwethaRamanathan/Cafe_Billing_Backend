import express from "express";
import Menu from "../models/Menu.js";
import Order from "../models/Order.js";
import Grocery from "../models/Grocery.js";
import {
  sendThresholdMail,
  sendOutOfStockMail
} from "../utils/menuStockAlerts.js";
import { reduceStock } from "../utils/reduceStock.js";

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { items, total } = req.body;

    for (let cartItem of items) {
      const dbItem = await Menu.findById(cartItem._id);
      if (!dbItem || dbItem.stock < cartItem.qty) {
        return res.status(400).json({
          msg: `Insufficient stock for ${dbItem?.name|| "item"}`
        });
      }
    }

    

    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);

    const todayEnd = new Date();
    todayEnd.setHours(23,59,59,999);

    const lastOrder = await Order.findOne({
      orderDate: { $gte: todayStart, $lte: todayEnd }
    }).sort({ orderNumber: -1 });

    const nextOrderNumber = lastOrder
      ? lastOrder.orderNumber + 1
      : 1;

    const order = await Order.create({
      items,
      total,
      orderNumber: nextOrderNumber,
      orderDate: new Date()
    });

    // for (let cartItem of items) {
    //   const item = await Menu.findById(cartItem._id);

    //   item.stock -= cartItem.qty;

    //   if (item.stock < 8 && item.stock > 0 && !item.thresholdAlertSent) {
    //     await sendThresholdMail(item);
    //     item.thresholdAlertSent = true;
    //   }

    //   if (item.stock === 0 && !item.outOfStockAlertSent) {
    //     await sendOutOfStockMail(item);
    //     item.outOfStockAlertSent = true;
    //   }

    //   if (item.stock > 8) {
    //     item.thresholdAlertSent = false;
    //     item.outOfStockAlertSent = false;
    //   }

    //   await item.save();
    // }

    for (let cartItem of items) {
  const menuItem = await Menu.findById(cartItem._id);
  
  menuItem.stock -= cartItem.qty;
  
  await reduceStock(menuItem, cartItem.qty);

  if (menuItem.stock < 8 && menuItem.stock > 0 && !menuItem.thresholdAlertSent) {
    await sendThresholdMail(menuItem);
    menuItem.thresholdAlertSent = true;
  }

  if (menuItem.stock === 0 && !menuItem.outOfStockAlertSent) {
    await sendOutOfStockMail(menuItem);
    menuItem.outOfStockAlertSent = true;
  }

  if (menuItem.stock > 8) {
    menuItem.thresholdAlertSent = false;
    menuItem.outOfStockAlertSent = false;
  }

  await menuItem.save();
}
   
//     for (let cartItem of items) {
//   const menuItem = await Menu.findById(cartItem._id);
//   await reduceStock(menuItem, cartItem.qty);
// }


    res.json({
      success: true,
      orderNumber: nextOrderNumber,
      order
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

router.get("/", async (req, res) => {
  const orders = await Order.find().sort({ orderDate: 1 });
  res.json(orders);
});

export default router;