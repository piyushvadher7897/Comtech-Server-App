const nodemailer = require("nodemailer");

// Configure your email transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "201260116015setiit@gmail.com",
    pass: "mfmu wsig igrw kxpd", // Use App Password if 2FA is enabled
  },
});

// Send email
function sendEmail(subject, message) {
  const mailOptions = {
    from: '201260116015setiit@gmail.com',
    to: "harsh.s@dharveeinfotech.com",
    subject: subject,
    text: message
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error("❌ Error sending email:", error.message);
    }
    console.log("📧 Email sent:", info.response);
  });
}

module.exports= {sendEmail}