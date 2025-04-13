#!/usr/bin/env python3
"""Test script for Microsoft Graph API integration"""

import os
import sys
import webbrowser
import dotenv
from tools.room_tools import (
    get_all_rooms,
    get_room_info,
    _make_request,
    _make_beta_request,
    test_graph_connection,
    direct_request,
)
from tools.auth_tools import (
    check_auth_status,
    get_authorization_url,
    exchange_code_for_token,
)

# Load environment variables
dotenv.load_dotenv()


def check_environment():
    """Check if required environment variables are set"""
    required_vars = [
        "EXCHANGE_TENANT_ID",
        "EXCHANGE_CLIENT_ID",
        "EXCHANGE_CLIENT_SECRET",
        "EXCHANGE_REDIRECT_URI",
    ]
    missing = [var for var in required_vars if not os.environ.get(var)]

    if missing:
        print(f"Error: Missing required environment variables: {', '.join(missing)}")
        print("Please set these variables in your .env file or environment")
        sys.exit(1)
    else:
        print("Environment variables check: OK")


def check_authentication():
    """Check if we're authenticated with Microsoft Graph"""
    auth_status = check_auth_status()

    if auth_status["authenticated"]:
        print("Already authenticated with Microsoft Graph")
        return True

    print("Not authenticated with Microsoft Graph. Starting authentication flow.")

    # Get authorization URL
    auth_url_result = get_authorization_url()
    if auth_url_result["status"] != "success":
        print(
            f"Error getting authorization URL: {auth_url_result.get('error_message')}"
        )
        return False

    auth_url = auth_url_result["authorization_url"]
    print(f"\nPlease go to the following URL to authenticate:")
    print(auth_url)

    # Try to open the URL in the default browser
    try:
        webbrowser.open(auth_url)
    except Exception:
        pass

    print("\nAfter authenticating, you'll be redirected to your redirect URI")
    print("Please look in the URL for a 'code' parameter and enter it below:")

    auth_code = input("Authorization code: ").strip()
    if not auth_code:
        print("No authorization code provided. Cannot proceed.")
        return False

    # Exchange the code for a token
    token_result = exchange_code_for_token(auth_code)
    if token_result["status"] != "success":
        print(f"Error exchanging code for token: {token_result.get('error_message')}")
        return False

    print("Successfully authenticated with Microsoft Graph!")
    return True


def test_basic_request():
    """Test a basic Microsoft Graph API request"""
    print("\n=== Testing Basic Request ===")
    try:
        # Try to get the current user
        result = _make_request("GET", "/me")
        print(f"User: {result.get('displayName')} ({result.get('mail')})")
        print("Basic request test: OK")
        return True
    except Exception as e:
        print(f"Error with basic request: {e}")
        return False


def test_direct_request():
    """Test a direct request to Microsoft Graph API"""
    print("\n=== Testing Direct Request ===")
    try:
        # Try to get the current user
        result = direct_request("GET", "/me")
        print(f"User: {result.get('displayName')} ({result.get('mail')})")
        print("Direct request test: OK")
        return True
    except Exception as e:
        print(f"Error with direct request: {e}")
        return False


def test_beta_request():
    """Test a Beta Microsoft Graph API request"""
    print("\n=== Testing Beta Request ===")
    try:
        # Try to get the current user from beta endpoint
        result = _make_beta_request("GET", "/me")
        print(f"User (beta): {result.get('displayName')} ({result.get('mail')})")
        print("Beta request test: OK")
        return True
    except Exception as e:
        print(f"Error with beta request: {e}")
        return False


def test_get_all_rooms():
    """Test retrieving all rooms"""
    print("\n=== Testing Get All Rooms ===")
    try:
        result = get_all_rooms()
        if result["status"] == "success":
            rooms = result["rooms"]
            print(f"Found {len(rooms)} rooms")
            for i, room in enumerate(rooms[:5]):  # Show first 5 rooms
                print(f"  {i+1}. {room.get('name')} ({room.get('email')})")
            if len(rooms) > 5:
                print(f"  ... and {len(rooms) - 5} more")
            print("Get all rooms test: OK")
            return True, rooms
        else:
            print(f"Error: {result.get('error_message')}")
            return False, []
    except Exception as e:
        print(f"Error getting all rooms: {e}")
        return False, []


def test_get_room_info(room_id):
    """Test retrieving room details and calendar"""
    print(f"\n=== Testing Get Room Info for {room_id} ===")
    try:
        result = get_room_info(room_id, force_refresh=True)
        if result["status"] == "success":
            room = result["room"]
            print(f"Room: {room.get('name')} ({room.get('email')})")
            print(f"Location: {room.get('location')}")
            print(f"Availability: {room.get('availabilityStatus')}")
            if room.get("currentMeeting"):
                current = room["currentMeeting"]
                print(
                    f"Current meeting: {current.get('title')} ({current.get('startTime')} - {current.get('endTime')})"
                )
            print(f"Upcoming meetings: {len(room.get('upcomingMeetings', []))}")
            for i, meeting in enumerate(
                room.get("upcomingMeetings", [])[:3]
            ):  # Show first 3 meetings
                print(
                    f"  {i+1}. {meeting.get('title')} ({meeting.get('startTime')} - {meeting.get('endTime')})"
                )
            print("Get room info test: OK")
            return True
        else:
            print(f"Error: {result.get('error_message')}")
            return False
    except Exception as e:
        print(f"Error getting room info: {e}")
        return False


def main():
    """Main function to run tests"""
    print("Microsoft Graph API Test Script")
    print("==============================")

    # Check environment
    check_environment()

    # Check authentication
    if not check_authentication():
        print("Authentication failed. Cannot continue.")
        return

    # Run the comprehensive connection test first
    if not test_graph_connection():
        print("Graph connection test failed. Trying direct request...")
        if not test_direct_request():
            print("Direct request test also failed. Cannot continue.")
            return

    # Run standard tests
    if not test_basic_request():
        print("Basic request test failed. Cannot continue.")
        return

    test_beta_request()

    success, rooms = test_get_all_rooms()
    if success and rooms:
        # Test first room
        if rooms:
            test_get_room_info(rooms[0]["id"])

    print("\nTests completed!")


if __name__ == "__main__":
    main()
