import cron from "node-cron";
import Grocery from "../models/Grocery.js";
import getTransporter from "./mailer.js";

const startRawMaterialScheduler = () => {
  cron.schedule("20 12 * * *", async () => {
    try {
      console.log(" Sending daily raw material report...");

      const groceries = await Grocery.find().populate("unit");
      if (!groceries.length) return;

      const htmlRows = groceries.map(item => `
  <tr>
    <td style="padding:10px; border-bottom:1px solid #ddd;">${item.name?.en || ""}</td>
    <td style="padding:10px; border-bottom:1px solid #ddd;">${item.unit?.displayUnit || ""}</td>
    <td style="padding:10px; border-bottom:1px solid #ddd;"><b>${item.quantity}</b></td>
  </tr>
`).join("");

      const transporter = getTransporter();

      await transporter.sendMail({
        from: process.env.ADMIN_EMAIL,
        to: process.env.ADMIN_EMAIL,
        subject: " Daily Raw Material Stock Report",
        html: `
        <div style="font-family: Arial, sans-serif; background:#eef2f7; padding:20px;">
    <div style="max-width:650px; margin:auto; background:white; border-radius:10px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">

      <div style="background:#1976d2; color:white; padding:20px; text-align:center;">
        <h2> Daily Raw Material Stock Report</h2>
        <p style="margin:0;">Inventory Summary for ${new Date().toDateString()}</p>
      </div>

      <div style="padding:25px;">
        <p>Hello <b>Cafe & Snacks' Owner</b>,</p>
        <p>Here is your daily stock summary:</p>

        <table width="100%" cellspacing="0" cellpadding="0" style="margin-top:15px; border-collapse:collapse;">
          <thead>
            <tr style="background:#f5f5f5;">
              <th style="padding:10px; text-align:left;">Item</th>
              <th style="padding:10px; text-align:left;">Unit</th>
              <th style="padding:10px; text-align:left;">Available Quantity</th>
            </tr>
          </thead>
          <tbody>
            ${htmlRows}
          </tbody>
        </table>

        <p style="margin-top:20px;">This is an automated daily report from your Cafe's Billing System.</p>

        <p>Regards,<br/><b> Billing Management Team, <br/> Cafe & Snacks</b></p>
      </div>

      <div style="background:#f1f1f1; padding:15px; text-align:center; font-size:12px; color:#777;">
        © 2026 Cafe Billing System | Smart Inventory Monitoring
      </div>

    </div>
  </div>
           `
      });

      console.log(" Raw material mail sent");
    } catch (err) {
      console.error(" Mail failed:", err.message);
    }
  });
};

export default startRawMaterialScheduler;