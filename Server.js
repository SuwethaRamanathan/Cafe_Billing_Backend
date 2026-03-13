import dotenv from "dotenv";
dotenv.config();
console.log("ENV CHECK:", process.env.ADMIN_EMAIL);

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import menuRoutes from "./routes/menuRoutes.js";
import orderRoutes from "./routes/orderRoutes.js"; 
import auth from "./routes/auth.js";
import categoryRoutes from "./routes/category.js";
import groceryRoutes from "./routes/groceryRoutes.js";
import startRawMaterialScheduler from "./utils/rawMaterialScheduler.js";
import settingsRoutes from "./routes/settingsRoutes.js"
import unitRoutes from "./routes/unitRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
connectDB(); 

// startRawMaterialScheduler();

const app = express();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://cafe-billing-frontend.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
  })
);
app.use(express.json());

// app.use(cors());
// app.use(express.json()); 

app.use("/api/menu", menuRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/auth", auth);
app.use("/api/categories", categoryRoutes);
app.use("/api/groceries", groceryRoutes);
app.use("/api/units", unitRoutes);
app.use("/api/settings", settingsRoutes);

app.use("/api/superadmin", superAdminRoutes);
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});







// let menu = [
//   {
//     _id:"1", name:"Cappuccino", category:"drinks", price:100, stock:20,
//     image:"https://images.unsplash.com/photo-1549492873-115c00bccfbf?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8Y2FwcHVjY2lubyUyMGltYWdlfGVufDB8fDB8fHww"
//   },
//   {
//     _id:"2", name:"Veg Burger", price:120, stock:15, category:"snacks",
//     image:"https://images.unsplash.com/photo-1571091718767-18b5b1457add"
//   },
//   {
//     _id:"3", name:"Veg Pizza", price:160, stock:20, category:"snacks",
//     image : "https://images.unsplash.com/photo-1755005987066-1d0ecf592360?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGl6emFpbWFnZXxlbnwwfHwwfHx8MA%3D%3D"
//   },
//   {
//     _id:"4", name:"Chicken Burger", price:180, stock:25, category:"snacks",
//     image:"https://images.unsplash.com/photo-1550547660-d9450f859349"
//   }
  //   {
  //   _id:"5", name:"Latte", price:100, stock:20, category:"drinks",
  //   image:"https://media.istockphoto.com/id/183138035/photo/cup-of-latte-coffee-and-spoon-on-gray-counter.webp?a=1&b=1&s=612x612&w=0&k=20&c=zhL7nLKd9grMx5v2_pTL1KeV_akb1Y-GeO3W_TleFnE="
  // },
  // {
  //   _id:"6", name:"Veg Sandwich", price:70, stock:15, category:"snacks",
  //   image:"https://images.unsplash.com/photo-1528735602780-2552fd46c7af"
  // },
  // {
  //   _id:"7", name:"Iced Americano", price:100, stock:20, category:"drinks",
  //   image:"https://images.unsplash.com/photo-1581996323441-538096e854b9?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8aWNlZCUyMGFtZXJpY2Fub3xlbnwwfHwwfHx8MA%3D%3D"
  // },
  // {
  //   _id:"8", name:"Chicken Pizza", price:200, stock:15, category:"snacks",
  //   image:"https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Y2hpY2tlbiUyMHBpenphfGVufDB8fDB8fHww"
  // }
// ];

// let orders = [];

// app.get("/api/menu",(req,res)=>{
//   res.send(menu);
// });

// app.post("/api/orders",(req,res)=>{

//   const { items, total } = req.body;

//   items.forEach(cartItem=>{
//     menu = menu.map(m=>{
//       if(m._id === cartItem._id){
//         return {
//           ...m,
//           stock: m.stock - cartItem.qty
//         }
//       }
//       return m;
//     })
//   })

   
//   const order = {
//     id: orders.length+1,
//     items,
//     total,
//     date: new Date()
//   };

//   orders.push(order);

//   res.send({
//     menu,
//     order
//   });
// });

// app.post("/api/admin/menu", async (req, res) => {
//   try {
//     const item = await Menu.create(req.body);
//     res.json(item);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });

// app.get("/api/admin/menu",(req,res)=>{
//   res.send(menu); 
// });

// app.delete("/api/admin/menu/:id", async (req, res) => {

//   try {
//     await Menu.findByIdAndDelete(req.params.id);

//     res.json({ message: "Item deleted successfully" });

//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// });





// const PORT = process.env.PORT ;