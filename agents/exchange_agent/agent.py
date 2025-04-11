from google.adk.agents import Agent
from typing import List, Dict, Any, Optional
import datetime
import pytz


def get_current_datetime() -> Dict[str, Any]:
    """Gets the current date and time in a structured format.

    Returns:
        dict: Status and current date/time information.
    """
    now = datetime.datetime.now()

    # Format date in various useful formats
    return {
        "status": "success",
        "current_datetime": {
            "iso": now.isoformat(),
            "date": now.strftime("%Y-%m-%d"),
            "time": now.strftime("%H:%M:%S"),
            "day_of_week": now.strftime("%A"),
            "formatted": now.strftime("%B %d, %Y at %I:%M:%S %p"),
            "timestamp": now.timestamp(),
            "year": now.year,
            "month": now.month,
            "day": now.day,
            "hour": now.hour,
            "minute": now.minute,
            "second": now.second,
        },
    }


def get_all_rooms() -> Dict[str, Any]:
    """Retrieves all available meeting rooms from Microsoft Exchange.

    Returns:
        dict: Status and list of rooms or error message.
    """
    # This would connect to the actual Exchange API in production
    rooms = [
        {
            "id": "room1",
            "name": "Conference Room A",
            "email": "rooma@example.com",
            "capacity": 10,
            "building": "Main Building",
            "floor": 1,
        },
        {
            "id": "room2",
            "name": "Meeting Room B",
            "email": "roomb@example.com",
            "capacity": 6,
            "building": "Main Building",
            "floor": 2,
        },
        {
            "id": "room3",
            "name": "Board Room",
            "email": "boardroom@example.com",
            "capacity": 20,
            "building": "Executive Wing",
            "floor": 3,
        },
    ]

    return {"status": "success", "rooms": rooms}


def get_room_availability(room_id: str) -> Dict[str, Any]:
    """Checks if a room is currently available.

    Args:
        room_id (str): The ID of the room to check.

    Returns:
        dict: Status and availability information.
    """
    # Get room info first
    room_info_result = get_room_info(room_id)
    if room_info_result["status"] == "error":
        return room_info_result

    room = room_info_result["room"]
    events = room["events"]

    # Get current time
    now = datetime.datetime.now()
    now_str = now.strftime("%Y-%m-%dT%H:%M:%S")

    # Check if there are any ongoing meetings
    for event in events:
        start_time = datetime.datetime.fromisoformat(
            event["start"]["dateTime"].replace("Z", "+00:00")
        )
        end_time = datetime.datetime.fromisoformat(
            event["end"]["dateTime"].replace("Z", "+00:00")
        )

        if start_time <= now <= end_time:
            return {
                "status": "success",
                "room_id": room_id,
                "room_name": room["name"],
                "available": False,
                "current_meeting": {
                    "id": event["id"],
                    "subject": event["subject"],
                    "start": event["start"]["dateTime"],
                    "end": event["end"]["dateTime"],
                    "organizer": (
                        event["organizer"]["emailAddress"]["name"]
                        if "organizer" in event and "emailAddress" in event["organizer"]
                        else "Unknown"
                    ),
                },
                "current_time": now_str,
            }

    # If we get here, the room is available
    return {
        "status": "success",
        "room_id": room_id,
        "room_name": room["name"],
        "available": True,
        "current_time": now_str,
    }


def get_room_info(room_id: str, force_refresh: bool = False) -> Dict[str, Any]:
    """Retrieves detailed information about a specific room, including its availability.

    Args:
        room_id (str): The ID of the room to retrieve information for.
        force_refresh (bool, optional): Whether to force refresh room data. Defaults to False.

    Returns:
        dict: Status and room details or error message.
    """
    # Get current time
    now = datetime.datetime.now()

    # Simulated rooms data with events in the context of the current day
    today_date = now.strftime("%Y-%m-%d")

    # Simulated rooms data
    rooms_data = {
        "room1": {
            "id": "room1",
            "name": "Conference Room A",
            "email": "rooma@example.com",
            "capacity": 10,
            "building": "Main Building",
            "floor": 1,
            "events": [
                {
                    "id": "event1",
                    "subject": "Team Meeting",
                    "start": {"dateTime": f"{today_date}T10:00:00"},
                    "end": {"dateTime": f"{today_date}T11:00:00"},
                    "organizer": {"emailAddress": {"name": "John Doe"}},
                }
            ],
        },
        "room2": {
            "id": "room2",
            "name": "Meeting Room B",
            "email": "roomb@example.com",
            "capacity": 6,
            "building": "Main Building",
            "floor": 2,
            "events": [],
        },
        "room3": {
            "id": "room3",
            "name": "Board Room",
            "email": "boardroom@example.com",
            "capacity": 20,
            "building": "Executive Wing",
            "floor": 3,
            "events": [
                {
                    "id": "event2",
                    "subject": "Board Meeting",
                    "start": {"dateTime": f"{today_date}T14:00:00"},
                    "end": {"dateTime": f"{today_date}T16:00:00"},
                    "organizer": {"emailAddress": {"name": "Jane Smith"}},
                }
            ],
        },
    }

    if room_id in rooms_data:
        return {"status": "success", "room": rooms_data[room_id]}
    else:
        return {
            "status": "error",
            "error_message": f"Room with ID '{room_id}' not found.",
        }


def parse_datetime(datetime_str: str) -> datetime.datetime:
    """Helper function to parse datetime strings including relative references.

    Args:
        datetime_str (str): Datetime string which can be absolute or relative

    Returns:
        datetime.datetime: Parsed datetime object
    """
    now = datetime.datetime.now()

    # Handle relative time references
    if "now" in datetime_str.lower():
        return now

    if "today" in datetime_str.lower():
        # Extract time from string like "today at 2pm"
        time_part = datetime_str.lower().split("at")[-1].strip()
        if "pm" in time_part or "am" in time_part:
            try:
                time_obj = datetime.datetime.strptime(time_part, "%I%p").time()
                return datetime.datetime.combine(now.date(), time_obj)
            except ValueError:
                try:
                    time_obj = datetime.datetime.strptime(time_part, "%I:%M%p").time()
                    return datetime.datetime.combine(now.date(), time_obj)
                except ValueError:
                    # If we can't parse the time, return now
                    return now

    if "tomorrow" in datetime_str.lower():
        tomorrow = now + datetime.timedelta(days=1)
        # Extract time from string like "tomorrow at 2pm"
        time_part = datetime_str.lower().split("at")[-1].strip()
        if "pm" in time_part or "am" in time_part:
            try:
                time_obj = datetime.datetime.strptime(time_part, "%I%p").time()
                return datetime.datetime.combine(tomorrow.date(), time_obj)
            except ValueError:
                try:
                    time_obj = datetime.datetime.strptime(time_part, "%I:%M%p").time()
                    return datetime.datetime.combine(tomorrow.date(), time_obj)
                except ValueError:
                    # If we can't parse the time, return tomorrow at 9am
                    return datetime.datetime.combine(
                        tomorrow.date(), datetime.time(9, 0)
                    )

    # Try to parse as ISO format
    try:
        return datetime.datetime.fromisoformat(datetime_str.replace("Z", "+00:00"))
    except ValueError:
        pass

    # Try various common formats
    formats = [
        "%Y-%m-%dT%H:%M:%S",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
        "%m/%d/%Y %H:%M",
        "%m/%d/%Y",
    ]

    for fmt in formats:
        try:
            return datetime.datetime.strptime(datetime_str, fmt)
        except ValueError:
            continue

    # If all parsing fails, return current time
    return now


def book_room(
    room_id: str,
    subject: str,
    start_time: str,
    end_time: str,
    attendees: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """Books a meeting room for a specified time period.

    Args:
        room_id (str): The ID of the room to book.
        subject (str): The subject/title of the meeting.
        start_time (str): Start time (can be ISO format or relative like "today at 2pm").
        end_time (str): End time (can be ISO format or relative like "today at 3pm").
        attendees (List[str], optional): List of email addresses of attendees. Defaults to None.

    Returns:
        dict: Status and booking details or error message.
    """
    # Check if room exists
    room_info = get_room_info(room_id)
    if room_info["status"] == "error":
        return room_info

    # Parse start and end times, handling relative references
    start_datetime = parse_datetime(start_time)
    end_datetime = parse_datetime(end_time)

    # Convert to ISO format for consistency
    start_iso = start_datetime.isoformat()
    end_iso = end_datetime.isoformat()

    # In a real implementation, this would call the Exchange API to create a meeting
    meeting_id = f"meeting-{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"

    return {
        "status": "success",
        "booking": {
            "meetingId": meeting_id,
            "roomId": room_id,
            "roomName": room_info["room"]["name"],
            "subject": subject,
            "start": start_iso,
            "end": end_iso,
            "attendees": attendees or [],
        },
    }


def list_available_rooms() -> Dict[str, Any]:
    """Lists all rooms that are currently available.

    Returns:
        dict: Status and list of available rooms.
    """
    all_rooms_result = get_all_rooms()
    if all_rooms_result["status"] == "error":
        return all_rooms_result

    available_rooms = []

    for room in all_rooms_result["rooms"]:
        availability = get_room_availability(room["id"])
        if availability["status"] == "success" and availability["available"]:
            available_rooms.append(
                {
                    "id": room["id"],
                    "name": room["name"],
                    "capacity": room["capacity"],
                    "building": room["building"],
                    "floor": room["floor"],
                }
            )

    return {
        "status": "success",
        "available_rooms": available_rooms,
        "current_time": datetime.datetime.now().isoformat(),
    }


def cancel_meeting(room_id: str, meeting_id: str) -> Dict[str, Any]:
    """Cancels a previously booked meeting.

    Args:
        room_id (str): The ID of the room where the meeting was booked.
        meeting_id (str): The ID of the meeting to cancel.

    Returns:
        dict: Status and result or error message.
    """
    # In a real implementation, this would call the Exchange API to cancel the meeting

    # Simulate success (in a real app, would verify the meeting exists)
    return {
        "status": "success",
        "message": f"Meeting {meeting_id} in room {room_id} has been successfully cancelled.",
    }


def check_auth_status() -> Dict[str, Any]:
    """Checks if the application is authenticated with Microsoft Exchange.

    Returns:
        dict: Authentication status.
    """
    # Simulate being authenticated
    return {"status": "success", "authenticated": True}


def get_authorization_url() -> Dict[str, Any]:
    """Generates a URL for authorizing the application with Microsoft Exchange.

    Returns:
        dict: Status and authorization URL or error message.
    """
    # In a real implementation, this would generate an OAuth URL
    auth_url = "https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=YOUR_CLIENT_ID&response_type=code&redirect_uri=YOUR_REDIRECT_URI&scope=Calendars.ReadWrite%20Calendars.Read.Shared"

    return {"status": "success", "authorization_url": auth_url}


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
    
    You have the following tools:
    - List all available rooms
    - Get information about a specific room
    - Check which rooms are available right now
    - Book a room for a meeting (You should understand phrases like "today at 2pm" or "tomorrow at 3pm")
    - Cancel a meeting
    - Check authentication status
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
    ],
)
