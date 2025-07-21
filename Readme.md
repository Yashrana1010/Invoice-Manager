# AI-Powered Invoice & Balance Sheet Manager

A smart financial management system that allows users to manage invoices and transactions through natural language conversations with an AI chatbot.

## Features

- 🤖 **Conversational AI Interface**: Interact with your finances using natural language
- 📊 **Real-time Balance Sheets**: Automatic generation of financial reports
- 📄 **Invoice Management**: Create and track invoices through chat
- 💰 **Transaction Recording**: Log income and expenses via conversations
- 🔒 **Secure Authentication**: JWT-based user authentication
- 🎨 **Modern UI**: React.js with Tailwind CSS
- 🔌 **API Integration**: OpenBook API for bookkeeping services

## Tech Stack

### Frontend
- React.js 18 with Vite
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls
- Lucide React for icons

### Backend
- Node.js with Express
- OpenAI GPT-4 for intent detection
- LangChain for prompt management
- PostgreSQL database
- JWT authentication
- Zod for validation
- Winston for logging

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd invoice-manager
   npm run setup
   ```

2. **Environment Setup**
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your API keys and database URL
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb invoice_manager
   
   # Run migrations
   cd backend
   npm run migrate
   ```

4. **Start Development**
   ```bash
   # From root directory
   npm run dev
   ```

   This starts both frontend (http://localhost:3000) and backend (http://localhost:5000)

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Chat
- `POST /api/chat/message` - Process chat message
- `GET /api/chat/history/:id` - Get conversation history

### Dashboard
- `GET /api/dashboard/summary` - Get dashboard data
- `GET /api/dashboard/balance-sheet` - Get balance sheet

### Invoices
- `GET /api/invoices` - Get all invoices
- `GET /api/invoices/transactions` - Get all transactions

## Environment Variables

Required environment variables:

```bash
# Database
DATABASE_URL=postgresql://localhost:5432/invoice_manager

# Authentication
JWT_SECRET=your-jwt-secret

# AI Services
OPENAI_API_KEY=your-openai-key

# Third-party APIs
OPENBOOK_API_KEY=your-openbook-key
```

## Development

### Project Structure
```
invoice-manager/
├── frontend/                 # React.js frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── contexts/        # React contexts
│   │   └── main.jsx         # Entry point
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   ├── middleware/      # Express middleware
│   │   └── utils/           # Utilities
└── package.json             # Root package.json
```

### Key Components

1. **AI Service** (`backend/src/services/aiService.js`)
   - Intent detection using OpenAI GPT-4
   - Message processing and response generation

2. **Extraction Service** (`backend/src/services/extractionService.js`)
   - Regex-based data extraction from user messages
   - Financial data parsing and validation

3. **OpenBook Service** (`backend/src/services/openBookService.js`)
   - Integration with third-party bookkeeping API
   - Invoice and transaction management

## Security Features

- HTTPS enforcement
- JWT token authentication
- Request rate limiting
- Input validation with Zod
- SQL injection prevention
- XSS protection with Helmet

## Demo Credentials

For testing purposes:
- Email: `demo@example.com`
- Password: `demo123`

## Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
