/**
 * Agent Configuration
 *
 * This file contains the configuration for integrating with ADK (Agent Development Kit) agents.
 * It provides constants and settings for connecting to your locally running agent.
 *
 * See the ADK documentation for more details:
 * https://google.github.io/adk-docs/get-started/local-testing/
 */

interface AgentConfig {
  /** The base URL for your ADK API server */
  apiUrl: string;
  /** Default agent name to use for chat */
  defaultAgentName: string;
  /** Default user ID to use for chat sessions */
  defaultUserId: string;
}

/**
 * Agent configuration object
 *
 * Update these settings based on your local ADK setup:
 * - apiUrl: The URL where your ADK API server is running
 * - defaultAgentName: The name of your agent folder
 * - defaultUserId: The user ID to use for chat sessions
 */
export const agentConfig: AgentConfig = {
  apiUrl: 'http://localhost:8000',
  defaultAgentName: 'exchange_agent',
  defaultUserId: 'user',
};

/**
 * Helper function to create a session with an agent
 *
 * @param agentName - The name of the agent to create a session with
 * @param userId - The user ID to create a session for
 * @param initialState - Optional initial state to set for the session
 * @returns The session ID if successful, null otherwise
 */
export const createAgentSession = async (
  agentName: string = agentConfig.defaultAgentName,
  userId: string = agentConfig.defaultUserId,
  initialState: Record<string, unknown> = {}
): Promise<string | null> => {
  const sessionId = `s_${Date.now()}`;

  try {
    const response = await fetch(
      `${agentConfig.apiUrl}/apps/${agentName}/users/${userId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ state: initialState }),
      }
    );

    if (!response.ok) {
      console.error('Failed to create agent session:', await response.json());
      return null;
    }

    return sessionId;
  } catch (error) {
    console.error('Error creating agent session:', error);
    return null;
  }
};

/**
 * Helper function to send a message to an agent
 *
 * @param message - The message to send to the agent
 * @param agentName - The name of the agent to send the message to
 * @param userId - The user ID for the session
 * @param sessionId - The session ID to use
 * @returns The agent's response events if successful, null otherwise
 */
export const sendMessageToAgent = async (
  message: string,
  sessionId: string,
  agentName: string = agentConfig.defaultAgentName,
  userId: string = agentConfig.defaultUserId
) => {
  try {
    const response = await fetch(`${agentConfig.apiUrl}/run`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_name: agentName,
        user_id: userId,
        session_id: sessionId,
        new_message: {
          role: 'user',
          parts: [{ text: message }],
        },
      }),
    });

    if (!response.ok) {
      console.error('Failed to send message to agent:', await response.json());
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message to agent:', error);
    return null;
  }
};

export default agentConfig;
