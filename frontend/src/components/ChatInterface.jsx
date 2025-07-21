import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Paperclip } from 'lucide-react';
import axios from 'axios';
import FileUpload from './FileUpload';

export default function ChatInterface() {
  const [messages, setMessages] = useState([
    {
      id: '1',
      content: 'Hello! I\'m your AI finance assistant. I can help you create invoices, record transactions, generate balance sheets, and process uploaded invoice documents. What would you like to do today?',
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = {
      id: Date.now().toString(),
      content: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await axios.post('/api/chat/message', {
        message: input,
        conversationId: 'default'
      });

      const botMessage = {
        id: (Date.now() + 1).toString(),
        content: response.data.message,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data.data
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        content: 'Sorry, I encountered an error. Please try again.',
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileUploadSuccess = (uploadData) => {
    const uploadMessage = {
      id: Date.now().toString(),
      content: `📄 Document uploaded and processed successfully!\n\n${generateUploadSummary(uploadData.extractedData)}`,
      sender: 'bot',
      timestamp: new Date(),
      data: uploadData.extractedData,
      type: 'file-upload'
    };

    setMessages(prev => [...prev, uploadMessage]);
    setShowFileUpload(false);

    // Suggest next actions
    setTimeout(() => {
      const suggestionMessage = {
        id: (Date.now() + 1).toString(),
        content: generateUploadSuggestions(uploadData.extractedData),
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, suggestionMessage]);
    }, 1000);
  };

  const handleFileUploadError = (error) => {
    const errorMessage = {
      id: Date.now().toString(),
      content: `❌ File upload failed: ${error}\n\nPlease try uploading a different file or check the file format.`,
      sender: 'bot',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, errorMessage]);
    setShowFileUpload(false);
  };

  const generateUploadSummary = (extractedData) => {
    let summary = 'Extracted Information:\n';

    if (extractedData.clientName) {
      summary += `👤 Client: ${extractedData.clientName}\n`;
    }
    if (extractedData.totalAmount) {
      summary += `💰 Amount: $${extractedData.totalAmount}\n`;
    }
    if (extractedData.invoiceNumber) {
      summary += `📄 Invoice #: ${extractedData.invoiceNumber}\n`;
    }
    if (extractedData.invoiceDate) {
      summary += `📅 Date: ${extractedData.invoiceDate}\n`;
    }
    if (extractedData.description) {
      summary += `📝 Description: ${extractedData.description}\n`;
    }

    summary += `\n🎯 Confidence: ${(extractedData.confidence * 100).toFixed(1)}%`;

    return summary;
  };

  const generateUploadSuggestions = (extractedData) => {
    const hasRequiredFields = extractedData.clientName && extractedData.totalAmount;

    if (hasRequiredFields) {
      return `✨ What would you like to do next?\n\n• Say "Create an invoice" to generate a new invoice with this data\n• Ask me to "Record this as a transaction"\n• Request a "Balance sheet update"\n• Upload another document`;
    } else {
      return `⚠️ Missing Information Detected\n\nTo create an invoice, I'll need:\n${!extractedData.clientName ? '• Client name\n' : ''}${!extractedData.totalAmount ? '• Invoice amount\n' : ''}${!extractedData.description ? '• Description (optional)\n' : ''}\n\nYou can provide this information by typing: "Create an invoice for [client] for $[amount]"`;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-6xl mx-auto relative">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className="flex items-start space-x-2 max-w-xs md:max-w-2xl">
              {message.sender === 'bot' && (
                <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`chat-message ${message.sender === 'user' ? 'chat-user' : 'chat-bot'}`}>
                <div className="text-sm whitespace-pre-line">{message.content}</div>
                {message.data && message.type === 'file-upload' && (
                  <div className="mt-3 p-3 bg-white/20 rounded-lg">
                    <div className="text-xs font-medium mb-2">Extracted Data:</div>
                    <pre className="text-xs overflow-x-auto">
                      {JSON.stringify(message.data, null, 2)}
                    </pre>
                  </div>
                )}
                {message.data && message.type !== 'file-upload' && (
                  <div className="mt-2 p-2 bg-white/20 rounded text-xs">
                    <pre>{JSON.stringify(message.data, null, 2)}</pre>
                  </div>
                )}
              </div>
              {message.sender === 'user' && (
                <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="flex items-start space-x-2">
              <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="chat-message chat-bot">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="border bg-white p-4 mb-4 rounded-lg border-gray-800">
        <div className="flex space-x-2">
          <button
            onClick={() => setShowFileUpload(!showFileUpload)}
            className="p-2 text-gray-500 hover:text-primary-500 transition-colors"
            title="Upload document"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or upload a document... (e.g., 'Create an invoice for John Doe for $500')"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            rows="2"
            disabled={loading}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          💡 Tip: Upload invoice documents using the paperclip icon for automatic data extraction
        </div>
      </div>

      {/* Full Screen Modal with Backdrop Blur */}
      {showFileUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop with blur effect */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowFileUpload(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Invoice Document</h3>
                <p className="text-sm text-gray-600">
                  Upload an invoice PDF, image, or text file and I'll extract the information for you using AI.
                </p>
              </div>

              <FileUpload
                onUploadSuccess={handleFileUploadSuccess}
                onUploadError={handleFileUploadError}
              />

              <div className="mt-6 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  <p>Supported formats: PDF, TXT, JPG, PNG • Max size: 10MB</p>
                </div>
                <button
                  onClick={() => setShowFileUpload(false)}
                  className="px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
