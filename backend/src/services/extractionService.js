const logger = require('../utils/logger');

// Regex patterns for extracting financial data
const patterns = {
  amount: /\$?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/g,
  date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\d{4}-\d{2}-\d{2})/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  clientName: /(?:for|to|from)\s+([A-Za-z\s]{2,30})(?:\s|$|\.|,)/gi,
  invoiceNumber: /(?:invoice|inv)[\s#]*(\d+)/gi,
  percentage: /(\d+(?:\.\d+)?)\s*%/g
};

function extractFinancialData(message) {
  const data = {};
  
  try {
    // Extract amounts
    const amounts = message.match(patterns.amount);
    if (amounts && amounts.length > 0) {
      // Take the first amount found and clean it
      data.amount = amounts[0].replace(/[$,]/g, '');
    }

    // Extract dates
    const dates = message.match(patterns.date);
    if (dates && dates.length > 0) {
      data.date = normalizeDate(dates[0]);
    }

    // Extract client names
    const clientMatches = [...message.matchAll(patterns.clientName)];
    if (clientMatches && clientMatches.length > 0) {
      data.client = clientMatches[0][1].trim();
    }

    // Extract email addresses
    const emails = message.match(patterns.email);
    if (emails && emails.length > 0) {
      data.email = emails[0];
    }

    // Extract invoice numbers
    const invoiceMatches = [...message.matchAll(patterns.invoiceNumber)];
    if (invoiceMatches && invoiceMatches.length > 0) {
      data.invoiceNumber = invoiceMatches[0][1];
    }

    // Extract description/purpose (simple heuristic)
    data.description = extractDescription(message, data);

    logger.info(`Extracted data: ${JSON.stringify(data)}`);
    return data;
  } catch (error) {
    logger.error('Data extraction error:', error);
    return {};
  }
}

function normalizeDate(dateString) {
  try {
    // Handle different date formats
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
  } catch (error) {
    return null;
  }
}

function extractDescription(message, extractedData) {
  // Remove already extracted data from message to get description
  let cleanMessage = message.toLowerCase();
  
  // Remove common invoice/transaction phrases
  const removePatterns = [
    /create\s+(?:an?\s+)?invoice/gi,
    /send\s+(?:an?\s+)?invoice/gi,
    /record\s+(?:a\s+)?transaction/gi,
    /for\s+\$?\d+/gi,
    /to\s+[a-z\s]+/gi,
    /from\s+[a-z\s]+/gi
  ];

  removePatterns.forEach(pattern => {
    cleanMessage = cleanMessage.replace(pattern, ' ');
  });

  // Remove extracted client name and amount
  if (extractedData.client) {
    cleanMessage = cleanMessage.replace(new RegExp(extractedData.client.toLowerCase(), 'gi'), ' ');
  }
  if (extractedData.amount) {
    cleanMessage = cleanMessage.replace(new RegExp(`\\$?${extractedData.amount}`, 'gi'), ' ');
  }

  // Clean up and extract meaningful description
  cleanMessage = cleanMessage.replace(/\s+/g, ' ').trim();
  
  // Look for common service descriptions
  const servicePatterns = [
    /(?:for\s+)?(consulting|development|design|marketing|legal|accounting|maintenance|support|training|writing)/gi,
    /(?:for\s+)?(website|app|logo|branding|seo|content|photography|video)/gi
  ];

  for (const pattern of servicePatterns) {
    const match = cleanMessage.match(pattern);
    if (match) {
      return match[0].replace(/^for\s+/i, '').trim();
    }
  }

  // If no specific service found, return cleaned message or default
  return cleanMessage.length > 3 && cleanMessage.length < 100 ? cleanMessage : 'Professional services';
}

// Additional utility functions for specific extractions
function extractClientInfo(message) {
  const clientInfo = {};
  
  // More sophisticated client name extraction
  const clientPatterns = [
    /(?:client|customer|for|to)\s+([A-Z][a-z]+\s+[A-Z][a-z]+)/g,
    /([A-Z][a-z]+\s+[A-Z][a-z]+)(?:\s+owes|\s+paid|\s+invoice)/g
  ];

  for (const pattern of clientPatterns) {
    const match = message.match(pattern);
    if (match) {
      clientInfo.name = match[1];
      break;
    }
  }

  return clientInfo;
}

function extractInvoiceDetails(message) {
  const details = {};
  
  // Extract due date
  const dueDatePattern = /due\s+(?:on\s+)?(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/gi;
  const dueDateMatch = message.match(dueDatePattern);
  if (dueDateMatch) {
    details.dueDate = normalizeDate(dueDateMatch[0].replace(/due\s+(?:on\s+)?/gi, ''));
  }

  // Extract payment terms
  const termsPattern = /(?:net\s+)?(\d+)\s+days?/gi;
  const termsMatch = message.match(termsPattern);
  if (termsMatch) {
    details.paymentTerms = `Net ${termsMatch[0].match(/\d+/)[0]} days`;
  }

  return details;
}

module.exports = {
  extractFinancialData,
  extractClientInfo,
  extractInvoiceDetails
};
