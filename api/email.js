const express = require('express');
const router = express.Router();
const EmailService = require('../services/email/EmailService');
const NotificationService = require('../services/email/NotificationService');
const { logger } = require('../services/logger');

// Initialize services
const emailService = new EmailService();
const notificationService = new NotificationService();

/**
 * Test email configuration
 */
router.get('/test', async (req, res) => {
  try {
    const result = await emailService.testConfiguration();
    res.json(result);
  } catch (error) {
    logger.error('Email test failed:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Email test failed', 
      error: error.message 
    });
  }
});

/**
 * Send custom email
 */
router.post('/send', async (req, res) => {
  try {
    const { to, subject, body, isHtml = true, attachments = [] } = req.body;
    
    if (!to || !subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, body'
      });
    }

    const result = await emailService.sendEmail({
      to,
      subject,
      body,
      isHtml,
      attachments
    });

    res.json(result);
  } catch (error) {
    logger.error('Failed to send email:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: error.message
    });
  }
});

/**
 * Send admin notification
 */
router.post('/admin', async (req, res) => {
  try {
    const { subject, body, attachments = [] } = req.body;
    
    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, body'
      });
    }

    const result = await emailService.sendAdminNotification(subject, body, attachments);
    res.json(result);
  } catch (error) {
    logger.error('Failed to send admin notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send admin notification',
      error: error.message
    });
  }
});

/**
 * Send data upload notification
 */
router.post('/data', async (req, res) => {
  try {
    const { subject, body, attachments = [] } = req.body;
    
    if (!subject || !body) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: subject, body'
      });
    }

    const result = await emailService.sendDataUploadNotification(subject, body, attachments);
    res.json(result);
  } catch (error) {
    logger.error('Failed to send data notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send data notification',
      error: error.message
    });
  }
});

/**
 * Send system alert
 */
router.post('/system-alert', async (req, res) => {
  try {
    const { alertType, message, context = {} } = req.body;
    
    if (!alertType || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: alertType, message'
      });
    }

    const result = await emailService.sendSystemAlert(alertType, message, context);
    res.json(result);
  } catch (error) {
    logger.error('Failed to send system alert:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send system alert',
      error: error.message
    });
  }
});

/**
 * Send data processing notification
 */
router.post('/data-processing', async (req, res) => {
  try {
    const { processType, status, details = {} } = req.body;
    
    if (!processType || !status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: processType, status'
      });
    }

    const result = await emailService.sendDataProcessingNotification(processType, status, details);
    res.json(result);
  } catch (error) {
    logger.error('Failed to send data processing notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send data processing notification',
      error: error.message
    });
  }
});

/**
 * Send system health alert
 */
router.post('/health-alert', async (req, res) => {
  try {
    const { level, component, message, metrics = {} } = req.body;
    
    if (!level || !component || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: level, component, message'
      });
    }

    await notificationService.sendSystemHealthAlert(level, component, message, metrics);
    res.json({ success: true, message: 'Health alert sent successfully' });
  } catch (error) {
    logger.error('Failed to send health alert:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send health alert',
      error: error.message
    });
  }
});

/**
 * Send data import notification
 */
router.post('/data-import', async (req, res) => {
  try {
    const { status, details = {} } = req.body;
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: status'
      });
    }

    await notificationService.sendDataImportNotification(status, details);
    res.json({ success: true, message: 'Data import notification sent successfully' });
  } catch (error) {
    logger.error('Failed to send data import notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send data import notification',
      error: error.message
    });
  }
});

/**
 * Send user action notification
 */
router.post('/user-action', async (req, res) => {
  try {
    const { action, user, details = {} } = req.body;
    
    if (!action || !user) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: action, user'
      });
    }

    await notificationService.sendUserActionNotification(action, user, details);
    res.json({ success: true, message: 'User action notification sent successfully' });
  } catch (error) {
    logger.error('Failed to send user action notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send user action notification',
      error: error.message
    });
  }
});

/**
 * Send performance alert
 */
router.post('/performance-alert', async (req, res) => {
  try {
    const { metric, value, threshold, unit = '' } = req.body;
    
    if (!metric || value === undefined || threshold === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: metric, value, threshold'
      });
    }

    await notificationService.sendPerformanceAlert(metric, value, threshold, unit);
    res.json({ success: true, message: 'Performance alert sent successfully' });
  } catch (error) {
    logger.error('Failed to send performance alert:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send performance alert',
      error: error.message
    });
  }
});

/**
 * Send data quality alert
 */
router.post('/data-quality', async (req, res) => {
  try {
    const { dataset, qualityIssues = {} } = req.body;
    
    if (!dataset) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: dataset'
      });
    }

    await notificationService.sendDataQualityAlert(dataset, qualityIssues);
    res.json({ success: true, message: 'Data quality alert sent successfully' });
  } catch (error) {
    logger.error('Failed to send data quality alert:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send data quality alert',
      error: error.message
    });
  }
});

/**
 * Send Excel upload notification
 */
router.post('/excel-upload', async (req, res) => {
  try {
    const { filename, recordCount, processingResults = {} } = req.body;
    
    if (!filename || recordCount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: filename, recordCount'
      });
    }

    await notificationService.sendExcelUploadNotification(filename, recordCount, processingResults);
    res.json({ success: true, message: 'Excel upload notification sent successfully' });
  } catch (error) {
    logger.error('Failed to send Excel upload notification:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to send Excel upload notification',
      error: error.message
    });
  }
});

/**
 * Test notification service
 */
router.get('/test-notifications', async (req, res) => {
  try {
    const result = await notificationService.testService();
    res.json(result);
  } catch (error) {
    logger.error('Notification service test failed:', error.message);
    res.status(500).json({
      success: false,
      message: 'Notification service test failed',
      error: error.message
    });
  }
});

module.exports = router;
