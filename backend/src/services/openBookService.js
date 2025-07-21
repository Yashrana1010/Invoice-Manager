const axios = require('axios');
const { z } = require('zod');
const logger = require('../utils/logger');

// Zod schemas for OpenBook API validation
const invoiceSchema = z.object({
  client: z.string().min(1),
  amount: z.number().positive(),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  userId: z.string()
});

const transactionSchema = z.object({
  amount: z.number(),
  description: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(['income', 'expense']),
  userId: z.string()
});

// OpenBook API configuration
const OPENBOOK_BASE_URL = process.env.OPENBOOK_API_URL;
const OPENBOOK_API_KEY = process.env.OPENBOOK_API_KEY;

// Create axios instance with default config
const openBookClient = axios.create({
  baseURL: OPENBOOK_BASE_URL,
  headers: {
    'Authorization': `Bearer ${OPENBOOK_API_KEY}`,
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// In-memory storage for demo (replace with database in production)
let invoices = [];
let transactions = [];
let invoiceCounter = 1;
let transactionCounter = 1;

async function createInvoice(invoiceData) {
  try {
    // Validate input
    const validatedData = invoiceSchema.parse(invoiceData);
    
    // Format data for OpenBook API
    const openBookInvoice = {
      invoice_number: `INV-${String(invoiceCounter).padStart(4, '0')}`,
      customer_name: validatedData.client,
      amount: validatedData.amount,
      description: validatedData.description,
      issue_date: validatedData.date,
      due_date: calculateDueDate(validatedData.date),
      status: 'pending',
      currency: 'USD'
    };

    // For demo purposes, simulate API call
    const invoice = {
      id: invoiceCounter++,
      ...openBookInvoice,
      created_at: new Date().toISOString(),
      user_id: validatedData.userId
    };

    invoices.push(invoice);
    
    logger.info(`Invoice created: ${invoice.invoice_number}`);
    
    // In production, make actual API call:
    /*
    const response = await openBookClient.post('/invoices', openBookInvoice);
    return response.data;
    */
    
    return invoice;
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.error('Invoice validation error:', error.errors);
      throw new Error('Invalid invoice data');
    }
    
    logger.error('OpenBook API error:', error.message);
    throw new Error('Failed to create invoice');
  }
}

async function recordTransaction(transactionData) {
  try {
    // Validate input
    const validatedData = transactionSchema.parse(transactionData);
    
    // Format data for OpenBook API
    const openBookTransaction = {
      transaction_id: `TXN-${String(transactionCounter).padStart(6, '0')}`,
      amount: validatedData.amount,
      description: validatedData.description,
      date: validatedData.date,
      type: validatedData.type,
      category: categorizeTransaction(validatedData.description),
      currency: 'USD'
    };

    // For demo purposes, simulate API call
    const transaction = {
      id: transactionCounter++,
      ...openBookTransaction,
      created_at: new Date().toISOString(),
      user_id: validatedData.userId
    };

    transactions.push(transaction);
    
    logger.info(`Transaction recorded: ${transaction.transaction_id}`);
    
    return transaction;
  } catch (error) {
    if (error.name === 'ZodError') {
      logger.error('Transaction validation error:', error.errors);
      throw new Error('Invalid transaction data');
    }
    
    logger.error('Transaction recording error:', error.message);
    throw new Error('Failed to record transaction');
  }
}

async function generateBalanceSheet(userId) {
  try {
    // Get user's invoices and transactions
    const userInvoices = invoices.filter(inv => inv.user_id === userId);
    const userTransactions = transactions.filter(txn => txn.user_id === userId);
    
    // Calculate totals
    const totalRevenue = userInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalExpenses = userTransactions
      .filter(txn => txn.type === 'expense')
      .reduce((sum, txn) => sum + Math.abs(txn.amount), 0);
    const totalIncome = userTransactions
      .filter(txn => txn.type === 'income')
      .reduce((sum, txn) => sum + txn.amount, 0);
    
    const pendingInvoices = userInvoices.filter(inv => inv.status === 'pending');
    const outstandingAmount = pendingInvoices.reduce((sum, inv) => sum + inv.amount, 0);
    
    const balanceSheet = {
      totalRevenue: totalRevenue + totalIncome,
      totalExpenses,
      netIncome: (totalRevenue + totalIncome) - totalExpenses,
      outstandingInvoices: pendingInvoices.length,
      outstandingAmount,
      totalInvoices: userInvoices.length,
      totalTransactions: userTransactions.length,
      generatedAt: new Date().toISOString()
    };
    
    logger.info(`Balance sheet generated for user ${userId}`);
    
    return balanceSheet;
  } catch (error) {
    logger.error('Balance sheet generation error:', error.message);
    throw new Error('Failed to generate balance sheet');
  }
}

async function getInvoices(userId, options = {}) {
  try {
    let userInvoices = invoices.filter(inv => inv.user_id === userId);
    
    // Apply filters
    if (options.status) {
      userInvoices = userInvoices.filter(inv => inv.status === options.status);
    }
    
    if (options.limit) {
      userInvoices = userInvoices.slice(0, options.limit);
    }
    
    return userInvoices;
  } catch (error) {
    logger.error('Get invoices error:', error.message);
    throw new Error('Failed to fetch invoices');
  }
}

async function getTransactions(userId, options = {}) {
  try {
    let userTransactions = transactions.filter(txn => txn.user_id === userId);
    
    // Apply filters
    if (options.type) {
      userTransactions = userTransactions.filter(txn => txn.type === options.type);
    }
    
    if (options.limit) {
      userTransactions = userTransactions.slice(0, options.limit);
    }
    
    return userTransactions;
  } catch (error) {
    logger.error('Get transactions error:', error.message);
    throw new Error('Failed to fetch transactions');
  }
}

// Helper functions
function calculateDueDate(issueDate, paymentTerms = 30) {
  const date = new Date(issueDate);
  date.setDate(date.getDate() + paymentTerms);
  return date.toISOString().split('T')[0];
}

function categorizeTransaction(description) {
  const categories = {
    'office': ['office', 'supplies', 'equipment'],
    'travel': ['travel', 'flight', 'hotel', 'gas'],
    'marketing': ['marketing', 'advertising', 'promotion'],
    'software': ['software', 'subscription', 'saas'],
    'professional': ['consulting', 'legal', 'accounting']
  };
  
  const lowerDesc = description.toLowerCase();
  
  for (const [category, keywords] of Object.entries(categories)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      return category;
    }
  }
  
  return 'general';
}

module.exports = {
  createInvoice,
  recordTransaction,
  generateBalanceSheet,
  getInvoices,
  getTransactions
};
