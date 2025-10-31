const QRCode = require('qrcode');
const crypto = require('crypto');

// Generate QR code for visitor pass
const generatePassQR = async (passData) => {
  try {
    // Create a unique token for the pass
    const token = crypto.randomBytes(32).toString('hex');

    // QR code data payload
    const qrData = {
      passId: passData._id,
      visitorId: passData.visitorId,
      passNumber: passData.passNumber,
      token: token,
      issuedAt: passData.issuedAt,
      expiresAt: passData.expiresAt
    };

    // Generate QR code as base64 string
    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    return {
      qrCode: qrCodeDataURL,
      token: token
    };
  } catch (error) {
    console.error('QR code generation error:', error);
    throw new Error('Failed to generate QR code');
  }
};

// Verify QR code token
const verifyQRToken = (qrData, token) => {
  try {
    const parsedData = JSON.parse(qrData);
    return parsedData.token === token;
  } catch (error) {
    console.error('QR token verification error:', error);
    return false;
  }
};

// Generate QR code for check-in/check-out
const generateCheckInQR = async (visitorId, type = 'check_in') => {
  try {
    const qrData = {
      visitorId: visitorId,
      type: type,
      timestamp: new Date().toISOString(),
      sessionId: crypto.randomBytes(16).toString('hex')
    };

    const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1
    });

    return {
      qrCode: qrCodeDataURL,
      sessionData: qrData
    };
  } catch (error) {
    console.error('Check-in QR generation error:', error);
    throw new Error('Failed to generate check-in QR code');
  }
};

module.exports = {
  generatePassQR,
  verifyQRToken,
  generateCheckInQR
};
