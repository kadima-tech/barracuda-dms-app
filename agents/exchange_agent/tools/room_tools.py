import datetime
from typing import Dict, Any, Optional, List
import os
import asyncio
import json
import requests
from azure.identity import ClientSecretCredential
from azure.identity.aio import ClientSecretCredential as AsyncClientSecretCredential
from msgraph_core import BaseGraphRequestAdapter
from msgraph_core.authentication import AzureIdentityAuthenticationProvider
from kiota_abstractions.request_information import RequestInformation
from kiota_abstractions.method import Method
from kiota_abstractions.request_option import RequestOption
from kiota_abstractions.base_request_configuration import BaseRequestConfiguration
from kiota_abstractions.serialization import (
    ParseNodeFactoryRegistry,
    SerializationWriterFactoryRegistry,
)
from .auth_tools import _load_token_cache, check_auth_status

# Configuration settings - in real implementation, load from config
EXCHANGE_TENANT_ID = os.environ.get("EXCHANGE_TENANT_ID", "")
EXCHANGE_CLIENT_ID = os.environ.get("EXCHANGE_CLIENT_ID", "")
EXCHANGE_CLIENT_SECRET = os.environ.get("EXCHANGE_CLIENT_SECRET", "")

# Configuration setting
LOCAL_EXCHANGE_API_URL = "http://localhost:8080/exchange"

# Cache for rooms data to minimize API calls
_rooms_cache = None
_room_info_cache = {}
_adapter = None


def _get_graph_adapter():
    """
    Get an authenticated Microsoft Graph adapter.

    Returns:
        BaseGraphRequestAdapter: The authenticated Microsoft Graph adapter
    """
    global _adapter

    if _adapter is not None:
        return _adapter

    try:
        # Check auth status and refresh token if needed
        auth_status = check_auth_status()
        if not auth_status["authenticated"]:
            raise Exception(
                "Not authenticated with Microsoft Graph. Please authenticate first."
            )

        # Use token from auth_tools
        token_cache = _load_token_cache()
        access_token = token_cache["access_token"]

        # Create a custom authentication provider that uses the token
        class TokenAuthProvider:
            async def get_authorization_token(self, uri=None, header_value=None):
                return access_token

            async def get_authentication_token(self, uri=None, additional_claims=None):
                return access_token

        # Register serialization factories
        parse_node_factory = ParseNodeFactoryRegistry()
        serialization_writer_factory = SerializationWriterFactoryRegistry()

        # Create the graph adapter with all necessary parameters
        adapter = BaseGraphRequestAdapter(
            auth_provider=TokenAuthProvider(),
            parse_node_factory=parse_node_factory,
            serialization_writer_factory=serialization_writer_factory,
        )

        # Configure the adapter's base URL properties
        adapter.base_url = "graph.microsoft.com"
        adapter.base_url_template = "https://{+baseurl}/v1.0{+path}"

        _adapter = adapter
        print("Successfully created graph adapter with base URL:", adapter.base_url)
        return adapter
    except Exception as e:
        print(f"Error creating graph adapter: {e}")
        raise


def _make_request(endpoint: str, method: str = "GET", params=None, json_data=None):
    """Helper function to make API requests to the local Exchange API server"""
    try:
        url = f"{LOCAL_EXCHANGE_API_URL}/{endpoint.lstrip('/')}"

        # Check if we're authenticated
        auth_status = check_auth_status()
        if not auth_status["authenticated"]:
            print("Not authenticated with Exchange service. Please authenticate first.")
            return None

        # Make the request
        if method.upper() == "GET":
            response = requests.get(url, params=params)
        elif method.upper() == "POST":
            response = requests.post(url, params=params, json=json_data)
        elif method.upper() == "DELETE":
            response = requests.delete(url, params=params, json=json_data)
        elif method.upper() == "PATCH":
            response = requests.patch(url, params=params, json=json_data)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        # Check for successful response
        if response.status_code in (200, 201, 204):
            try:
                return response.json()
            except:
                return {"success": True}
        else:
            print(f"API request failed: {response.status_code} {response.text}")
            return None

    except Exception as e:
        print(f"Error making request to {endpoint}: {e}")
        return None


def get_all_rooms() -> Dict[str, Any]:
    """Retrieves all available meeting rooms from Microsoft Exchange.

    Returns:
        dict: Status and list of rooms or error message.
    """
    global _rooms_cache

    # Return cached data if available
    if _rooms_cache:
        return {"status": "success", "rooms": _rooms_cache}

    try:
        # Get all rooms from the local API
        rooms_response = _make_request("rooms")

        if not rooms_response:
            return {
                "status": "error",
                "error_message": "Failed to fetch rooms. Please check authentication and try again.",
            }

        # Process the room data
        rooms = []
        for room in rooms_response:
            room_data = {
                "id": room.get("id", ""),
                "name": room.get("displayName", room.get("name", "")),
                "email": room.get("email", room.get("emailAddress", "")),
                "capacity": room.get("capacity", 0),
                "building": room.get("building", ""),
                "floor": room.get("floorNumber", room.get("floor", "")),
                "location": room.get("location", "Unknown Location"),
            }
            rooms.append(room_data)

        # Cache the results
        _rooms_cache = rooms

        return {"status": "success", "rooms": rooms}

    except Exception as e:
        print(f"Error fetching rooms: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to fetch rooms: {str(e)}",
        }


def get_room_info(room_id: str, force_refresh: bool = False) -> Dict[str, Any]:
    """Retrieves detailed information about a specific meeting room.

    Args:
        room_id (str): The ID of the room to retrieve information for.
        force_refresh (bool, optional): Force a refresh of cached data. Defaults to False.

    Returns:
        dict: Status and room details or error message.
    """
    global _room_info_cache

    # Return cached data unless force refresh is requested
    if room_id in _room_info_cache and not force_refresh:
        return {"status": "success", "room": _room_info_cache[room_id]}

    try:
        # Get room details from the local API
        room_response = _make_request(f"rooms/{room_id}")

        if not room_response:
            return {
                "status": "error",
                "error_message": f"Failed to fetch room with ID {room_id}. Please check if room exists.",
            }

        # Process the room data
        room_data = {
            "id": room_response.get("id", room_id),
            "name": room_response.get("displayName", room_response.get("name", "")),
            "email": room_response.get("email", room_response.get("emailAddress", "")),
            "capacity": room_response.get("capacity", 0),
            "building": room_response.get("building", ""),
            "floor": room_response.get("floorNumber", room_response.get("floor", "")),
            "location": room_response.get("location", "Unknown Location"),
            "availability": room_response.get("availability", []),
            "equipment": room_response.get("equipment", []),
        }

        # Cache the results
        _room_info_cache[room_id] = room_data

        return {"status": "success", "room": room_data}

    except Exception as e:
        print(f"Error fetching room info: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to fetch room info: {str(e)}",
        }


def get_room_availability(room_id: str) -> Dict[str, Any]:
    """Gets the availability of a meeting room for the current day.

    Args:
        room_id (str): The ID of the room to check availability for.

    Returns:
        dict: Status and room availability information or error message.
    """
    try:
        # First get the room info to ensure the room exists
        room_info_result = get_room_info(room_id, force_refresh=True)

        if room_info_result["status"] == "error":
            return room_info_result

        room = room_info_result["room"]

        # The availability is included in the room info from the local API
        availability = room.get("availability", [])

        return {
            "status": "success",
            "room_id": room_id,
            "room_name": room["name"],
            "availability": availability,
        }

    except Exception as e:
        print(f"Error fetching room availability: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to fetch room availability: {str(e)}",
        }


def list_available_rooms() -> Dict[str, Any]:
    """Lists all meeting rooms that are currently available.

    Returns:
        dict: Status and list of available rooms or error message.
    """
    try:
        # Get all rooms
        rooms_result = get_all_rooms()

        if rooms_result["status"] == "error":
            return rooms_result

        rooms = rooms_result["rooms"]

        # Filter for available rooms
        available_rooms = []
        now = datetime.datetime.now()

        for room in rooms:
            # Get room availability
            availability_result = get_room_availability(room["id"])

            if availability_result["status"] == "error":
                continue

            availability = availability_result["availability"]

            # Check if the room is currently available
            is_available = True
            for event in availability:
                start_time = datetime.datetime.fromisoformat(
                    event["start"].replace("Z", "+00:00")
                )
                end_time = datetime.datetime.fromisoformat(
                    event["end"].replace("Z", "+00:00")
                )

                if start_time <= now <= end_time:
                    is_available = False
                    break

            if is_available:
                available_rooms.append(room)

        return {
            "status": "success",
            "available_rooms": available_rooms,
            "count": len(available_rooms),
        }

    except Exception as e:
        print(f"Error listing available rooms: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to list available rooms: {str(e)}",
        }


def _get_beta_graph_adapter():
    """
    Get an authenticated Microsoft Graph adapter using beta endpoint.

    Returns:
        BaseGraphRequestAdapter: The authenticated Microsoft Graph adapter with beta endpoint
    """
    try:
        # Check auth status and refresh token if needed
        auth_status = check_auth_status()
        if not auth_status["authenticated"]:
            raise Exception(
                "Not authenticated with Microsoft Graph. Please authenticate first."
            )

        # Use token from auth_tools
        token_cache = _load_token_cache()
        access_token = token_cache["access_token"]

        # Create a custom authentication provider that uses the token
        class TokenAuthProvider:
            async def get_authorization_token(self, uri=None, header_value=None):
                return access_token

            async def get_authentication_token(self, uri=None, additional_claims=None):
                return access_token

        # Register serialization factories
        parse_node_factory = ParseNodeFactoryRegistry()
        serialization_writer_factory = SerializationWriterFactoryRegistry()

        # Create the graph adapter with all necessary parameters
        adapter = BaseGraphRequestAdapter(
            auth_provider=TokenAuthProvider(),
            parse_node_factory=parse_node_factory,
            serialization_writer_factory=serialization_writer_factory,
        )

        # Configure the adapter's base URL properties
        adapter.base_url = "graph.microsoft.com"
        adapter.base_url_template = "https://{+baseurl}/beta{+path}"

        print(
            "Successfully created beta graph adapter with base URL:", adapter.base_url
        )
        return adapter
    except Exception as e:
        print(f"Error creating beta graph adapter: {e}")
        raise


def _make_beta_request(method: str, endpoint: str, params=None, json_data=None):
    """Helper function to make graph API requests to the beta endpoint"""
    try:
        # First try using the Graph SDK
        try:
            adapter = _get_beta_graph_adapter()

            # Create request info
            request_info = RequestInformation()

            # Set HTTP method using the Method enum
            if method.upper() == "GET":
                request_info.method = Method.GET
            elif method.upper() == "POST":
                request_info.method = Method.POST
            elif method.upper() == "DELETE":
                request_info.method = Method.DELETE
            elif method.upper() == "PATCH":
                request_info.method = Method.PATCH
            elif method.upper() == "PUT":
                request_info.method = Method.PUT
            else:
                request_info.method = method  # Fallback to string if needed

            # Ensure endpoint starts with a slash
            if not endpoint.startswith("/"):
                endpoint = "/" + endpoint

            # Set the URL path - the adapter handles the base URL
            request_info.path_parameters.add_all({"path": endpoint})
            request_info.url = endpoint

            # Set headers if needed
            request_info.headers.try_add("Content-Type", "application/json")

            # Add Accept header for JSON
            request_info.headers.try_add("Accept", "application/json")

            # Add parameters if provided
            if params:
                for key, value in params.items():
                    request_info.query_parameters.add(key, value)

            # Add json data if provided
            if json_data:
                request_info.content = json.dumps(json_data).encode("utf-8")

            # Make the request and return the response
            response = asyncio.run(adapter.send_async(request_info, dict, {}))
            return response
        except Exception as sdk_error:
            # If the SDK fails, fall back to direct request
            print(
                f"Graph Beta SDK error: {sdk_error}. Falling back to direct beta request."
            )
            return direct_beta_request(method, endpoint, params=params, data=json_data)
    except Exception as e:
        print(f"Error making beta request to {endpoint}: {e}")
        raise


def test_graph_connection():
    """Test the Microsoft Graph connection and print detailed diagnostic information"""
    try:
        print("\n=== Microsoft Graph Connection Test ===")
        print(
            f"Tenant ID: {EXCHANGE_TENANT_ID[:5]}...{EXCHANGE_TENANT_ID[-5:] if len(EXCHANGE_TENANT_ID) > 10 else ''}"
        )
        print(
            f"Client ID: {EXCHANGE_CLIENT_ID[:5]}...{EXCHANGE_CLIENT_ID[-5:] if len(EXCHANGE_CLIENT_ID) > 10 else ''}"
        )
        print(f"Client Secret: {'*' * 10}")

        # Test adapter creation
        adapter = _get_graph_adapter()
        print("Adapter created successfully")
        print(f"Base URL: {adapter.base_url}")
        print(f"URL Template: {adapter.base_url_template}")

        # Create simple test request
        request_info = RequestInformation()
        request_info.method = Method.GET
        request_info.url = "/me"
        request_info.headers.try_add("Accept", "application/json")

        print("Sending test request to /me endpoint...")
        response = asyncio.run(adapter.send_async(request_info, dict, {}))

        print("\nResponse details:")
        print(f"User: {response.get('displayName')} ({response.get('mail')})")
        print(f"User ID: {response.get('id')}")
        print("Graph connection test SUCCESSFUL!")

        return True
    except Exception as e:
        print(f"Graph connection test FAILED: {e}")
        if hasattr(e, "__dict__"):
            for key, value in e.__dict__.items():
                print(f"  {key}: {value}")
        return False


def direct_request(method: str, endpoint: str, params=None, data=None, headers=None):
    """
    Make a direct request to the Microsoft Graph API using the requests library.
    This is a fallback method if the Graph SDK is having issues.

    Args:
        method: HTTP method (GET, POST, DELETE, etc.)
        endpoint: API endpoint (without the base URL)
        params: Query parameters
        data: Request body for POST/PATCH
        headers: Additional headers

    Returns:
        The JSON response from the API
    """
    try:
        # Check auth status and refresh token if needed
        auth_status = check_auth_status()
        if not auth_status["authenticated"]:
            raise Exception(
                "Not authenticated with Microsoft Graph. Please authenticate first."
            )

        # Get access token
        token_cache = _load_token_cache()
        access_token = token_cache["access_token"]

        # Ensure endpoint starts with a slash
        if not endpoint.startswith("/"):
            endpoint = "/" + endpoint

        # Construct the full URL
        url = f"https://graph.microsoft.com/v1.0{endpoint}"

        # Set default headers
        if headers is None:
            headers = {}

        # Add the authorization header
        headers["Authorization"] = f"Bearer {access_token}"
        headers["Content-Type"] = "application/json"

        # Make the request
        response = None
        if method.upper() == "GET":
            response = requests.get(url, params=params, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, params=params, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, params=params, headers=headers)
        elif method.upper() == "PATCH":
            response = requests.patch(url, params=params, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, params=params, json=data, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        # Raise an exception if the request failed
        response.raise_for_status()

        # Return the JSON response
        if response.content:
            return response.json()
        else:
            return {}

    except Exception as e:
        print(f"Error making direct request to {endpoint}: {e}")
        raise


def direct_beta_request(
    method: str, endpoint: str, params=None, data=None, headers=None
):
    """
    Make a direct request to the Microsoft Graph Beta API using the requests library.

    Args:
        method: HTTP method (GET, POST, DELETE, etc.)
        endpoint: API endpoint (without the base URL)
        params: Query parameters
        data: Request body for POST/PATCH
        headers: Additional headers

    Returns:
        The JSON response from the API
    """
    try:
        # Check auth status and refresh token if needed
        auth_status = check_auth_status()
        if not auth_status["authenticated"]:
            raise Exception(
                "Not authenticated with Microsoft Graph. Please authenticate first."
            )

        # Get access token
        token_cache = _load_token_cache()
        access_token = token_cache["access_token"]

        # Ensure endpoint starts with a slash
        if not endpoint.startswith("/"):
            endpoint = "/" + endpoint

        # Construct the full URL with the beta endpoint
        url = f"https://graph.microsoft.com/beta{endpoint}"

        # Set default headers
        if headers is None:
            headers = {}

        # Add the authorization header
        headers["Authorization"] = f"Bearer {access_token}"
        headers["Content-Type"] = "application/json"

        # Make the request
        response = None
        if method.upper() == "GET":
            response = requests.get(url, params=params, headers=headers)
        elif method.upper() == "POST":
            response = requests.post(url, params=params, json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(url, params=params, headers=headers)
        elif method.upper() == "PATCH":
            response = requests.patch(url, params=params, json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(url, params=params, json=data, headers=headers)
        else:
            raise ValueError(f"Unsupported HTTP method: {method}")

        # Raise an exception if the request failed
        response.raise_for_status()

        # Return the JSON response
        if response.content:
            return response.json()
        else:
            return {}

    except Exception as e:
        print(f"Error making direct beta request to {endpoint}: {e}")
        raise
