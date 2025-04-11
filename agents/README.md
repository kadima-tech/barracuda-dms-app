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

## Running Agents

From the parent directory of the agent (the `agents` folder), run:

```bash
# Run in the terminal
adk run basic_agent

# OR launch the web UI
adk web

# OR start the API server
adk api_server
```

## Example Prompts

- "What is the weather in New York?"
- "What is the time in New York?"
