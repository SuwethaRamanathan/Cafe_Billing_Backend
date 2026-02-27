import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {
  if (!transporter) {
    if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASS) {
      throw new Error("Email credentials are missing");
    }

    transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASS
      }
    });
  }
  return transporter;
};

export default getTransporter;