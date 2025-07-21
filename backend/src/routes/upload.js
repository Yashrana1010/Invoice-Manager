const express = require('express');
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../middleware/auth');
const { parseDocument, validateFile } = require('../services/documentParsingService');
const { extractInvoiceData } = require('../services/invoiceExtractionService');
const { createInvoice } = require('../services/openBookService');
const logger = require('../utils/logger');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const errors = validateFile(file);
    if (errors.length > 0) {
      return cb(new Error(errors.join(', ')), false);
    }
    cb(null, true);
  }
});

// Upload and process invoice document
router.post('/invoice', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    const { autoCreate = false } = req.body;

    logger.info(`Processing uploaded file: ${req.file.originalname} for user ${userId}`);

    // Parse the document
    const documentText = await parseDocument(req.file.path, req.file.mimetype);
    
    if (!documentText || documentText.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Could not extract readable text from the document' 
      });
    }

    // Extract invoice data using AI
    const extractedData = await extractInvoiceData(documentText);

    let response = {
      message: 'Document processed successfully',
      extractedData,
      documentText: documentText.substring(0, 500) + (documentText.length > 500 ? '...' : ''),
      suggestions: generateSuggestions(extractedData)
    };

    // Auto-create invoice if requested and we have enough data
    if (autoCreate && canAutoCreateInvoice(extractedData)) {
      try {
        const invoiceData = {
          client: extractedData.clientName,
          amount: extractedData.totalAmount,
          description: extractedData.description || 'Services as per uploaded invoice',
          date: extractedData.invoiceDate || new Date().toISOString().split('T')[0],
          userId
        };

        const invoice = await createInvoice(invoiceData);
        response.invoice = invoice;
        response.message = 'Document processed and invoice created successfully';
        response.autoCreated = true;
      } catch (invoiceError) {
        logger.error('Auto-create invoice error:', invoiceError);
        response.autoCreateError = 'Failed to auto-create invoice: ' + invoiceError.message;
      }
    }

    res.json(response);
  } catch (error) {
    logger.error('Upload processing error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        const fs = require('fs').promises;
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.warn('Failed to cleanup uploaded file:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to process document',
      details: error.message 
    });
  }
});

// Upload and extract data without creating invoice
router.post('/extract', authenticateToken, upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.userId;
    logger.info(`Extracting data from: ${req.file.originalname} for user ${userId}`);

    // Parse the document
    const documentText = await parseDocument(req.file.path, req.file.mimetype);
    
    // Extract data using AI
    const extractedData = await extractInvoiceData(documentText);

    res.json({
      message: 'Data extracted successfully',
      extractedData,
      documentText: documentText.substring(0, 1000) + (documentText.length > 1000 ? '...' : ''),
      fileName: req.file.originalname,
      fileSize: req.file.size,
      suggestions: generateSuggestions(extractedData)
    });
  } catch (error) {
    logger.error('Extract processing error:', error);
    
    if (req.file) {
      try {
        const fs = require('fs').promises;
        await fs.unlink(req.file.path);
      } catch (unlinkError) {
        logger.warn('Failed to cleanup uploaded file:', unlinkError);
      }
    }

    res.status(500).json({ 
      error: 'Failed to extract data from document',
      details: error.message 
    });
  }
});

// Get supported file types
router.get('/supported-types', (req, res) => {
  const { getSupportedTypes } = require('../services/documentParsingService');
  res.json({
    supportedTypes: getSupportedTypes(),
    maxFileSize: '10MB',
    description: 'Supported file types for invoice processing'
  });
});

function canAutoCreateInvoice(extractedData) {
  return extractedData.clientName && 
         extractedData.totalAmount && 
         extractedData.totalAmount > 0 &&
         extractedData.confidence > 0.6;
}

function generateSuggestions(extractedData) {
  const suggestions = [];
  
  if (!extractedData.clientName) {
    suggestions.push('Consider adding client name manually if not detected');
  }
  
  if (!extractedData.totalAmount) {
    suggestions.push('Please verify the invoice amount was correctly extracted');
  }
  
  if (!extractedData.invoiceDate) {
    suggestions.push('Consider adding the invoice date manually');
  }
  
  if (extractedData.confidence < 0.7) {
    suggestions.push('Low confidence extraction - please review all fields carefully');
  }
  
  if (extractedData.taxAmount && !extractedData.subtotal) {
    suggestions.push('Tax amount detected but no subtotal - please verify amounts');
  }

  return suggestions;
}

module.exports = router;
