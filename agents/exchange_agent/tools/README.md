# Exchange Agent Tools

This directory contains the tools used by the Exchange Agent to interact with Microsoft Exchange services for room booking and management through the Microsoft Graph API.

## Tool Categories

### DateTime Tools (`datetime_tools.py`)

| Tool                     | Description                                                                                          |
| ------------------------ | ---------------------------------------------------------------------------------------------------- |
| `get_current_datetime()` | Returns current date and time in multiple formats (ISO, formatted, timestamp, individual components) |

### Room Tools (`room_tools.py`)

| Tool                                          | Description                                                              |
| --------------------------------------------- | ------------------------------------------------------------------------ |
| `get_all_rooms()`                             | Lists all available meeting rooms with details using Microsoft Graph API |
| `get_room_info(room_id, force_refresh=False)` | Gets detailed room information including events schedule                 |
| `get_room_availability(room_id)`              | Checks if a room is currently available based on its calendar            |
| `list_available_rooms()`                      | Lists all rooms that are currently available by checking their calendars |
| `_get_graph_client()`                         | (Internal) Creates an authenticated Microsoft Graph API client           |

### Booking Tools (`booking_tools.py`)

| Tool                                                                | Description                                                                         |
| ------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `book_room(room_id, subject, start_time, end_time, attendees=None)` | Books a room by creating a calendar event via Microsoft Graph API                   |
| `cancel_meeting(room_id, meeting_id)`                               | Cancels a meeting by deleting the calendar event                                    |
| `parse_datetime(datetime_str)`                                      | Utility function that parses various datetime formats including relative references |

### Authentication Tools (`auth_tools.py`)

| Tool                            | Description                                                          |
| ------------------------------- | -------------------------------------------------------------------- |
| `check_auth_status()`           | Checks if authenticated with Exchange by verifying access token      |
| `get_authorization_url()`       | Generates a Microsoft OAuth URL for authorization                    |
| `exchange_code_for_token(code)` | Exchanges an OAuth authorization code for an access token            |
| `_load_token_cache()`           | (Internal) Loads authentication tokens from disk cache               |
| `_save_token_cache(token_data)` | (Internal) Saves authentication tokens to disk cache                 |
| `_refresh_token()`              | (Internal) Refreshes an expired access token using the refresh token |

## Example Usage

```python
from agents.exchange_agent.tools import get_current_datetime, list_available_rooms, book_room

# Get current time
time_info = get_current_datetime()
print(f"Current time: {time_info['current_datetime']['formatted']}")

# Check available rooms
available = list_available_rooms()
for room in available['available_rooms']:
    print(f"Available: {room['name']} (Capacity: {room['capacity']})")

# Book a room
booking = book_room(
    room_id="room1",
    subject="Team Meeting",
    start_time="today at 2pm",
    end_time="today at 3pm",
    attendees=["john@example.com", "jane@example.com"]
)
print(f"Booked {booking['booking']['roomName']} for {booking['booking']['subject']}")
```

## Microsoft Graph API Integration

These tools use the Microsoft Graph API to interact with Exchange Online. The implementation:

1. Uses Azure Identity and Microsoft Graph SDK for authentication
2. Caches authentication tokens locally for performance
3. Implements token refresh for long-running processes
4. Handles API response data formatting

## Natural Language Time References

The `parse_datetime()` function supports various formats:

- Relative references: "now", "today at 2pm", "tomorrow at 3:30pm", "in 2 hours"
- ISO format: "2025-04-11T14:30:00"
- Common formats: "2025-04-11 14:30", "04/11/2025 14:30", etc.

This allows for natural language booking requests like "Book the conference room today at 3pm."

## Error Handling

All tools implement graceful error handling with fallback to mock/simulated data when the API is unavailable or not properly configured. This enables the agent to function in demonstration mode when not connected to Exchange.
