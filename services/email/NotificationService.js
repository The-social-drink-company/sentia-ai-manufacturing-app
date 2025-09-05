const EmailService = require('./EmailService');
const { logger } = require('../logger');

/**
 * Notification Service
 * Handles different types of notifications using the EmailService
 */
class NotificationService {
  constructor() {
    this.emailService = new EmailService();
  }

  /**
   * Send system health alert
   * @param {string} level - Alert level (error, warning, info)
   * @param {string} component - System component
   * @param {string} message - Alert message
   * @param {Object} metrics - System metrics
   */
  async sendSystemHealthAlert(level, component, message, metrics = {}) {
    try {
      const subject = `System Health ${level.toUpperCase()}: ${component}`;
      const body = this.formatSystemHealthBody(level, component, message, metrics);
      
      await this.emailService.sendAdminNotification(subject, body);
      logger.info(`System health alert sent: ${component} - ${level}`);
    } catch (error) {
      logger.error('Failed to send system health alert:', error.message);
    }
  }

  /**
   * Send data import notification
   * @param {string} status - Import status (success, error, partial)
   * @param {Object} details - Import details
   */
  async sendDataImportNotification(status, details = {}) {
    try {
      const subject = `Data Import ${status.toUpperCase()}`;
      const body = this.formatDataImportBody(status, details);
      
      await this.emailService.sendDataUploadNotification(subject, body);
      logger.info(`Data import notification sent: ${status}`);
    } catch (error) {
      logger.error('Failed to send data import notification:', error.message);
    }
  }

  /**
   * Send user action notification
   * @param {string} action - User action
   * @param {string} user - User identifier
   * @param {Object} details - Action details
   */
  async sendUserActionNotification(action, user, details = {}) {
    try {
      const subject = `User Action: ${action}`;
      const body = this.formatUserActionBody(action, user, details);
      
      await this.emailService.sendAdminNotification(subject, body);
      logger.info(`User action notification sent: ${action} by ${user}`);
    } catch (error) {
      logger.error('Failed to send user action notification:', error.message);
    }
  }

  /**
   * Send performance alert
   * @param {string} metric - Performance metric
   * @param {number} value - Current value
   * @param {number} threshold - Threshold value
   * @param {string} unit - Unit of measurement
   */
  async sendPerformanceAlert(metric, value, threshold, unit = '') {
    try {
      const level = value > threshold ? 'warning' : 'error';
      const subject = `Performance Alert: ${metric}`;
      const body = this.formatPerformanceAlertBody(metric, value, threshold, unit, level);
      
      await this.emailService.sendAdminNotification(subject, body);
      logger.info(`Performance alert sent: ${metric} = ${value}${unit}`);
    } catch (error) {
      logger.error('Failed to send performance alert:', error.message);
    }
  }

  /**
   * Send data quality alert
   * @param {string} dataset - Dataset name
   * @param {Object} qualityIssues - Quality issues found
   */
  async sendDataQualityAlert(dataset, qualityIssues = {}) {
    try {
      const subject = `Data Quality Alert: ${dataset}`;
      const body = this.formatDataQualityBody(dataset, qualityIssues);
      
      await this.emailService.sendDataUploadNotification(subject, body);
      logger.info(`Data quality alert sent for dataset: ${dataset}`);
    } catch (error) {
      logger.error('Failed to send data quality alert:', error.message);
    }
  }

  /**
   * Send scheduled report notification
   * @param {string} reportType - Type of report
   * @param {string} status - Report status
   * @param {Object} reportData - Report data summary
   */
  async sendScheduledReportNotification(reportType, status, reportData = {}) {
    try {
      const subject = `Scheduled Report ${status.toUpperCase()}: ${reportType}`;
      const body = this.formatScheduledReportBody(reportType, status, reportData);
      
      await this.emailService.sendAdminNotification(subject, body);
      logger.info(`Scheduled report notification sent: ${reportType} - ${status}`);
    } catch (error) {
      logger.error('Failed to send scheduled report notification:', error.message);
    }
  }

  /**
   * Send Excel file upload notification
   * @param {string} filename - Uploaded filename
   * @param {number} recordCount - Number of records processed
   * @param {Object} processingResults - Processing results
   */
  async sendExcelUploadNotification(filename, recordCount, processingResults = {}) {
    try {
      const subject = `Excel File Upload: ${filename}`;
      const body = this.formatExcelUploadBody(filename, recordCount, processingResults);
      
      await this.emailService.sendDataUploadNotification(subject, body);
      logger.info(`Excel upload notification sent: ${filename}`);
    } catch (error) {
      logger.error('Failed to send Excel upload notification:', error.message);
    }
  }

  /**
   * Format system health alert body
   */
  formatSystemHealthBody(level, component, message, metrics) {
    const metricsHtml = Object.keys(metrics).length > 0 
      ? `<div class="data-info"><h4>System Metrics:</h4><ul>${Object.entries(metrics).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul></div>`
      : '';

    return `
      <div class="alert alert-${level}">
        <h3>System Health ${level.toUpperCase()}</h3>
        <p><strong>Component:</strong> ${component}</p>
        <p><strong>Message:</strong> ${message}</p>
        ${metricsHtml}
      </div>
    `;
  }

  /**
   * Format data import notification body
   */
  formatDataImportBody(status, details) {
    const detailsHtml = Object.keys(details).length > 0 
      ? `<div class="data-info"><h4>Import Details:</h4><ul>${Object.entries(details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul></div>`
      : '';

    return `
      <div class="alert alert-${status === 'success' ? 'success' : status === 'error' ? 'error' : 'warning'}">
        <h3>Data Import ${status.toUpperCase()}</h3>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        ${detailsHtml}
      </div>
    `;
  }

  /**
   * Format user action notification body
   */
  formatUserActionBody(action, user, details) {
    const detailsHtml = Object.keys(details).length > 0 
      ? `<div class="data-info"><h4>Action Details:</h4><ul>${Object.entries(details).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul></div>`
      : '';

    return `
      <div class="alert alert-info">
        <h3>User Action Notification</h3>
        <p><strong>Action:</strong> ${action}</p>
        <p><strong>User:</strong> ${user}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        ${detailsHtml}
      </div>
    `;
  }

  /**
   * Format performance alert body
   */
  formatPerformanceAlertBody(metric, value, threshold, unit, level) {
    return `
      <div class="alert alert-${level}">
        <h3>Performance Alert</h3>
        <p><strong>Metric:</strong> ${metric}</p>
        <p><strong>Current Value:</strong> ${value}${unit}</p>
        <p><strong>Threshold:</strong> ${threshold}${unit}</p>
        <p><strong>Status:</strong> ${value > threshold ? 'Above Threshold' : 'Critical'}</p>
      </div>
    `;
  }

  /**
   * Format data quality alert body
   */
  formatDataQualityBody(dataset, qualityIssues) {
    const issuesHtml = Object.keys(qualityIssues).length > 0 
      ? `<div class="data-info"><h4>Quality Issues Found:</h4><ul>${Object.entries(qualityIssues).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul></div>`
      : '<p>No specific quality issues identified.</p>';

    return `
      <div class="alert alert-warning">
        <h3>Data Quality Alert</h3>
        <p><strong>Dataset:</strong> ${dataset}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        ${issuesHtml}
      </div>
    `;
  }

  /**
   * Format scheduled report notification body
   */
  formatScheduledReportBody(reportType, status, reportData) {
    const dataHtml = Object.keys(reportData).length > 0 
      ? `<div class="data-info"><h4>Report Summary:</h4><ul>${Object.entries(reportData).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul></div>`
      : '';

    return `
      <div class="alert alert-${status === 'success' ? 'success' : 'error'}">
        <h3>Scheduled Report ${status.toUpperCase()}</h3>
        <p><strong>Report Type:</strong> ${reportType}</p>
        <p><strong>Status:</strong> ${status}</p>
        <p><strong>Generated:</strong> ${new Date().toISOString()}</p>
        ${dataHtml}
      </div>
    `;
  }

  /**
   * Format Excel upload notification body
   */
  formatExcelUploadBody(filename, recordCount, processingResults) {
    const resultsHtml = Object.keys(processingResults).length > 0 
      ? `<div class="data-info"><h4>Processing Results:</h4><ul>${Object.entries(processingResults).map(([key, value]) => `<li><strong>${key}:</strong> ${value}</li>`).join('')}</ul></div>`
      : '';

    return `
      <div class="alert alert-info">
        <h3>Excel File Upload Processed</h3>
        <p><strong>Filename:</strong> ${filename}</p>
        <p><strong>Records Processed:</strong> ${recordCount}</p>
        <p><strong>Upload Time:</strong> ${new Date().toISOString()}</p>
        ${resultsHtml}
      </div>
    `;
  }

  /**
   * Test notification service
   */
  async testService() {
    try {
      await this.emailService.testConfiguration();
      logger.info('Notification service test successful');
      return { success: true, message: 'Notification service is working correctly' };
    } catch (error) {
      logger.error('Notification service test failed:', error.message);
      return { success: false, message: error.message };
    }
  }
}

module.exports = NotificationService;
