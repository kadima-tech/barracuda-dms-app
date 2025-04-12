# ChatBox Component for ADK Agent Integration

This component provides a floating chat interface that communicates with your local ADK (Agent Development Kit) agent.

## Prerequisites

- An ADK agent running locally on port 8000
- The agent should be accessible at `http://localhost:8000`

## How to Use

1. Make sure your ADK agent is running:

```bash
cd your-agent-directory
adk api_server
```

2. Import and add the ChatBox component to your application:

```tsx
import ChatBox from './components/ChatBox';

function App() {
  return (
    <div>
      {/* Your app content */}
      <ChatBox agentName="your_agent_name" userId="user_id" />
    </div>
  );
}
```

## Props

| Prop        | Type   | Default | Description                          |
| ----------- | ------ | ------- | ------------------------------------ |
| `agentName` | string | "Agent" | The name of your agent folder        |
| `userId`    | string | "user"  | The user ID to use for chat sessions |

## How It Works

1. When the chat icon is clicked, the component creates a new session with your agent
2. Messages are sent to the agent using the `/run` endpoint
3. Responses from the agent are displayed in the chat window

## ADK Integration

This component follows the ADK documentation for local testing:
https://google.github.io/adk-docs/get-started/local-testing/

It implements:

- Creating a new session with the agent
- Sending messages to the agent
- Receiving and displaying responses from the agent

## Customization

You can customize the appearance of the chat interface by modifying the styled components in `ChatBox.tsx`.

## Troubleshooting

If you encounter issues:

1. Make sure your ADK agent is running on port 8000
2. Check browser console for any error messages
3. Verify your agent name matches the name of your agent folder
4. If CORS issues occur, you may need to configure your ADK server to allow cross-origin requests

## Advanced Usage

For more advanced usage, see the agent configuration file at `src/config/agentConfig.ts` which provides helper functions for:

- Creating agent sessions
- Sending messages to agents
- Configuring agent connection parameters
