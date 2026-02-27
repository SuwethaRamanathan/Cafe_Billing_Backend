import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {

  const { name, email, password, role } = req.body;

  const hash = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hash,
    role
  });

  res.json({ success: true });

});

router.post("/login", async (req, res) => {

  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (!user)
    return res.status(400).json({ msg: "User not found" });

  const match = await bcrypt.compare(password, user.password);

  if (!match)
    return res.status(400).json({ msg: "Wrong password" });

  const token = jwt.sign(
    {
      id: user._id,
      role: user.role
    },
    "SECRET123",
    { expiresIn: "1d" }
  );

  res.json({
    token,
    role: user.role,
    name: user.name
  });

});

export default router;