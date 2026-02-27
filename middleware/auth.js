import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {

  const header = req.headers.authorization;

  if (!header)
    return res.status(401).json({ msg: "No token" });

  const token = header.split(" ")[1];

    const data = jwt.verify(token, "SECRET123");

    req.user = data;

    next();
};

export const isAdmin = (req, res, next) => {

  if (req.user.role !== "admin")
    return res.status(403).json({ msg: "Admin only" });

  next();
};