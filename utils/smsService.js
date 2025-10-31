const twilio = require('twilio');

// Initialize Twilio client
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

// Send SMS notification for visitor approval
const sendVisitorApprovalSMS = async (visitorData, passData) => {
  try {
    const message = `Visitor Pass Approved! Pass #: ${passData.passNumber}. Valid: ${new Date(passData.validFrom).toLocaleDateString()} - ${new Date(passData.validTo).toLocaleDateString()}. Show QR code at reception.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: visitorData.phone
    });

    console.log('Visitor approval SMS sent');
  } catch (error) {
    console.error('Error sending visitor approval SMS:', error);
    throw error;
  }
};

// Send SMS notification for check-in confirmation
const sendCheckInConfirmationSMS = async (visitorData, checkLogData) => {
  try {
    const message = `Check-in confirmed at ${new Date(checkLogData.timestamp).toLocaleString()}. Welcome to our premises! Please follow security protocols.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: visitorData.phone
    });

    console.log('Check-in confirmation SMS sent');
  } catch (error) {
    console.error('Error sending check-in confirmation SMS:', error);
    throw error;
  }
};

// Send SMS notification for check-out confirmation
const sendCheckOutConfirmationSMS = async (visitorData, checkLogData) => {
  try {
    const message = `Check-out confirmed at ${new Date(checkLogData.timestamp).toLocaleString()}. Thank you for visiting! Have a safe journey.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: visitorData.phone
    });

    console.log('Check-out confirmation SMS sent');
  } catch (error) {
    console.error('Error sending check-out confirmation SMS:', error);
    throw error;
  }
};

// Send SMS reminder for appointment
const sendAppointmentReminderSMS = async (visitorData, appointmentData) => {
  try {
    const message = `Appointment reminder: ${appointmentData.title} on ${new Date(appointmentData.date).toLocaleDateString()} at ${appointmentData.startTime}. Please arrive on time.`;

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: visitorData.phone
    });

    console.log('Appointment reminder SMS sent');
  } catch (error) {
    console.error('Error sending appointment reminder SMS:', error);
    throw error;
  }
};

// Send emergency alert SMS
const sendEmergencyAlertSMS = async (phoneNumber, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber
    });

    console.log('Emergency alert SMS sent');
  } catch (error) {
    console.error('Error sending emergency alert SMS:', error);
    throw error;
  }
};

module.exports = {
  sendVisitorApprovalSMS,
  sendCheckInConfirmationSMS,
  sendCheckOutConfirmationSMS,
  sendAppointmentReminderSMS,
  sendEmergencyAlertSMS
};
