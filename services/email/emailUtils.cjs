const EmailService = require('./EmailService.cjs');
const NotificationService = require('./NotificationService.cjs');
const { logger } = require('../loggerWrapper.cjs');

// Initialize services
const emailService = new EmailService();
const notificationService = new NotificationService();

/**
 * Email utility functions for easy integration throughout the application
 */
class EmailUtils {
  /**
   * Send a quick admin notification
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {string} level - Alert level (info, warning, error, success)
   */
  static async notifyAdmin(subject, message, level = 'info') {
    try {
      const formattedMessage = this.formatQuickMessage(message, level);
      await emailService.sendAdminNotification(subject, formattedMessage);
      logger.info(`Admin notification sent: ${subject}`);
    } catch (error) {
      logger.error('Failed to send admin notification:', error.message);
    }
  }

  /**
   * Send a quick data upload notification
   * @param {string} subject - Email subject
   * @param {string} message - Email message
   * @param {string} level - Alert level (info, warning, error, success)
   */
  static async notifyDataUpload(subject, message, level = 'info') {
    try {
      const formattedMessage = this.formatQuickMessage(message, level);
      await emailService.sendDataUploadNotification(subject, formattedMessage);
      logger.info(`Data upload notification sent: ${subject}`);
    } catch (error) {
      logger.error('Failed to send data upload notification:', error.message);
    }
  }

  /**
   * Send system error alert
   * @param {string} component - System component
   * @param {string} error - Error message
   * @param {Object} context - Additional context
   */
  static async alertSystemError(component, error, context = {}) {
    try {
      await notificationService.sendSystemHealthAlert('error', component, error, context);
      logger.info(`System error alert sent: ${component}`);
    } catch (err) {
      logger.error('Failed to send system error alert:', err.message);
    }
  }

  /**
   * Send system warning alert
   * @param {string} component - System component
   * @param {string} warning - Warning message
   * @param {Object} context - Additional context
   */
  static async alertSystemWarning(component, warning, context = {}) {
    try {
      await notificationService.sendSystemHealthAlert('warning', component, warning, context);
      logger.info(`System warning alert sent: ${component}`);
    } catch (err) {
      logger.error('Failed to send system warning alert:', err.message);
    }
  }

  /**
   * Send data import success notification
   * @param {string} filename - Imported filename
   * @param {number} recordCount - Number of records imported
   * @param {Object} details - Additional details
   */
  static async notifyDataImportSuccess(filename, recordCount, details = {}) {
    try {
      const importDetails = {
        filename,
        recordCount,
        timestamp: new Date().toISOString(),
        ...details
      };
      await notificationService.sendDataImportNotification('success', importDetails);
      logger.info(`Data import success notification sent: ${filename}`);
    } catch (error) {
      logger.error('Failed to send data import success notification:', error.message);
    }
  }

  /**
   * Send data import error notification
   * @param {string} filename - Imported filename
   * @param {string} error - Error message
   * @param {Object} details - Additional details
   */
  static async notifyDataImportError(filename, error, details = {}) {
    try {
      const importDetails = {
        filename,
        error,
        timestamp: new Date().toISOString(),
        ...details
      };
      await notificationService.sendDataImportNotification('error', importDetails);
      logger.info(`Data import error notification sent: ${filename}`);
    } catch (err) {
      logger.error('Failed to send data import error notification:', err.message);
    }
  }

  /**
   * Send Excel file upload notification
   * @param {string} filename - Uploaded filename
   * @param {number} recordCount - Number of records processed
   * @param {Object} results - Processing results
   */
  static async notifyExcelUpload(filename, recordCount, results = {}) {
    try {
      await notificationService.sendExcelUploadNotification(filename, recordCount, results);
      logger.info(`Excel upload notification sent: ${filename}`);
    } catch (error) {
      logger.error('Failed to send Excel upload notification:', error.message);
    }
  }

  /**
   * Send performance alert
   * @param {string} metric - Performance metric name
   * @param {number} value - Current value
   * @param {number} threshold - Threshold value
   * @param {string} unit - Unit of measurement
   */
  static async alertPerformance(metric, value, threshold, unit = '') {
    try {
      await notificationService.sendPerformanceAlert(metric, value, threshold, unit);
      logger.info(`Performance alert sent: ${metric} = ${value}${unit}`);
    } catch (error) {
      logger.error('Failed to send performance alert:', error.message);
    }
  }

  /**
   * Send user action notification
   * @param {string} action - User action
   * @param {string} user - User identifier
   * @param {Object} details - Action details
   */
  static async notifyUserAction(action, user, details = {}) {
    try {
      await notificationService.sendUserActionNotification(action, user, details);
      logger.info(`User action notification sent: ${action} by ${user}`);
    } catch (error) {
      logger.error('Failed to send user action notification:', error.message);
    }
  }

  /**
   * Send data quality alert
   * @param {string} dataset - Dataset name
   * @param {Object} issues - Quality issues
   */
  static async alertDataQuality(dataset, issues = {}) {
    try {
      await notificationService.sendDataQualityAlert(dataset, issues);
      logger.info(`Data quality alert sent: ${dataset}`);
    } catch (error) {
      logger.error('Failed to send data quality alert:', error.message);
    }
  }

  /**
   * Send scheduled report notification
   * @param {string} reportType - Type of report
   * @param {string} status - Report status
   * @param {Object} data - Report data
   */
  static async notifyScheduledReport(reportType, status, data = {}) {
    try {
      await notificationService.sendScheduledReportNotification(reportType, status, data);
      logger.info(`Scheduled report notification sent: ${reportType} - ${status}`);
    } catch (error) {
      logger.error('Failed to send scheduled report notification:', error.message);
    }
  }

  /**
   * Format a quick message with level styling
   * @param {string} message - Message content
   * @param {string} level - Message level
   */
  static formatQuickMessage(message, level) {
    const levelClass = `alert-${level}`;
    return `
      <div class="alert ${levelClass}">
        <h3>${level.toUpperCase()}</h3>
        <p>${message}</p>
        <p><small>Timestamp: ${new Date().toISOString()}</small></p>
      </div>
    `;
  }

  /**
   * Test email functionality
   */
  static async testEmail() {
    try {
      const result = await emailService.testConfiguration();
      logger.info('Email test completed:', result);
      return result;
    } catch (error) {
      logger.error('Email test failed:', error.message);
      return { success: false, message: error.message };
    }
  }

  /**
   * Test notification functionality
   */
  static async testNotifications() {
    try {
      const result = await notificationService.testService();
      logger.info('Notification test completed:', result);
      return result;
    } catch (error) {
      logger.error('Notification test failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = EmailUtils;
