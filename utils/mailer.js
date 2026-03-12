// import nodemailer from "nodemailer";

// let transporter;

// const getTransporter = () => {
//   if (!transporter) {
//     if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASS) {
//       throw new Error("Email credentials are missing");
//     }

//     transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.ADMIN_EMAIL,
//         pass: process.env.ADMIN_EMAIL_PASS
//       }
//     });
//   }
//   return transporter;
// };

// export default getTransporter;

import nodemailer from "nodemailer";

let transporter;

const getTransporter = () => {

  // If email credentials are not provided, skip email system
  if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_EMAIL_PASS) {
    console.log("⚠ Email disabled: credentials missing");
    return null;
  }

  if (!transporter) {
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