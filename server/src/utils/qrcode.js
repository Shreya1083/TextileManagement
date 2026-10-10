import QRCode from 'qrcode';

/**
 * Generate QR code as data URL
 */
export const generateQRCode = async (data) => {
  try {
    const qrCodeDataURL = await QRCode.toDataURL(data, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      margin: 1,
      width: 300,
    });
    return qrCodeDataURL;
  } catch (error) {
    throw new Error('Failed to generate QR code');
  }
};

/**
 * Generate QR code as buffer
 */
export const generateQRCodeBuffer = async (data) => {
  try {
    const buffer = await QRCode.toBuffer(data, {
      errorCorrectionLevel: 'M',
      type: 'png',
      margin: 1,
      width: 300,
    });
    return buffer;
  } catch (error) {
    throw new Error('Failed to generate QR code buffer');
  }
};

/**
 * Generate fabric roll QR data
 */
export const generateRollQRData = (rollNumber) => {
  return JSON.stringify({
    type: 'FABRIC_ROLL',
    rollNumber,
    timestamp: new Date().toISOString(),
  });
};

/**
 * Generate attendance session QR data
 */
export const generateAttendanceQRData = (sessionCode, shiftId, expiresAt) => {
  return JSON.stringify({
    type: 'ATTENDANCE_SESSION',
    sessionCode,
    shiftId,
    expiresAt,
  });
};
