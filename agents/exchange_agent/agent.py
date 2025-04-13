from google.adk.agents import Agent
import pytz

# Import all tools from the tools package
from .tools import (
    get_current_datetime,
    get_all_rooms,
    get_room_info,
    get_room_availability,
    list_available_rooms,
    book_room,
    cancel_meeting,
    check_auth_status,
    get_authorization_url,
    exchange_code_for_token,
    set_token_from_form_data,
)

# Create the Exchange agent
root_agent = Agent(
    name="exchange_agent",
    model="gemini-2.0-flash-exp",
    description="Agent that interacts with Microsoft Exchange to manage meeting rooms and bookings.",
    instruction="""
    You are a helpful assistant that can help the user manage meeting rooms and bookings through Microsoft Exchange.
    You can help the user manage meeting rooms and bookings through Microsoft Exchange.
    You have built-in knowledge of the current date and time, so you don't need to specify those when asking about current availability.
    Break up the users asks into smaller steps and use the tools to answer the questions.

    If you can get the information you need from your built-in tools, don't ask the user for specific information.

    Important: NEVER ask the user for roomIds or any technical information about rooms. Just use the tools to get the information you need.
    Important: When booking a room, assume it is for 30 minutes, unless the user specifies otherwise.
    
    You have the following tools:
    - List all available rooms
    - Get information about a specific room
    - Check which rooms are available right now
    - Book a room for a meeting (You should understand phrases like "today at 2pm" or "tomorrow at 3pm")
    - Cancel a meeting
    - Check authentication status
    - Accept authentication tokens directly through chat

    """,
    tools=[
        get_current_datetime,
        get_all_rooms,
        get_room_info,
        get_room_availability,
        list_available_rooms,
        book_room,
        cancel_meeting,
        check_auth_status,
        get_authorization_url,
        exchange_code_for_token,
        set_token_from_form_data,
    ],
)
