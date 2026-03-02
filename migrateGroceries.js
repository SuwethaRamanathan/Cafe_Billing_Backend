import mongoose from "mongoose";
import dotenv from "dotenv";
import Grocery from "./models/Grocery.js";

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function migrateGroceries() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Mongo connected");

    const items = await Grocery.find();

    for (let g of items) {
      if (!g.purchaseUnit) {

        const name = g.name.toLowerCase();

        if (name.includes("milk")) {
          g.purchaseUnit = "Litre";
          g.baseUnit = "ml";
          g.conversionFactor = 1000;
          g.quantity = g.quantity * 1000;
        }

        else if (name.includes("sugar")) {
          g.purchaseUnit = "Kilogram";
          g.baseUnit = "g";
          g.conversionFactor = 1000;
          g.quantity = g.quantity * 1000;
        }

        else if (name.includes("coffee")) {
          g.purchaseUnit = "Gram";
          g.baseUnit = "g";
          g.conversionFactor = 1;
        }

        else if (name.includes("bread")) {
          g.purchaseUnit = "Packets";
          g.baseUnit = "piece";
          g.conversionFactor = 1;
        }

        else if (name.includes("flour")) {
          g.purchaseUnit = "Kilogram";
          g.baseUnit = "g";
          g.conversionFactor = 1000;
          g.quantity = g.quantity * 1000;
        }

        else if (name.includes("onion")) {
          g.purchaseUnit = "Kilogram";
          g.baseUnit = "g";
          g.conversionFactor = 1000;
          g.quantity = g.quantity * 1000;
        }

        else if (name.includes("ghee")) {
          g.purchaseUnit = "Gram";
          g.baseUnit = "g";
          g.conversionFactor = 1;
        }

        await g.save();
        console.log("Updated:", g.name);
      }
    }

    console.log(" Grocery migration complete");
    process.exit();

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

migrateGroceries();


// import mongoose from "mongoose";
// import Grocery from "./models/Grocery.js";
// import dotenv from "dotenv";
// dotenv.config();
// const MONGO_URI = process.env.MONGO_URI; 
// // same as server.js

// async function migrateGroceries() {
//   try {
//     await mongoose.connect(MONGO_URI);
//     console.log("Mongo connected");

//     const items = await Grocery.find();

//     for (let g of items) {
//       if (!g.purchaseUnit) {

//         const name = g.name.toLowerCase();

//         if (name.includes("milk")) {
//           g.purchaseUnit = "Litre";
//           g.baseUnit = "ml";
//           g.conversionFactor = 1000;
//           g.quantity = g.quantity * 1000;
//         }

//         else if (name.includes("sugar")) {
//           g.purchaseUnit = "Kilogram";
//           g.baseUnit = "g";
//           g.conversionFactor = 1000;
//           g.quantity = g.quantity * 1000;
//         }

//         else if (name.includes("coffee")) {
//           g.purchaseUnit = "Gram";
//           g.baseUnit = "g";
//           g.conversionFactor = 1;
//         }

//         else if (name.includes("bread")) {
//           g.purchaseUnit = "Packets";
//           g.baseUnit = "piece";
//           g.conversionFactor = 1;
//         }

//         else if (name.includes("flour")) {
//           g.purchaseUnit = "Kilogram";
//           g.baseUnit = "g";
//           g.conversionFactor = 1000;
//           g.quantity = g.quantity * 1000;
//         }

//         else if (name.includes("onion")) {
//           g.purchaseUnit = "Kilogram";
//           g.baseUnit = "g";
//           g.conversionFactor = 1000;
//           g.quantity = g.quantity * 1000;
//         }

//         else if (name.includes("ghee")) {
//           g.purchaseUnit = "Gram";
//           g.baseUnit = "g";
//           g.conversionFactor = 1;
//         }

//         await g.save();
//         console.log("Updated:", g.name);
//       }
//     }

//     console.log("Grocery migration complete");
//     process.exit();

//   } catch (err) {
//     console.error(err);
//     process.exit(1);
//   }
// }

// migrateGroceries();