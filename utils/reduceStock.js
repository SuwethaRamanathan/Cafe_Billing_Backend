import Grocery from "../models/Grocery.js";

export async function reduceStock(menuItem, orderedQty) {

  const ingredientTotals = {};

  for (const ing of menuItem.recipe) {

    const groceryId = ing.grocery.toString();

    const requiredQty = ing.qty * orderedQty;

    if (!ingredientTotals[groceryId]) {
      ingredientTotals[groceryId] = 0;
    }

    ingredientTotals[groceryId] += requiredQty;
  }

  // Check stock first
  for (const gid in ingredientTotals) {

    const grocery = await Grocery.findById(gid);

    if (!grocery) {
      throw new Error("Grocery not found");
    }

    if (grocery.quantity < ingredientTotals[gid]) {
      throw new Error(`Insufficient raw material: ${grocery.name}`);
    }
  }

  // Reduce stock
  for (const gid in ingredientTotals) {

    await Grocery.findByIdAndUpdate(
      gid,
      {
        $inc: { quantity: -ingredientTotals[gid] },
        lastStockUpdatedDate: new Date()
      }
    );
  }

}