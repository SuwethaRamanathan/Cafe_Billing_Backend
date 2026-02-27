import getTransporter from "./mailer.js";

export const sendThresholdMail = async (item) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: ` Low Quantity Alert `,
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:20px;">
      
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background:#2c3e50; padding:20px; text-align:center; color:white;">
          <h2>Cafe & Snacks Billing System</h2>
        </div>

        <div style="padding:30px;">
          <h3 style="color:#333;">Hello Cafe Owner</h3>
          <p style="color:#555; font-size:15px;">
            Your inventory system has detected that the following item is running low in stock.
            Please consider restocking soon to avoid service interruptions.
          </p>

          <div style="background:#fff3cd; padding:15px; border-left:5px solid #ffc107; border-radius:6px; margin-top:20px;">
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Quantity Remaining:</strong> ${item.stock}</p>
          </div>

          <p style="margin-top:25px; font-size:14px; color:#666;">
            This is an automated alert from your Cafe's Billing System.  </p>
            <p>Regards,<br/><b> Billing Management Team, <br/> Cafe & Snacks</b></p>
        </div>

        <div style="background:#f1f1f1; text-align:center; padding:15px; font-size:12px; color:#777;">
          © ${new Date().getFullYear()} SmartCafe Billing | Inventory Management System
        </div>

      </div>
    </div>
    `
  });
};

export const sendOutOfStockMail = async (item) => {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.ADMIN_EMAIL,
    to: process.env.ADMIN_EMAIL,
    subject: ` Out of Stock `,
    html: `
      <div style="font-family: Arial, sans-serif; background-color:#f4f6f9; padding:20px;">
      
      <div style="max-width:600px; margin:auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 4px 10px rgba(0,0,0,0.1);">
        
        <div style="background:#c0392b; padding:20px; text-align:center; color:white;">
          <h2> Critical Stock Alert</h2>
        </div>

        <div style="padding:30px;">
          <h3 style="color:#333;">Hello Cafe Owner </h3>
          
          <p style="color:#555; font-size:15px;">
            The system has detected that the following item is completely out of stock.
            Immediate restocking is required to continue smooth operations.
          </p>

          <div style="background:#f8d7da; padding:15px; border-left:5px solid #dc3545; border-radius:6px; margin-top:20px;">
            <p><strong>Item:</strong> ${item.name}</p>
            <p><strong>Status:</strong> Out of Stock </p>
          </div>

          <p style="margin-top:25px; font-size:14px; color:#666;">
            Please update inventory as soon as possible.
          </p>
        </div>
        <div>
      <p style="margin-top:25px; font-size:14px; color:#666;">
            This is an automated alert from your Cafe's Billing System.  </p>
            <p>Regards,<br/><b> Billing Management Team, <br/> Cafe & Snacks</b></p> </div>
        <div style="background:#f1f1f1; text-align:center; padding:15px; font-size:12px; color:#777;">
          © ${new Date().getFullYear()} SmartCafe Billing | Automated Inventory Monitoring
        </div>

      </div>
    </div>
    `
  });
};