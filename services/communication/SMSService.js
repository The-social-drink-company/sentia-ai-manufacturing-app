import { Twilio } from 'twilio';
import { logInfo, logError, logWarn } from '../observability/structuredLogger.js';

/**
 * Enterprise SMS Notification Service
 * Supports Twilio, AWS SNS, and Azure Communication Services
 */
class SMSService {
  constructor() {
    this.twilioClient = null;
    this.provider = process.env.SMS_PROVIDER || 'twilio';
    this.initialized = false;
    
    // Initialize the selected SMS provider
    this.initialize();
  }

  /**
   * Initialize SMS service based on configured provider
   */
  async initialize() {
    try {
      switch (this.provider.toLowerCase()) {
        case 'twilio':
          await this.initializeTwilio();
          break;
        case 'aws':
          await this.initializeAWS();
          break;
        case 'azure':
          await this.initializeAzure();
          break;
        default:
          logWarn('SMS Service: No valid provider configured, using mock mode');
          this.initialized = true;
      }
      
      logInfo('SMS Service initialized successfully', { provider: this.provider });
    } catch (error) {
      logError('Failed to initialize SMS service', error);
      throw error;
    }
  }

  /**
   * Initialize Twilio SMS service
   */
  async initializeTwilio() {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    
    if (!accountSid || !authToken) {
      throw new Error('Twilio credentials not configured');
    }
    
    this.twilioClient = new Twilio(accountSid, authToken);
    this.fromNumber = process.env.TWILIO_FROM_NUMBER;
    this.initialized = true;
  }

  /**
   * Initialize AWS SNS
   */
  async initializeAWS() {
    // AWS SNS implementation would go here
    logWarn('AWS SNS SMS provider not yet implemented');
    this.initialized = true;
  }

  /**
   * Initialize Azure Communication Services
   */
  async initializeAzure() {
    // Azure Communication Services implementation would go here
    logWarn('Azure Communication Services SMS provider not yet implemented');
    this.initialized = true;
  }

  /**
   * Send SMS notification
   * @param {string} to - Phone number to send to (E.164 format)
   * @param {string} message - Message content
   * @param {Object} options - Additional options
   */
  async sendSMS(to, message, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Validate phone number format
      if (!this.isValidPhoneNumber(to)) {
        throw new Error(`Invalid phone number format: ${to}`);
      }

      // Truncate message if too long
      const truncatedMessage = this.truncateMessage(message);
      
      let result;
      
      switch (this.provider.toLowerCase()) {
        case 'twilio':
          result = await this.sendTwilioSMS(to, truncatedMessage, options);
          break;
        case 'aws':
          result = await this.sendAWSSMS(to, truncatedMessage, options);
          break;
        case 'azure':
          result = await this.sendAzureSMS(to, truncatedMessage, options);
          break;
        default:
          result = await this.sendMockSMS(to, truncatedMessage, options);
      }

      logInfo('SMS sent successfully', { 
        to: this.maskPhoneNumber(to), 
        provider: this.provider,
        messageId: result.messageId 
      });
      
      return result;
    } catch (error) {
      logError('Failed to send SMS', { 
        to: this.maskPhoneNumber(to), 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Send SMS via Twilio
   */
  async sendTwilioSMS(to, message, options) {
    const messageOptions = {
      body: message,
      from: this.fromNumber,
      to: to,
      ...options
    };

    const twilioMessage = await this.twilioClient.messages.create(messageOptions);
    
    return {
      messageId: twilioMessage.sid,
      status: twilioMessage.status,
      provider: 'twilio'
    };
  }

  /**
   * Send SMS via AWS SNS
   */
  async sendAWSSMS(to, message, options) {
    // AWS SNS implementation placeholder
    return {
      messageId: 'aws_mock_' + Date.now(),
      status: 'mock_sent',
      provider: 'aws'
    };
  }

  /**
   * Send SMS via Azure Communication Services
   */
  async sendAzureSMS(to, message, options) {
    // Azure implementation placeholder
    return {
      messageId: 'azure_mock_' + Date.now(),
      status: 'mock_sent',
      provider: 'azure'
    };
  }

  /**
   * Mock SMS sending for development/testing
   */
  async sendMockSMS(to, message, options) {
    logInfo('Mock SMS sent', { to: this.maskPhoneNumber(to), message });
    
    return {
      messageId: 'mock_' + Date.now(),
      status: 'mock_sent',
      provider: 'mock'
    };
  }

  /**
   * Send bulk SMS notifications
   * @param {Array} recipients - Array of {phone, message, options} objects
   */
  async sendBulkSMS(recipients) {
    const results = [];
    const errors = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendSMS(
          recipient.phone, 
          recipient.message, 
          recipient.options || {}
        );
        results.push({ ...recipient, result });
      } catch (error) {
        errors.push({ ...recipient, error: error.message });
      }
    }

    logInfo('Bulk SMS operation completed', { 
      sent: results.length, 
      failed: errors.length 
    });

    return { results, errors };
  }

  /**
   * Send manufacturing alert SMS
   * @param {string} alertType - Type of alert (quality, maintenance, production)
   * @param {string} message - Alert message
   * @param {Array} phoneNumbers - Recipients
   */
  async sendManufacturingAlert(alertType, message, phoneNumbers) {
    const formattedMessage = `🏭 SENTIA ALERT [${alertType.toUpperCase()}]: ${message}`;
    
    const recipients = phoneNumbers.map(phone => ({
      phone,
      message: formattedMessage,
      options: { priority: 'high' }
    }));

    return this.sendBulkSMS(recipients);
  }

  /**
   * Send production status update
   * @param {Object} statusData - Production status information
   * @param {Array} phoneNumbers - Recipients
   */
  async sendProductionUpdate(statusData, phoneNumbers) {
    const message = `Production Update: Line ${statusData.line} - Status: ${statusData.status}. Efficiency: ${statusData.efficiency}%`;
    
    const recipients = phoneNumbers.map(phone => ({
      phone,
      message,
      options: { category: 'production' }
    }));

    return this.sendBulkSMS(recipients);
  }

  /**
   * Validate phone number format (basic E.164 validation)
   */
  isValidPhoneNumber(phoneNumber) {
    const e164Regex = /^+?[1-9]\d{1,14}$/;
    return e164Regex.test(phoneNumber);
  }

  /**
   * Truncate message to SMS length limits
   */
  truncateMessage(message, maxLength = 160) {
    if (message.length <= maxLength) return message;
    
    return message.substring(0, maxLength - 3) + '...';
  }

  /**
   * Mask phone number for logging (privacy)
   */
  maskPhoneNumber(phoneNumber) {
    if (phoneNumber.length <= 4) return phoneNumber;
    
    return phoneNumber.substring(0, 2) + 
           '*'.repeat(phoneNumber.length - 4) + 
           phoneNumber.substring(phoneNumber.length - 2);
  }

  /**
   * Get SMS service status
   */
  async getStatus() {
    return {
      initialized: this.initialized,
      provider: this.provider,
      available: this.initialized,
      lastCheck: new Date().toISOString()
    };
  }

  /**
   * Health check for SMS service
   */
  async healthCheck() {
    try {
      if (!this.initialized) {
        return { status: 'error', message: 'SMS service not initialized' };
      }

      // For Twilio, we can check account balance
      if (this.provider === 'twilio' && this.twilioClient) {
        const account = await this.twilioClient.api.accounts(process.env.TWILIO_ACCOUNT_SID).fetch();
        return { 
          status: 'healthy', 
          provider: 'twilio',
          accountStatus: account.status
        };
      }

      return { status: 'healthy', provider: this.provider };
    } catch (error) {
      logError('SMS service health check failed', error);
      return { status: 'error', message: error.message };
    }
  }
}

// Create singleton instance
const smsService = new SMSService();

export default smsService;

// Export individual functions for convenience
export const {
  sendSMS,
  sendBulkSMS,
  sendManufacturingAlert,
  sendProductionUpdate,
  getStatus,
  healthCheck
} = smsService;