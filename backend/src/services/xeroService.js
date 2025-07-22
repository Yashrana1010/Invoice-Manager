const axios = require('axios');
const logger = require('../utils/logger');
const {xeroInvoiceSchema} = require('./invoiceSchema');
const invoiceData = {
  InvoiceNumber: "BFF5325002574457",         // Corrected key
  DateString: "2024-11-06",                  // ISO date string
  DueDateString: "2024-11-20",               // ISO date string (replace null)
  ExpectedPaymentDate: "2024-11-25",         // ISO date string
  Contact: {
    ContactID: "125412541254",               // Moved inside Contact object
    Name: "Yash Rana",                       // Optional, but safe to include
    Addresses: [{
      AddressLine1: "QB tower, Albatross Shipping Ltd",
      City: "Ludhiana",
      Region: "Punjab",
      PostalCode: "141010",
      Country: "India"
    }]
  },
  LineItems: [
    {
      Description: "Platform Fee, Payment Handling Charges",
      Quantity: 1,
      UnitAmount: 11.01, 
      TaxAmount: 1.99,
      LineAmount: 13
    }
  ],
  CurrencyCode: "INR"
};

const accessToken = "eyJhbGciOiJSUzI1NiIsImtpZCI6IjFDQUY4RTY2NzcyRDZEQzAyOEQ2NzI2RkQwMjYxNTgxNTcwRUZDMTkiLCJ0eXAiOiJKV1QiLCJ4NXQiOiJISy1PWm5jdGJjQW8xbkp2MENZVmdWY09fQmsifQ.eyJuYmYiOjE3NTMyMDYxNTksImV4cCI6MTc1MzIwNzk1OSwiaXNzIjoiaHR0cHM6Ly9pZGVudGl0eS54ZXJvLmNvbSIsImF1ZCI6Imh0dHBzOi8vaWRlbnRpdHkueGVyby5jb20vcmVzb3VyY2VzIiwiY2xpZW50X2lkIjoiMTE4QTJERTI4QzE3NDY0RUI1QUVFRTAzM0ZERDdEQjMiLCJzdWIiOiI0YTRkZmY3OThhYjg1NDEzYTA0YTU1NGJkYTBlM2RhNiIsImF1dGhfdGltZSI6MTc1MzIwNTI1OCwieGVyb191c2VyaWQiOiI4NjI5YjZkNi1kZGM1LTQ2NGEtYWQ0NS0xMGZkNzNjNTliNGEiLCJnbG9iYWxfc2Vzc2lvbl9pZCI6IjBmODEzNzEzZGE2YTQ1M2E4ZGFhNWM2NDVlYmY0N2M5Iiwic2lkIjoiMGY4MTM3MTNkYTZhNDUzYThkYWE1YzY0NWViZjQ3YzkiLCJqdGkiOiI0RkQwMUY1NjJCREEyMTEyQTY0ODNFQUNENDc3QUQ2NyIsImF1dGhlbnRpY2F0aW9uX2V2ZW50X2lkIjoiNWE1MjJlM2QtNmEzYy00MDNjLThkODUtNGE4NjkzYTEyYTRiIiwic2NvcGUiOlsiZW1haWwiLCJwcm9maWxlIiwib3BlbmlkIl0sImFtciI6WyJwd2QiXX0.hHFuqdmenMDBiiXiePTNwHZ23LYq9Unj-lOildUJFnp6VL4yoVgoTUrtIQVXdABAH8HgHqBn9GFnJfMTWSakMBiO3W_80pMsCesZVo7BZSqTvEUiBU7AbZCyIWldNsma1TuK0Dw5g11Kc8_c_12V3fbG44oMQqMTrqL6tzXB02UiDBwUYCy2Cy0BBNp-IbWWGFzmofP0dZnUYqJK7Hg6qyA7xj7ppdwM4YdcLBgcnoNuZSXrcyT6JNs0EltQ3aVktcrWyvgmwHw1T68yCzqm81KzHOPfk3NHQcnnUiYhYefmGpKVwIbxO87thj0KXFxjyb1YWv9tiq_gvDJvVvzJxA";
const xeroTenantId = "c8b88426-261c-409a-8258-d9c3fb365d76"; 
async function createInvoice() {
  try {
    console.log("Creating invoice in Xero...");
    // Validate input
    const validatedData = xeroInvoiceSchema.parse(invoiceData);

    const response = await axios.post(
      "https://api.xero.com/api.xro/2.0/Invoices",
      { Invoices: [validatedData] },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'xero-tenant-id': xeroTenantId,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      }
    );

    if (response.status !== 200) {
      throw new Error(`Failed to create invoice: ${response.statusText}`);
    }

    logger.info(`Invoice created successfully: ${response.data?.Invoices?.[0]?.InvoiceID || 'No ID found'}`);
    logger.info(`Invoice created: ${validatedData.InvoiceNumber}`);

    return response; 
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.error('Invoice validation error:', error.errors);
      throw new Error('Invalid invoice data');
    }

    logger.error('Xero API error:', error);
    throw new Error('Failed to create invoice');
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
 
module.exports  = { createInvoice, getTenantId };