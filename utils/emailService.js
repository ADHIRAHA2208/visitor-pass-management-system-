const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    service: 'gmail', // or your email service
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send visitor registration notification
const sendVisitorRegistrationNotification = async (visitorData, hostData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: hostData.email,
      subject: 'New Visitor Registration - Action Required',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Visitor Registration</h2>
          <p>Dear ${hostData.name},</p>
          <p>A new visitor has registered and requires your approval:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Visitor Details:</h3>
            <p><strong>Name:</strong> ${visitorData.name}</p>
            <p><strong>Email:</strong> ${visitorData.email}</p>
            <p><strong>Phone:</strong> ${visitorData.phone}</p>
            <p><strong>Company:</strong> ${visitorData.company || 'N/A'}</p>
            <p><strong>Purpose:</strong> ${visitorData.purpose}</p>
            <p><strong>Expected Arrival:</strong> ${new Date(visitorData.expectedArrival).toLocaleString()}</p>
            <p><strong>Expected Departure:</strong> ${new Date(visitorData.expectedDeparture).toLocaleString()}</p>
          </div>

          <p>Please log in to the system to approve or reject this visitor registration.</p>

          <div style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login"
               style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Login to System
            </a>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated message from Visitor Pass Management System.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Visitor registration notification sent to host');
  } catch (error) {
    console.error('Error sending visitor registration notification:', error);
    throw error;
  }
};

// Send visitor approval notification
const sendVisitorApprovalNotification = async (visitorData, passData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: visitorData.email,
      subject: 'Visitor Pass Approved - Welcome!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Visitor Pass Approved</h2>
          <p>Dear ${visitorData.name},</p>
          <p>Great news! Your visitor registration has been approved. Here are your pass details:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Pass Details:</h3>
            <p><strong>Pass Number:</strong> ${passData.passNumber}</p>
            <p><strong>Valid From:</strong> ${new Date(passData.validFrom).toLocaleString()}</p>
            <p><strong>Valid To:</strong> ${new Date(passData.validTo).toLocaleString()}</p>
            <p><strong>Access Level:</strong> ${passData.accessLevel}</p>
          </div>

          <p><strong>Important:</strong></p>
          <ul>
            <li>Please arrive on time for your scheduled visit</li>
            <li>Bring a valid ID proof for verification</li>
            <li>Show this email or the QR code on your pass at the reception</li>
            <li>Follow all security protocols during your visit</li>
          </ul>

          <div style="margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/visitor/${visitorData._id}"
               style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              View Your Pass
            </a>
          </div>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated message from Visitor Pass Management System.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Visitor approval notification sent');
  } catch (error) {
    console.error('Error sending visitor approval notification:', error);
    throw error;
  }
};

// Send appointment reminder
const sendAppointmentReminder = async (appointmentData, visitorData, hostData) => {
  try {
    const transporter = createTransporter();

    // Send to visitor
    const visitorMailOptions = {
      from: process.env.EMAIL_USER,
      to: visitorData.email,
      subject: 'Appointment Reminder - Tomorrow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Reminder</h2>
          <p>Dear ${visitorData.name},</p>
          <p>This is a reminder for your upcoming appointment:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Appointment Details:</h3>
            <p><strong>Title:</strong> ${appointmentData.title}</p>
            <p><strong>Date:</strong> ${new Date(appointmentData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentData.startTime} - ${appointmentData.endTime}</p>
            <p><strong>Location:</strong> ${appointmentData.location || 'TBD'}</p>
            <p><strong>Host:</strong> ${hostData.name}</p>
          </div>

          <p>Please arrive 15 minutes early and bring your visitor pass.</p>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated message from Visitor Pass Management System.
          </p>
        </div>
      `
    };

    // Send to host
    const hostMailOptions = {
      from: process.env.EMAIL_USER,
      to: hostData.email,
      subject: 'Appointment Reminder - Tomorrow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Appointment Reminder</h2>
          <p>Dear ${hostData.name},</p>
          <p>This is a reminder for your upcoming appointment:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Appointment Details:</h3>
            <p><strong>Title:</strong> ${appointmentData.title}</p>
            <p><strong>Date:</strong> ${new Date(appointmentData.date).toLocaleDateString()}</p>
            <p><strong>Time:</strong> ${appointmentData.startTime} - ${appointmentData.endTime}</p>
            <p><strong>Location:</strong> ${appointmentData.location || 'TBD'}</p>
            <p><strong>Visitor:</strong> ${visitorData.name} (${visitorData.email})</p>
          </div>

          <p>Please be available to receive your visitor.</p>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated message from Visitor Pass Management System.
          </p>
        </div>
      `
    };

    await Promise.all([
      transporter.sendMail(visitorMailOptions),
      transporter.sendMail(hostMailOptions)
    ]);

    console.log('Appointment reminders sent');
  } catch (error) {
    console.error('Error sending appointment reminder:', error);
    throw error;
  }
};

// Send pass expiry notification
const sendPassExpiryNotification = async (passData, visitorData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: visitorData.email,
      subject: 'Visitor Pass Expiring Soon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Visitor Pass Expiring Soon</h2>
          <p>Dear ${visitorData.name},</p>
          <p>Your visitor pass is expiring soon:</p>

          <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; border-radius: 5px;">
            <h3>Pass Details:</h3>
            <p><strong>Pass Number:</strong> ${passData.passNumber}</p>
            <p><strong>Expires On:</strong> ${new Date(passData.expiresAt).toLocaleString()}</p>
          </div>

          <p>If you need to extend your visit, please contact your host or the reception.</p>

          <p style="margin-top: 30px; color: #666; font-size: 12px;">
            This is an automated message from Visitor Pass Management System.
          </p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log('Pass expiry notification sent');
  } catch (error) {
    console.error('Error sending pass expiry notification:', error);
    throw error;
  }
};

module.exports = {
  sendVisitorRegistrationNotification,
  sendVisitorApprovalNotification,
  sendAppointmentReminder,
  sendPassExpiryNotification
};
