/**
 * Contact Form API Route
 * 
 * Handles contact form submissions and sends emails via SendGrid
 */

const express = require('express');
const router = express.Router();

// SendGrid configuration
const sgMail = require('@sendgrid/mail');
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || 'noreply@capliquify.com';
const TO_EMAIL = process.env.CONTACT_EMAIL || 'support@capliquify.com';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * POST /api/contact
 * 
 * Submit contact form
 */
router.post('/', async (req, res) => {
  try {
    const { name, email, company, phone, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        error: 'Name, email, and message are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email address' 
      });
    }

    // Check if SendGrid is configured
    if (!SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured, logging contact form submission');
      console.log('Contact form submission:', { name, email, company, phone, message });
      
      return res.status(200).json({ 
        success: true,
        message: 'Contact form submitted successfully (SendGrid not configured)' 
      });
    }

    // Prepare email to support team
    const supportEmail = {
      to: TO_EMAIL,
      from: FROM_EMAIL,
      subject: `New Contact Form Submission from ${name}`,
      text: `
New contact form submission from CapLiquify website:

Name: ${name}
Email: ${email}
Company: ${company || 'Not provided'}
Phone: ${phone || 'Not provided'}

Message:
${message}

---
This email was sent from the CapLiquify contact form.
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">New Contact Form Submission</h2>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
    <p><strong>Company:</strong> ${company || 'Not provided'}</p>
    <p><strong>Phone:</strong> ${phone || 'Not provided'}</p>
  </div>
  
  <div style="margin: 20px 0;">
    <h3 style="color: #374151;">Message:</h3>
    <p style="white-space: pre-wrap;">${message}</p>
  </div>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  
  <p style="color: #6b7280; font-size: 12px;">
    This email was sent from the CapLiquify contact form.
  </p>
</div>
      `,
    };

    // Prepare confirmation email to user
    const confirmationEmail = {
      to: email,
      from: FROM_EMAIL,
      subject: 'Thank you for contacting CapLiquify',
      text: `
Hi ${name},

Thank you for reaching out to CapLiquify. We've received your message and will get back to you within 24 hours.

Your message:
${message}

If you have any urgent questions, please don't hesitate to call us at +44 730 660 4807.

Best regards,
The CapLiquify Team

---
This is an automated confirmation email.
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">Thank you for contacting CapLiquify</h2>
  
  <p>Hi ${name},</p>
  
  <p>Thank you for reaching out to CapLiquify. We've received your message and will get back to you within 24 hours.</p>
  
  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <h3 style="color: #374151; margin-top: 0;">Your message:</h3>
    <p style="white-space: pre-wrap;">${message}</p>
  </div>
  
  <p>If you have any urgent questions, please don't hesitate to call us at <a href="tel:+447306604807">+44 730 660 4807</a>.</p>
  
  <p>Best regards,<br>The CapLiquify Team</p>
  
  <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
  
  <p style="color: #6b7280; font-size: 12px;">
    This is an automated confirmation email.
  </p>
</div>
      `,
    };

    // Send both emails
    await Promise.all([
      sgMail.send(supportEmail),
      sgMail.send(confirmationEmail),
    ]);

    console.log('Contact form emails sent successfully');

    res.status(200).json({ 
      success: true,
      message: 'Contact form submitted successfully' 
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    res.status(500).json({ 
      error: 'Failed to process contact form. Please try again or email us directly at support@capliquify.com' 
    });
  }
});

module.exports = router;
