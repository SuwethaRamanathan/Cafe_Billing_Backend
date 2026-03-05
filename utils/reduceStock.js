// import Grocery from "../models/Grocery.js";

// export async function reduceStock(menuItem, orderedQty) {

//   const ingredientTotals = {};

//   for (const ing of menuItem.recipe) {

//     const groceryId = ing.grocery.toString();

//     const requiredQty = ing.qty * orderedQty;

//     if (!ingredientTotals[groceryId]) {
//       ingredientTotals[groceryId] = 0;
//     }

//     ingredientTotals[groceryId] += requiredQty;
//   }

//   for (const gid in ingredientTotals) {

//     const grocery = await Grocery.findById(gid);

//     if (!grocery) {
//       throw new Error("Grocery not found");
//     }

//     if (grocery.quantity < ingredientTotals[gid]) {
//       throw new Error(`Insufficient raw material: ${grocery.name}`);
//     }
//   }

//   for (const gid in ingredientTotals) {

//     await Grocery.findByIdAndUpdate(
//       gid,
//       {
//         $inc: { quantity: -ingredientTotals[gid] },
//         lastStockUpdatedDate: new Date()
//       }
//     );
//   }

// }

import Grocery from "../models/Grocery.js";

export async function reduceStock(menuItem, orderedQty){

  const ingredientTotals = {};

  for(const ing of menuItem.recipe){

    const gid = ing.grocery.toString();

    const requiredQty = ing.qty * orderedQty;

    if(!ingredientTotals[gid]){
      ingredientTotals[gid] = 0;
    }

    ingredientTotals[gid] += requiredQty;

  }

  for(const gid in ingredientTotals){

    const grocery = await Grocery.findById(gid);

    if(grocery.quantity < ingredientTotals[gid]){
      throw new Error(`Insufficient raw material`);
    }

  }

  for(const gid in ingredientTotals){

    await Grocery.findByIdAndUpdate(
      gid,
      {
        $inc:{ quantity:-ingredientTotals[gid] },
        lastStockUpdatedDate:new Date()
      }
    );

  }

}