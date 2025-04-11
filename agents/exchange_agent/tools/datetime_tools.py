import datetime
from typing import Dict, Any


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
