const axios = require('axios');
const logger = require('../utils/logger');
const {xeroInvoiceSchema, mapToXeroInvoiceSchema} = require('./invoiceSchema');

async function createInvoice(invoiceData, accessToken, xeroTenantId) {
  try {
    console.log("Creating invoice in Xero...");
    // Validate input
    // console.log("Invoice data before validation:", invoiceData);
    const validatedData = xeroInvoiceSchema.parse(mapToXeroInvoiceSchema(invoiceData));
    const response = await axios.post("https://api.xero.com/api.xro/2.0/Invoices", 
      {Invoices: [validatedData]},
      {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'xero-tenant-id': xeroTenantId, // Required by Xero for all API calls
      }
    });

    if (response.status !== 200) {
      throw new Error(`Failed to create invoice: ${response.statusText}`);
    }

    logger.info(`Invoice created successfully: ${response.data?.Invoices?.[0]?.InvoiceID || 'No ID found'}`);
    return validatedData; // Return the validated invoice data
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.error('Invoice validation error:', error.errors);
      throw new Error('Invalid invoice data');
    }

    logger.error('Xero API error:', error);
    throw new Error('Failed to create invoice');
  }
}

async function getInvoices(){
  try { 
    console.log("Getting invoice in Xero...");
    // Validate input
    // const validatedData = xeroInvoiceSchema.parse(invoiceData);

    const response = await axios.get("https://api.xero.com/api.xro/2.0/Invoices", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'xero-tenant-id': xeroTenantId, // Required by Xero for all API calls
      }
    });

    console.log("Invoices fetched successfully:", response);
    if (response.status !== 200) {
      throw new Error(`Failed to create invoice: ${response.statusText}`);
    }
 
    logger.info(`Invoice created successfully: ${response.data?.Invoices?.[0]?.InvoiceID || 'No ID found'}`);
    return response;  
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.error('Invoice validation error:', error.errors);
      throw new Error('Invalid invoice data');
    }

    logger.error('Xero API error:', error.message);
    return {
      status: 500,
      message: 'Failed to create invoice',
      error: error
    };
  }
}

async function getTenantId(accessToken) {
  console.log("Fetching tenant ID");
  try {
    const response = await axios.get("https://api.xero.com/connections", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
      }
    });

    if (response.data && response.data.length > 0) {
      return response.data[0].tenantId;
    } else {
      throw new Error('No tenant found');
    }
  } catch (error) {
    logger.error('Error fetching tenant ID:', error.message);
    throw error;
  }
}
 
module.exports  = { createInvoice, getTenantId, getInvoices };