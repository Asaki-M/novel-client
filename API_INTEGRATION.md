# Novel Client API Integration

This client application has been integrated with the novel-server API to provide real character management and chat functionality.

## Setup

1. **Environment Variables**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env`:
   ```
   VITE_API_BASE_URL=http://localhost:3000
   ```

2. **Backend Server**
   Ensure your novel-server backend is running on `http://localhost:3000` with the following environment variables:
   - `OPENROUTER_API_KEY`: Your OpenRouter API key
   - `SUPABASE_URL`: Your Supabase project URL
   - `SUPABASE_ANON_KEY`: Your Supabase anonymous key

3. **Start the Application**
   ```bash
   npm run dev
   ```

## Features Implemented

### 📋 Character Management
- **Load Characters**: Automatically fetches characters from the API on app startup
- **Create Characters**: Add new characters with name, description, avatar, and system prompt
- **Real-time Updates**: Characters are immediately available after creation

### 💬 Chat Integration
- **Streaming Chat**: Real-time message streaming from the AI
- **Character Context**: Each character uses their system prompt for personalized responses
- **Session Management**: Separate chat history for each character
- **Error Handling**: Graceful error handling with user feedback

### 🎨 UI Features
- **Loading States**: Visual feedback during API operations
- **Error States**: Clear error messages when operations fail
- **Responsive Design**: Works on various screen sizes
- **Dark Mode**: Full dark mode support

## API Endpoints Used

- `GET /api/characters` - Fetch all characters
- `POST /api/characters` - Create new character
- `POST /api/chat` - Send chat messages (both streaming and non-streaming)
- `GET /api/health/db` - Health check (available but not actively used)

## File Structure

```
src/
├── services/
│   └── api.ts              # API client and types
├── hooks/
│   ├── useCharacters.ts    # Character management hook
│   └── useChat.ts          # Chat functionality hook
├── components/
│   └── role/               # Updated character components
└── pages/
    └── Home.tsx            # Main page with full integration
```

## Usage

1. **Creating a Character**:
   - Click the "+" button to add a new character
   - Fill in the character details including system prompt
   - The character will be created via API and immediately available

2. **Chatting**:
   - Select a character from the list
   - Type your message and press Enter or click Send
   - Watch the AI response stream in real-time
   - Each character maintains separate conversation history

3. **Switching Characters**:
   - Click on any character card to switch contexts
   - Each character has their own chat history
   - System prompts are automatically applied

## Error Handling

The application handles various error scenarios:
- Network connectivity issues
- API server downtime
- Invalid API responses
- Character creation failures
- Chat message failures

Users receive appropriate feedback for each error type.

## Development Notes

- The app uses React hooks for state management
- TypeScript is used throughout for type safety
- API responses are properly typed
- Error boundaries protect the UI from crashes
- Streaming is implemented for better UX during long responses