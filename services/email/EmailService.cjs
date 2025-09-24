const axios = require('axios');
const { logger } = require('../loggerWrapper.cjs');

/**
 * Microsoft Graph API Email Service
 * Handles email notifications using Microsoft Graph API
 */
class EmailService {
  constructor() {
    this.clientId = process.env.MICROSOFT_EMAIL_CLIENT_ID;
    this.clientSecret = process.env.MICROSOFT_EMAIL_CLIENT_SECRET;
    this.tenantId = process.env.MICROSOFT_EMAIL_TENANT_ID || 'common';
    this.scope = process.env.MICROSOFT_EMAIL_SCOPE || 'https://graph.microsoft.com/.default';
    this.adminEmail = process.env.ADMIN_EMAIL || 'admin@app.sentiaspirits.com';
    this.dataEmail = process.env.DATA_EMAIL || 'data@app.sentiaspirits.com';
    
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  /**
   * Get access token for Microsoft Graph API
   */
  async getAccessToken() {
    try {
      // Check if we have a valid token
      if (this.accessToken && this.tokenExpiry && new Date() < this.tokenExpiry) {
        return this.accessToken;
      }

      const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;
      
      const params = new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        scope: this.scope,
        grant_type: 'client_credentials'
      });

      const response = await axios.post(tokenUrl, params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      this.accessToken = response.data.access_token;
      // Set expiry time (subtract 5 minutes for safety)
      this.tokenExpiry = new Date(Date.now() + (response.data.expires_in - 300) * 1000);
      
      logger.info('Successfully obtained Microsoft Graph access token');
      return this.accessToken;
    } catch (error) {
      logger.error('Failed to obtain Microsoft Graph access token:', error.response?.data || error.message);
      throw new Error('Failed to authenticate with Microsoft Graph API');
    }
  }

  /**
   * Send email using Microsoft Graph API
   * @param {Object} emailData - Email configuration
   * @param {string} emailData.to - Recipient email address
   * @param {string} emailData.subject - Email subject
   * @param {string} emailData.body - Email body (HTML or text)
   * @param {string} emailData.from - Sender email address (optional, defaults to admin email)
   * @param {boolean} emailData.isHtml - Whether body is HTML (default: true)
   * @param {Array} emailData.attachments - Array of attachment objects (optional)
   */
  async sendEmail(emailData) {
    try {
      const accessToken = await this.getAccessToken();
      const fromEmail = emailData.from || this.adminEmail;
      
      // Prepare the email message
      const message = {
        message: {
          subject: emailData.subject,
          body: {
            contentType: emailData.isHtml !== false ? 'HTML' : 'Text',
            content: emailData.body
          },
          toRecipients: [
            {
              emailAddress: {
                address: emailData.to
              }
            }
          ],
          from: {
            emailAddress: {
              address: fromEmail
            }
          }
        }
      };

      // Add attachments if provided
      if (emailData.attachments && emailData.attachments.length > 0) {
        message.message.attachments = emailData.attachments.map(attachment => ({
          '@odata.type': '#microsoft.graph.fileAttachment',
          name: attachment.name,
          contentType: attachment.contentType || 'application/octet-stream',
          contentBytes: attachment.contentBytes
        }));
      }

      const graphUrl = `https://graph.microsoft.com/v1.0/users/${fromEmail}/sendMail`;
      
      const response = await axios.post(graphUrl, message, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      logger.info(`Email sent successfully to ${emailData.to}`);
      return { success: true, messageId: response.data.id };
    } catch (error) {
      logger.error('Failed to send email:', error.response?.data || error.message);
      throw new Error(`Failed to send email: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Send admin notification email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {Array} attachments - Optional attachments
   */
  async sendAdminNotification(subject, body, attachments = []) {
    return this.sendEmail({
      to: this.adminEmail,
      subject: `[Sentia Dashboard] ${subject}`,
      body: this.formatAdminEmailBody(body),
      isHtml: true,
      attachments
    });
  }

  /**
   * Send data upload notification email
   * @param {string} subject - Email subject
   * @param {string} body - Email body
   * @param {Array} attachments - Optional attachments
   */
  async sendDataUploadNotification(subject, body, attachments = []) {
    return this.sendEmail({
      to: this.dataEmail,
      from: this.dataEmail,
      subject: `[Data Upload] ${subject}`,
      body: this.formatDataEmailBody(body),
      isHtml: true,
      attachments
    });
  }

  /**
   * Send system alert email to admin
   * @param {string} alertType - Type of alert (error, warning, info)
   * @param {string} message - Alert message
   * @param {Object} context - Additional context data
   */
  async sendSystemAlert(alertType, message, context = {}) {
    const subject = `System ${alertType.toUpperCase()}: ${message}`;
    const body = this.formatSystemAlertBody(alertType, message, context);
    
    return this.sendAdminNotification(subject, body);
  }

  /**
   * Send data processing notification
   * @param {string} processType - Type of data processing
   * @param {string} status - Processing status (success, error, warning)
   * @param {Object} details - Processing details
   */
  async sendDataProcessingNotification(processType, status, details = {}) {
    const subject = `Data Processing ${status.toUpperCase()}: ${processType}`;
    const body = this.formatDataProcessingBody(processType, status, details);
    
    return this.sendDataUploadNotification(subject, body);
  }

  /**
   * Format admin email body with standard styling
   */
  formatAdminEmailBody(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #1f2937; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .alert { padding: 15px; margin: 10px 0; border-radius: 5px; }
          .alert-error { background-color: #fee2e2; border-left: 4px solid #dc2626; }
          .alert-warning { background-color: #fef3c7; border-left: 4px solid #f59e0b; }
          .alert-info { background-color: #dbeafe; border-left: 4px solid #3b82f6; }
          .alert-success { background-color: #d1fae5; border-left: 4px solid #10b981; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sentia Manufacturing Dashboard</h1>
          <p>Administrative Notification</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from the Sentia Manufacturing Dashboard system.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format data email body with standard styling
   */
  formatDataEmailBody(content) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .header { background-color: #059669; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; }
          .footer { background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #666; }
          .data-info { background-color: #f0f9ff; padding: 15px; margin: 10px 0; border-radius: 5px; border-left: 4px solid #0ea5e9; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Sentia Data Processing</h1>
          <p>Data Upload & Processing Notification</p>
        </div>
        <div class="content">
          ${content}
        </div>
        <div class="footer">
          <p>This is an automated message from the Sentia Manufacturing Dashboard data processing system.</p>
          <p>Timestamp: ${new Date().toISOString()}</p>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Format system alert email body
   */
  formatSystemAlertBody(alertType, message, context) {
    const alertClass = `alert-${alertType}`;
    const contextHtml = Object.keys(context).length > 0 
      ? `<div class="data-info"><h4>Context:</h4><pre>${JSON.stringify(context, null, 2)}</pre></div>`
      : '';

    return `
      <div class="alert ${alertClass}">
        <h3>System ${alertType.toUpperCase()}</h3>
        <p><strong>Message:</strong> ${message}</p>
        ${contextHtml}
      </div>
    `;
  }

  /**
   * Format data processing email body
   */
  formatDataProcessingBody(processType, status, details) {
    const statusClass = `alert-${status === 'success' ? 'success' : status === 'error' ? 'error' : 'warning'}`;
    const detailsHtml = Object.keys(details).length > 0 
      ? `<div class="data-info"><h4>Processing Details:</h4><pre>${JSON.stringify(details, null, 2)}</pre></div>`
      : '';

    return `
      <div class="alert ${statusClass}">
        <h3>Data Processing ${status.toUpperCase()}</h3>
        <p><strong>Process Type:</strong> ${processType}</p>
        <p><strong>Status:</strong> ${status}</p>
        ${detailsHtml}
      </div>
    `;
  }

  /**
   * Test email configuration
   */
  async testConfiguration() {
    try {
      await this.getAccessToken();
      logger.info('Microsoft Graph API configuration test successful');
      return { success: true, message: 'Email configuration is working correctly' };
    } catch (error) {
      logger.error('Microsoft Graph API configuration test failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = EmailService;
