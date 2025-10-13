/**
 * Xero Create Invoice Tool
 * 
 * Comprehensive invoice creation tool for programmatically creating invoices
 * with line items, tax calculations, custom fields, and automatic email sending.
 * 
 * @version 1.0.0
 */

import { createLogger } from '../../../utils/logger.js';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();

/**
 * Create Invoice Tool Class
 */
export class CreateInvoiceTool {
  constructor(xeroIntegration) {
    this.xero = xeroIntegration;
    this.name = 'xero-create-invoice';
    this.description = 'Create new invoices with line items, tax calculations, and automated processing';
    this.category = 'financial';
    this.cacheEnabled = false; // Don't cache create operations
    this.requiresAuth = true;

    this.inputSchema = {
      type: 'object',
      properties: {
        tenantId: {
          type: 'string',
          description: 'Xero tenant/organization ID',
          minLength: 1
        },
        invoiceType: {
          type: 'string',
          enum: ['ACCREC', 'ACCPAY'],
          description: 'Invoice type: ACCREC (sales invoice) or ACCPAY (bill)',
          default: 'ACCREC'
        },
        contactID: {
          type: 'string',
          description: 'Contact ID for the invoice (required)',
          minLength: 1
        },
        invoiceNumber: {
          type: 'string',
          description: 'Invoice number (leave empty for auto-generation)',
          maxLength: 255
        },
        reference: {
          type: 'string',
          description: 'Invoice reference',
          maxLength: 255
        },
        date: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Invoice date (YYYY-MM-DD, defaults to today)'
        },
        dueDate: {
          type: 'string',
          pattern: '^\\d{4}-\\d{2}-\\d{2}$',
          description: 'Due date (YYYY-MM-DD, defaults to date + payment terms)'
        },
        lineItems: {
          type: 'array',
          minItems: 1,
          items: {
            type: 'object',
            properties: {
              description: {
                type: 'string',
                description: 'Line item description',
                maxLength: 4000
              },
              quantity: {
                type: 'number',
                minimum: 0,
                description: 'Quantity',
                default: 1
              },
              unitAmount: {
                type: 'number',
                description: 'Unit price (excluding tax)'
              },
              itemCode: {
                type: 'string',
                description: 'Item code (if using inventory items)'
              },
              accountCode: {
                type: 'string',
                description: 'Account code for this line item'
              },
              taxType: {
                type: 'string',
                description: 'Tax type for this line item'
              },
              taxAmount: {
                type: 'number',
                description: 'Tax amount (calculated automatically if not provided)'
              },
              lineAmount: {
                type: 'number',
                description: 'Line total (calculated automatically if not provided)'
              },
              discountRate: {
                type: 'number',
                minimum: 0,
                maximum: 100,
                description: 'Discount percentage for this line'
              },
              discountAmount: {
                type: 'number',
                description: 'Fixed discount amount for this line'
              },
              trackingCategories: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    option: { type: 'string' }
                  },
                  required: ['name', 'option']
                },
                description: 'Tracking categories for this line'
              }
            },
            required: ['description', 'unitAmount'],
            additionalProperties: false
          },
          description: 'Invoice line items'
        },
        currencyCode: {
          type: 'string',
          description: 'Currency code (defaults to organization currency)',
          pattern: '^[A-Z]{3}$'
        },
        brandingThemeID: {
          type: 'string',
          description: 'Branding theme ID for invoice appearance'
        },
        status: {
          type: 'string',
          enum: ['DRAFT', 'SUBMITTED', 'AUTHORISED'],
          description: 'Initial invoice status',
          default: 'DRAFT'
        },
        lineAmountTypes: {
          type: 'string',
          enum: ['Exclusive', 'Inclusive', 'NoTax'],
          description: 'How line amounts are treated for tax',
          default: 'Exclusive'
        },
        invoiceMessage: {
          type: 'string',
          description: 'Message to include on the invoice',
          maxLength: 3000
        },
        url: {
          type: 'string',
          description: 'URL link for the invoice'
        },
        paymentTerms: {
          type: 'object',
          properties: {
            day: {
              type: 'integer',
              minimum: 1,
              maximum: 31,
              description: 'Day of month for payment'
            },
            type: {
              type: 'string',
              enum: ['DAYSAFTERBILLDATE', 'DAYSAFTERBILLMONTH', 'OFCURRENTMONTH', 'OFFOLLOWINGMONTH'],
              description: 'Payment terms type'
            }
          },
          description: 'Payment terms for the invoice'
        },
        sendToContact: {
          type: 'boolean',
          description: 'Automatically send invoice to contact via email',
          default: false
        },
        includeAttachments: {
          type: 'boolean',
          description: 'Include any file attachments',
          default: false
        },
        validateOnly: {
          type: 'boolean',
          description: 'Validate invoice data without creating (dry run)',
          default: false
        },
        attachments: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              fileName: { type: 'string' },
              mimeType: { type: 'string' },
              content: { type: 'string', description: 'Base64 encoded file content' }
            },
            required: ['fileName', 'mimeType', 'content']
          },
          description: 'File attachments for the invoice'
        }
      },
      required: ['tenantId', 'contactID', 'lineItems'],
      additionalProperties: false
    };

    logger.info('Create Invoice Tool initialized');
  }

  /**
   * Execute invoice creation
   */
  async execute(params) {
    const startTime = Date.now();
    const correlationId = params.correlationId || uuidv4();

    try {
      logger.info('Executing create invoice tool', {
        correlationId,
        invoiceType: params.invoiceType,
        tenantId: params.tenantId,
        contactID: params.contactID,
        validateOnly: params.validateOnly
      });

      // Set tenant context
      await this.xero.xeroApi.setTokenSet(
        await this.xero.tokenManager.getTokens(params.tenantId)
      );

      // Validate contact exists
      await this.validateContact(params.tenantId, params.contactID, correlationId);

      // Prepare invoice data
      const invoiceData = await this.prepareInvoiceData(params, correlationId);

      // Validate invoice data
      const validation = await this.validateInvoiceData(invoiceData, params);
      if (!validation.isValid) {
        throw new Error(`Invoice validation failed: ${validation.errors.join(', ')}`);
      }

      // If validate only, return validation results
      if (params.validateOnly) {
        return {
          success: true,
          validation,
          invoiceData,
          message: 'Invoice validation completed successfully'
        };
      }

      // Create invoice in Xero
      const createdInvoice = await this.createInvoiceInXero(
        params.tenantId,
        invoiceData,
        correlationId
      );

      // Add attachments if provided
      if (params.attachments && params.attachments.length > 0) {
        await this.addAttachments(
          params.tenantId,
          createdInvoice.InvoiceID,
          params.attachments,
          correlationId
        );
      }

      // Send to contact if requested
      if (params.sendToContact) {
        await this.sendInvoiceToContact(
          params.tenantId,
          createdInvoice.InvoiceID,
          correlationId
        );
      }

      // Prepare response
      const result = await this.formatResponse(createdInvoice, params);

      const executionTime = Date.now() - startTime;

      logger.info('Invoice created successfully', {
        correlationId,
        invoiceID: createdInvoice.InvoiceID,
        invoiceNumber: createdInvoice.InvoiceNumber,
        total: createdInvoice.Total,
        executionTime,
        status: createdInvoice.Status
      });

      return {
        success: true,
        data: result,
        metadata: {
          invoiceID: createdInvoice.InvoiceID,
          invoiceNumber: createdInvoice.InvoiceNumber,
          executionTime,
          correlationId,
          createdAt: new Date().toISOString()
        }
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;

      logger.error('Invoice creation failed', {
        correlationId,
        error: error.message,
        executionTime
      });

      throw new Error(`Invoice creation failed: ${error.message}`);
    }
  }

  /**
   * Validate that the contact exists
   */
  async validateContact(tenantId, contactID, correlationId) {
    try {
      const response = await this.xero.xeroApi.accountingApi.getContact(
        tenantId,
        contactID
      );

      if (!response.body?.contacts || response.body.contacts.length === 0) {
        throw new Error(`Contact with ID ${contactID} not found`);
      }

      const contact = response.body.contacts[0];
      
      logger.debug('Contact validated', {
        correlationId,
        contactID,
        contactName: contact.Name
      });

      return contact;

    } catch (error) {
      logger.error('Contact validation failed', {
        correlationId,
        contactID,
        error: error.message
      });
      throw new Error(`Contact validation failed: ${error.message}`);
    }
  }

  /**
   * Prepare invoice data for Xero API
   */
  async prepareInvoiceData(params, correlationId) {
    try {
      // Set default dates
      const today = new Date();
      const invoiceDate = params.date || today.toISOString().split('T')[0];
      
      let dueDate = params.dueDate;
      if (!dueDate && params.paymentTerms) {
        dueDate = this.calculateDueDate(invoiceDate, params.paymentTerms);
      } else if (!dueDate) {
        // Default to 30 days from invoice date
        const dueDateObj = new Date(invoiceDate);
        dueDateObj.setDate(dueDateObj.getDate() + 30);
        dueDate = dueDateObj.toISOString().split('T')[0];
      }

      // Prepare line items
      const lineItems = await this.prepareLineItems(params.lineItems, params.tenantId, correlationId);

      // Build invoice object
      const invoice = {
        Type: params.invoiceType || 'ACCREC',
        Contact: {
          ContactID: params.contactID
        },
        Date: invoiceDate,
        DueDate: dueDate,
        LineAmountTypes: params.lineAmountTypes || 'Exclusive',
        LineItems: lineItems,
        Status: params.status || 'DRAFT'
      };

      // Add optional fields
      if (params.invoiceNumber) {
        invoice.InvoiceNumber = params.invoiceNumber;
      }
      
      if (params.reference) {
        invoice.Reference = params.reference;
      }

      if (params.currencyCode) {
        invoice.CurrencyCode = params.currencyCode;
      }

      if (params.brandingThemeID) {
        invoice.BrandingThemeID = params.brandingThemeID;
      }

      if (params.invoiceMessage) {
        invoice.InvoiceMessage = params.invoiceMessage;
      }

      if (params.url) {
        invoice.Url = params.url;
      }

      logger.debug('Invoice data prepared', {
        correlationId,
        type: invoice.Type,
        lineItemsCount: lineItems.length,
        date: invoiceDate,
        dueDate
      });

      return invoice;

    } catch (error) {
      logger.error('Invoice data preparation failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Calculate due date based on payment terms
   */
  calculateDueDate(invoiceDate, paymentTerms) {
    const date = new Date(invoiceDate);
    
    switch (paymentTerms.type) {
      case 'DAYSAFTERBILLDATE':
        date.setDate(date.getDate() + paymentTerms.day);
        break;
      case 'DAYSAFTERBILLMONTH':
        date.setMonth(date.getMonth() + 1);
        date.setDate(paymentTerms.day);
        break;
      case 'OFCURRENTMONTH':
        date.setDate(paymentTerms.day);
        break;
      case 'OFFOLLOWINGMONTH':
        date.setMonth(date.getMonth() + 1);
        date.setDate(paymentTerms.day);
        break;
      default:
        date.setDate(date.getDate() + 30); // Default 30 days
    }
    
    return date.toISOString().split('T')[0];
  }

  /**
   * Prepare line items with calculations and validation
   */
  async prepareLineItems(lineItemsInput, tenantId, correlationId) {
    const lineItems = [];

    for (const item of lineItemsInput) {
      const lineItem = {
        Description: item.description,
        Quantity: item.quantity || 1,
        UnitAmount: item.unitAmount
      };

      // Add optional fields
      if (item.itemCode) {
        lineItem.ItemCode = item.itemCode;
      }

      if (item.accountCode) {
        lineItem.AccountCode = item.accountCode;
      }

      if (item.taxType) {
        lineItem.TaxType = item.taxType;
      }

      // Calculate line amount if not provided
      if (item.lineAmount) {
        lineItem.LineAmount = item.lineAmount;
      } else {
        let lineAmount = lineItem.Quantity * lineItem.UnitAmount;
        
        // Apply discount if specified
        if (item.discountRate) {
          lineAmount = lineAmount * (1 - item.discountRate / 100);
        } else if (item.discountAmount) {
          lineAmount = lineAmount - item.discountAmount;
        }
        
        lineItem.LineAmount = Math.max(0, lineAmount);
      }

      // Add tracking categories if provided
      if (item.trackingCategories && item.trackingCategories.length > 0) {
        lineItem.Tracking = item.trackingCategories.map(tracking => ({
          Name: tracking.name,
          Option: tracking.option
        }));
      }

      lineItems.push(lineItem);
    }

    logger.debug('Line items prepared', {
      correlationId,
      lineItemsCount: lineItems.length,
      totalAmount: lineItems.reduce((sum, item) => sum + item.LineAmount, 0)
    });

    return lineItems;
  }

  /**
   * Validate invoice data before creation
   */
  async validateInvoiceData(invoiceData, params) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Validate required fields
      if (!invoiceData.Contact?.ContactID) {
        validation.errors.push('Contact ID is required');
      }

      if (!invoiceData.LineItems || invoiceData.LineItems.length === 0) {
        validation.errors.push('At least one line item is required');
      }

      // Validate dates
      const invoiceDate = new Date(invoiceData.Date);
      const dueDate = new Date(invoiceData.DueDate);
      
      if (isNaN(invoiceDate.getTime())) {
        validation.errors.push('Invalid invoice date');
      }
      
      if (isNaN(dueDate.getTime())) {
        validation.errors.push('Invalid due date');
      }
      
      if (!isNaN(invoiceDate.getTime()) && !isNaN(dueDate.getTime()) && dueDate < invoiceDate) {
        validation.warnings.push('Due date is before invoice date');
      }

      // Validate line items
      for (let i = 0; i < invoiceData.LineItems.length; i++) {
        const lineItem = invoiceData.LineItems[i];
        
        if (!lineItem.Description) {
          validation.errors.push(`Line item ${i + 1}: Description is required`);
        }
        
        if (lineItem.UnitAmount === undefined || lineItem.UnitAmount < 0) {
          validation.errors.push(`Line item ${i + 1}: Valid unit amount is required`);
        }
        
        if (lineItem.Quantity === undefined || lineItem.Quantity < 0) {
          validation.errors.push(`Line item ${i + 1}: Valid quantity is required`);
        }
      }

      // Calculate totals for validation
      const subtotal = invoiceData.LineItems.reduce((sum, item) => 
        sum + (item.LineAmount || 0), 0);
      
      if (subtotal <= 0) {
        validation.warnings.push('Invoice total is zero or negative');
      }

      validation.isValid = validation.errors.length === 0;

      logger.debug('Invoice validation completed', {
        isValid: validation.isValid,
        errorsCount: validation.errors.length,
        warningsCount: validation.warnings.length
      });

      return validation;

    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
      return validation;
    }
  }

  /**
   * Create invoice in Xero
   */
  async createInvoiceInXero(tenantId, invoiceData, correlationId) {
    try {
      logger.debug('Creating invoice in Xero', {
        correlationId,
        type: invoiceData.Type,
        contactID: invoiceData.Contact.ContactID
      });

      const response = await this.xero.xeroApi.accountingApi.createInvoices(
        tenantId,
        {
          invoices: [invoiceData]
        },
        false, // summarizeErrors
        4 // unitdp
      );

      if (!response.body?.invoices || response.body.invoices.length === 0) {
        throw new Error('No invoice returned from Xero API');
      }

      const createdInvoice = response.body.invoices[0];

      // Check for validation errors
      if (createdInvoice.ValidationErrors && createdInvoice.ValidationErrors.length > 0) {
        const errors = createdInvoice.ValidationErrors.map(err => err.Message).join(', ');
        throw new Error(`Xero validation errors: ${errors}`);
      }

      logger.info('Invoice created in Xero', {
        correlationId,
        invoiceID: createdInvoice.InvoiceID,
        invoiceNumber: createdInvoice.InvoiceNumber,
        status: createdInvoice.Status,
        total: createdInvoice.Total
      });

      return createdInvoice;

    } catch (error) {
      logger.error('Xero invoice creation failed', {
        correlationId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Add attachments to the created invoice
   */
  async addAttachments(tenantId, invoiceID, attachments, correlationId) {
    try {
      for (const attachment of attachments) {
        logger.debug('Adding attachment to invoice', {
          correlationId,
          invoiceID,
          fileName: attachment.fileName
        });

        // Convert base64 content to buffer
        const content = Buffer.from(attachment.content, 'base64');

        await this.xero.xeroApi.accountingApi.createInvoiceAttachmentByFileName(
          tenantId,
          invoiceID,
          attachment.fileName,
          content,
          false, // includeOnline
          attachment.mimeType
        );
      }

      logger.info('Attachments added to invoice', {
        correlationId,
        invoiceID,
        attachmentCount: attachments.length
      });

    } catch (error) {
      logger.warn('Failed to add attachments', {
        correlationId,
        invoiceID,
        error: error.message
      });
      // Don't fail the invoice creation for attachment errors
    }
  }

  /**
   * Send invoice to contact via email
   */
  async sendInvoiceToContact(tenantId, invoiceID, correlationId) {
    try {
      logger.debug('Sending invoice to contact', {
        correlationId,
        invoiceID
      });

      await this.xero.xeroApi.accountingApi.emailInvoice(
        tenantId,
        invoiceID,
        {
          requestId: correlationId
        }
      );

      logger.info('Invoice sent to contact', {
        correlationId,
        invoiceID
      });

    } catch (error) {
      logger.warn('Failed to send invoice to contact', {
        correlationId,
        invoiceID,
        error: error.message
      });
      // Don't fail the invoice creation for email errors
    }
  }

  /**
   * Format the response
   */
  async formatResponse(createdInvoice, params) {
    const response = {
      invoice: createdInvoice,
      summary: {
        invoiceID: createdInvoice.InvoiceID,
        invoiceNumber: createdInvoice.InvoiceNumber,
        type: createdInvoice.Type,
        status: createdInvoice.Status,
        contact: createdInvoice.Contact?.Name,
        date: createdInvoice.DateString,
        dueDate: createdInvoice.DueDateString,
        subtotal: createdInvoice.SubTotal,
        totalTax: createdInvoice.TotalTax,
        total: createdInvoice.Total,
        amountDue: createdInvoice.AmountDue,
        currencyCode: createdInvoice.CurrencyCode,
        lineItemCount: createdInvoice.LineItems?.length || 0
      },
      actions: {
        emailSent: params.sendToContact,
        attachmentsAdded: params.attachments?.length || 0,
        invoiceUrl: createdInvoice.OnlineInvoiceUrl || null
      }
    };

    return response;
  }
}