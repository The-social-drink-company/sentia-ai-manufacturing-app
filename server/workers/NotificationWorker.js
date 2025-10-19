const { Worker } = require('bullmq')
const { createBullMQConnection } = require('../lib/redis')
const prisma = require('../lib/prisma')
const logger = require('../utils/logger')

/**
 * NotificationWorker - Processes email/SMS/push notifications
 */
class NotificationWorker {
  constructor() {
    this.worker = null
    this.connection = null
  }

  async start() {
    logger.info('[NotificationWorker] Starting worker...')
    this.connection = createBullMQConnection()

    this.worker = new Worker('notification-queue', async job => await this.processJob(job), {
      connection: this.connection,
      concurrency: 5, // Process multiple notifications concurrently
    })

    this.worker.on('completed', job => logger.info(`[NotificationWorker] Job completed: ${job.id}`))
    this.worker.on('failed', (job, err) =>
      logger.error(`[NotificationWorker] Job failed: ${job.id}`, err)
    )

    logger.info('[NotificationWorker] Worker started')
    return { success: true }
  }

  async processJob(job) {
    const { userId, type, title, message, data } = job.data

    try {
      // Create notification record
      const notification = await prisma.notification.create({
        data: {
          userId,
          type: type.toUpperCase(),
          category: 'INFO',
          title,
          message,
          data: data ? JSON.stringify(data) : null,
          status: 'PENDING',
        },
      })

      // Send notification based on type
      let sent = false
      if (type === 'EMAIL') {
        sent = await this.sendEmail(userId, title, message)
      } else if (type === 'IN_APP') {
        sent = true // In-app notifications are stored in DB only
      }

      // Update notification status
      await prisma.notification.update({
        where: { id: notification.id },
        data: {
          status: sent ? 'SENT' : 'FAILED',
          sentAt: sent ? new Date() : null,
        },
      })

      return { success: sent, notificationId: notification.id }
    } catch (error) {
      logger.error(`[NotificationWorker] Job ${job.id} failed:`, error)
      throw error
    }
  }

  // eslint-disable-next-line no-unused-vars
  async sendEmail(userId, title, message) {
    // TODO: Implement actual email sending (SendGrid, AWS SES, etc.)
    // message parameter will be used once email integration is implemented
    logger.info(`[NotificationWorker] Would send email to user ${userId}: ${title}`)
    return true
  }

  async stop() {
    if (this.worker) await this.worker.close()
    if (this.connection) await this.connection.quit()
    logger.info('[NotificationWorker] Worker stopped')
  }
}

module.exports = NotificationWorker
