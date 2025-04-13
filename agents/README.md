# Barracuda DMS Agents

This directory contains agent implementations using Google's Agent Development Kit (ADK).

## Setup

1. Create a Python virtual environment:

```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install the ADK:

```bash
pip install google-adk
```

3. Configure your API keys in the `.env` file inside each agent directory.

## Available Agents

### Basic Agent

Located in `basic_agent/`, this agent can:

- Provide weather information for New York
- Tell the current time in New York

### Microsoft Exchange Agent

Located in `exchange_agent/`, this agent can:

- List all available meeting rooms
- Get detailed information about specific rooms
- Check which rooms are currently available (uses current date/time automatically)
- Book rooms for meetings with natural language time references (e.g., "today at 2pm")
- Cancel meetings
- Check authentication status
- Generate authorization URLs

The Exchange agent has built-in knowledge of the current date and time, so you don't need to specify those when asking about current availability.

## Running Agents

From the parent directory of the agent (the `agents` folder), run:

```bash
# Run in the terminal
adk run basic_agent
# OR
adk run exchange_agent

# OR launch the web UI (and select agent from dropdown)
adk web

# OR start the API server
adk api_server
```

## Example Prompts

### Basic Agent

- "What is the weather in New York?"
- "What is the time in New York?"

### Exchange Agent

- "List all available rooms"
- "Which rooms are available right now?"
- "Get information about Conference Room A"
- "Is the Board Room currently available?"
- "Book the Board Room for a team meeting today at 2pm"
- "Book Meeting Room B for a project review tomorrow from 10am to 11:30am"
- "Cancel my meeting in Conference Room A"
- "Am I authenticated with Exchange?"
