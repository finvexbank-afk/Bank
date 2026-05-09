/**
 * emailService.js
 * Handles all email notifications for Finvex Bank.
 * Uses @emailjs/browser for client-side email sending.
 * 
 * TO ACTIVATE: Replace YOUR_SERVICE_ID and YOUR_PUBLIC_KEY below
 * with your actual EmailJS credentials from https://emailjs.com
 */

const SERVICE_ID = "YOUR_SERVICE_ID";
const PUBLIC_KEY = "YOUR_PUBLIC_KEY";

// Helper to send email silently (never crashes the app)
const send = async (templateId, params) => {
    try {
        const emailjs = (await import('@emailjs/browser')).default;
        await emailjs.send(SERVICE_ID, templateId, params, PUBLIC_KEY);
        return true;
    } catch (err) {
        // In development or if keys not set, just log silently
        console.log(`[EmailService] Template "${templateId}" not sent. Configure EmailJS keys to activate.`);
        return false;
    }
};

export const sendWelcomeEmail = async (userData) => {
    return send("welcome_template", {
        to_email: userData.email,
        user_name: userData.name,
        account_type: userData.accountType,
        account_number: userData.accountNumber || 'N/A',
        country: userData.country,
        open_date: new Date().toLocaleString(),
    });
};

export const sendVerificationEmail = async (userData) => {
    return send("verify_template", {
        to_email: userData.email,
        user_name: userData.name,
    });
};

export const sendAdminKYCAlert = async (userData) => {
    return send("admin_kyc_template", {
        user_name: userData.name,
        user_uid: userData.uid,
    });
};

export const sendKYCStatusUpdate = async (userData, status, subject, message) => {
    return send("kyc_status_template", {
        to_email: userData.email,
        user_name: userData.name,
        status: status,
        subject: subject,
        message: message,
    });
};

export const sendCreditNotification = async (userData, transactionData) => {
    return send("credit_template", {
        to_email: userData.email,
        user_name: userData.name,
        amount: transactionData.amount,
        reference: transactionData.id,
    });
};

export const sendOTPNotification = async (user, otpCode) => {
    return send("otp_template", {
        to_email: user.email,
        user_name: user.name,
        otp: otpCode,
    });
};

export const sendTransferHoldNotification = async (user, transactionData) => {
    return send("hold_template", {
        to_email: user.email,
        user_name: user.name,
        amount: transactionData.amount,
        beneficiary: transactionData.to,
    });
};

export const sendAdminDormantAlert = async (userData) => {
    return send("dormant_template", {
        user_name: userData.name,
        user_email: userData.email,
    });
};

export const sendTransferRequestConfirmation = async (user, transactionData) => {
    return send("transfer_confirm_template", {
        to_email: user.email,
        user_name: user.name,
        amount: transactionData.amount,
        beneficiary: transactionData.to,
        reference: transactionData.id,
    });
};

export const sendAdminTransferNotification = async (user, transactionData) => {
    return send("admin_transfer_template", {
        user_name: user.name,
        user_email: user.email,
        amount: transactionData.amount,
    });
};
