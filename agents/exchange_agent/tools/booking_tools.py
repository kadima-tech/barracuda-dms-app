import datetime
from typing import Dict, Any, List, Optional
import requests

from .room_tools import get_room_info, _make_request

# Configuration setting
LOCAL_EXCHANGE_API_URL = "http://localhost:8080/exchange"


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

    if "in" in datetime_str.lower() and "hour" in datetime_str.lower():
        try:
            # Parse strings like "in 2 hours"
            hours_str = datetime_str.lower().split("in")[1].split("hour")[0].strip()
            hours = int(hours_str)
            return now + datetime.timedelta(hours=hours)
        except (ValueError, IndexError):
            pass

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
    room_info_result = get_room_info(room_id)
    if room_info_result["status"] == "error":
        return room_info_result

    room = room_info_result["room"]
    print(f"Booking room {room_id} ({room['name']})")

    # Use current time if start_time is not specified
    now = datetime.datetime.now()
    if not start_time or start_time.lower() == "now":
        start_datetime = now
        print(
            f"Using current time ({start_datetime.isoformat()}) as booking start time"
        )
    else:
        # Parse the specified start time
        start_datetime = parse_datetime(start_time)
        print(f"Using specified start time: {start_datetime.isoformat()}")

    # Calculate end time based on duration or specified end time
    if end_time and end_time.isdigit():
        # If end_time is a number, treat it as duration in minutes
        duration_minutes = int(end_time)
        end_datetime = start_datetime + datetime.timedelta(minutes=duration_minutes)
        print(f"Using duration: {duration_minutes} minutes")
    elif end_time:
        # If end_time is a time string, parse it
        end_datetime = parse_datetime(end_time)
        print(f"Using specified end time: {end_datetime.isoformat()}")
    else:
        # Default to 1 hour meeting
        end_datetime = start_datetime + datetime.timedelta(hours=1)
        print(f"Using default duration: 60 minutes")

    # Ensure end time is after start time
    if end_datetime <= start_datetime:
        end_datetime = start_datetime + datetime.timedelta(hours=1)
        print(f"End time was before start time, adjusted to 1 hour duration")

    try:
        # Format times in local format for display
        start_time_formatted = start_datetime.strftime("%H:%M")
        end_time_formatted = end_datetime.strftime("%H:%M")
        print(f"Booking from {start_time_formatted} to {end_time_formatted}")

        # Format attendees
        formatted_attendees = []
        if attendees:
            for attendee in attendees:
                formatted_attendees.append(attendee)

        # Calculate duration in minutes
        duration_minutes = int((end_datetime - start_datetime).total_seconds() / 60)

        # Create booking request payload
        booking_data = {
            "subject": subject or "Ad-hoc Meeting",
            "startDateTime": start_datetime.isoformat(),
            "endDateTime": end_datetime.isoformat(),
            "isOnlineMeeting": True,
            "attendees": formatted_attendees,
            "duration": duration_minutes,  # Add the required duration parameter
        }

        # Make the booking request to the local API
        response = requests.post(
            f"{LOCAL_EXCHANGE_API_URL}/rooms/{room_id}/book", json=booking_data
        )

        if response.status_code in (200, 201):
            booking_result = response.json()
            return {
                "status": "success",
                "meeting": {
                    "id": booking_result.get("id", ""),
                    "subject": subject,
                    "room": room["name"],
                    "start_time": start_datetime.isoformat(),
                    "end_time": end_datetime.isoformat(),
                    "online_meeting": booking_result.get("onlineMeeting", {}),
                },
            }
        else:
            error_message = f"Booking failed: {response.status_code} {response.text}"
            print(error_message)
            return {"status": "error", "error_message": error_message}

    except Exception as e:
        error_message = f"Error booking room: {str(e)}"
        print(error_message)
        return {"status": "error", "error_message": error_message}


def cancel_meeting(room_id: str, meeting_id: str) -> Dict[str, Any]:
    """Cancels a scheduled meeting in a room.

    Args:
        room_id (str): The ID of the room where the meeting is scheduled.
        meeting_id (str): The ID of the meeting to cancel.

    Returns:
        dict: Status and result of cancellation.
    """
    try:
        # Check if room exists
        room_info_result = get_room_info(room_id)
        if room_info_result["status"] == "error":
            return room_info_result

        # Make the cancellation request to the local API
        response = requests.delete(
            f"{LOCAL_EXCHANGE_API_URL}/rooms/{room_id}/meetings/{meeting_id}"
        )

        if response.status_code in (200, 204):
            return {"status": "success", "message": "Meeting canceled successfully"}
        else:
            try:
                error_data = response.json()
                error_message = error_data.get("error", "Unknown error occurred")
            except:
                error_message = (
                    f"Cancellation failed: {response.status_code} {response.text}"
                )

            print(error_message)
            return {"status": "error", "error_message": error_message}

    except Exception as e:
        error_message = f"Error canceling meeting: {str(e)}"
        print(error_message)
        return {"status": "error", "error_message": error_message}
