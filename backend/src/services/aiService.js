const OpenAI = require('openai');
const { extractFinancialData } = require('./extractionService');
const { createInvoice, recordTransaction, generateBalanceSheet } = require('./openBookService');
const logger = require('../utils/logger');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const INTENT_DETECTION_PROMPT = `You are a financial assistant AI. Analyze the user's message and determine their intent.

Possible intents:
- CREATE_INVOICE: User wants to create an invoice
- RECORD_TRANSACTION: User wants to record a transaction
- GENERATE_BALANCE_SHEET: User wants to see a balance sheet
- GENERAL_INQUIRY: General questions about finance

Respond with JSON in this format:
{
  "intent": "INTENT_NAME",
  "confidence": 0.95,
  "entities": {
    "client": "client name if mentioned",
    "amount": "amount if mentioned",
    "description": "description if mentioned",
    "date": "date if mentioned"
  }
}

User message: `;

async function processMessage(message, userId, conversationId) {
  try {
    // Step 1: Detect intent using OpenAI
    const intent = await detectIntent(message);
    
    logger.info(`Detected intent: ${intent.intent} with confidence: ${intent.confidence}`);

    // Step 2: Extract financial data using regex
    const extractedData = extractFinancialData(message);
    
    // Merge AI entities with regex extraction
    const mergedData = {
      ...intent.entities,
      ...extractedData
    };

    // Step 3: Process based on intent
    let response;
    switch (intent.intent) {
      case 'CREATE_INVOICE':
        response = await handleInvoiceCreation(mergedData, userId);
        break;
      case 'RECORD_TRANSACTION':
        response = await handleTransactionRecord(mergedData, userId);
        break;
      case 'GENERATE_BALANCE_SHEET':
        response = await handleBalanceSheetGeneration(userId);
        break;
      default:
        response = await handleGeneralInquiry(message);
    }

    return response;
  } catch (error) {
    logger.error('AI service error:', error);
    throw error;
  }
}

async function detectIntent(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: INTENT_DETECTION_PROMPT
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.1,
      max_tokens: 200
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    logger.error('Intent detection error:', error);
    // Fallback intent detection
    return {
      intent: 'GENERAL_INQUIRY',
      confidence: 0.5,
      entities: {}
    };
  }
}

async function handleInvoiceCreation(data, userId) {
  try {
    // Validate required fields
    if (!data.client || !data.amount) {
      return {
        message: "I need more information to create an invoice. Please provide the client name and amount. For example: 'Create an invoice for John Doe for $500'",
        data: null
      };
    }

    // Create invoice via OpenBook API
    const invoice = await createInvoice({
      client: data.client,
      amount: parseFloat(data.amount),
      description: data.description || 'Service provided',
      date: data.date || new Date().toISOString().split('T')[0],
      userId
    });

    return {
      message: `Invoice created successfully! Invoice #${invoice.id} for ${data.client} - $${data.amount}`,
      data: invoice
    };
  } catch (error) {
    logger.error('Invoice creation error:', error);
    return {
      message: "Sorry, I couldn't create the invoice. Please try again with the client name and amount.",
      data: null
    };
  }
}

async function handleTransactionRecord(data, userId) {
  try {
    if (!data.amount || !data.description) {
      return {
        message: "I need more details to record this transaction. Please provide the amount and description.",
        data: null
      };
    }

    const transaction = await recordTransaction({
      amount: parseFloat(data.amount),
      description: data.description,
      date: data.date || new Date().toISOString().split('T')[0],
      type: data.amount > 0 ? 'income' : 'expense',
      userId
    });

    return {
      message: `Transaction recorded successfully! ${data.description} - $${Math.abs(data.amount)}`,
      data: transaction
    };
  } catch (error) {
    logger.error('Transaction recording error:', error);
    return {
      message: "Sorry, I couldn't record the transaction. Please try again.",
      data: null
    };
  }
}

async function handleBalanceSheetGeneration(userId) {
  try {
    const balanceSheet = await generateBalanceSheet(userId);
    
    return {
      message: `Here's your current balance sheet:\n\nTotal Revenue: $${balanceSheet.totalRevenue}\nTotal Expenses: $${balanceSheet.totalExpenses}\nNet Income: $${balanceSheet.netIncome}\nOutstanding Invoices: ${balanceSheet.outstandingInvoices}`,
      data: balanceSheet
    };
  } catch (error) {
    logger.error('Balance sheet generation error:', error);
    return {
      message: "Sorry, I couldn't generate the balance sheet right now. Please try again.",
      data: null
    };
  }
}

async function handleGeneralInquiry(message) {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful financial assistant. Provide concise, helpful responses about finance, invoicing, and bookkeeping.'
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 200
    });

    return {
      message: completion.choices[0].message.content,
      data: null
    };
  } catch (error) {
    logger.error('General inquiry error:', error);
    return {
      message: "I'm here to help with your financial needs. You can ask me to create invoices, record transactions, or generate balance sheets.",
      data: null
    };
  }
}

module.exports = {
  processMessage
};
