import os
from typing import Dict, Any
import json
import requests
from pathlib import Path
import datetime

# Configuration settings
LOCAL_EXCHANGE_API_URL = "http://localhost:8080/exchange"

# Cache tokens in memory
_token_cache_file = Path(os.path.expanduser("~/.exchange_token_cache.json"))
_token_cache = None


def _load_token_cache():
    """Load token cache from disk"""
    global _token_cache
    if _token_cache is not None:
        return _token_cache

    try:
        if _token_cache_file.exists():
            with open(_token_cache_file, "r") as f:
                _token_cache = json.load(f)
                return _token_cache
    except Exception as e:
        print(f"Error loading token cache: {e}")

    _token_cache = {"access_token": "", "refresh_token": "", "expires_at": 0}
    return _token_cache


def _save_token_cache(token_data):
    """Save token cache to disk"""
    global _token_cache
    _token_cache = token_data

    try:
        with open(_token_cache_file, "w") as f:
            json.dump(token_data, f)
    except Exception as e:
        print(f"Error saving token cache: {e}")


def set_token_from_form_data(form_data: str) -> Dict[str, Any]:
    """Extracts and sets token information from the form data returned by Microsoft authentication.

    Args:
        form_data (str): The form data string from Microsoft authentication response

    Returns:
        dict: Status and authentication result
    """
    try:
        # Forward the form data to the local server endpoint
        response = requests.post(
            f"{LOCAL_EXCHANGE_API_URL}/callback",
            data=form_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )

        if response.status_code == 200:
            # Get the access token from the response
            token_data = response.json()

            # Update our local cache
            _save_token_cache(
                {
                    "access_token": token_data.get("access_token", ""),
                    "refresh_token": token_data.get("refresh_token", ""),
                    "expires_at": int(datetime.datetime.now().timestamp())
                    + int(token_data.get("expires_in", 3600))
                    - 300,  # 5 mins buffer
                }
            )

            return {
                "status": "success",
                "message": "Authentication token set successfully",
                "token_info": {
                    "access_token_preview": f"{token_data.get('access_token', '')[:10]}...",
                    "expires_in": token_data.get("expires_in", 3600),
                },
            }
        else:
            return {
                "status": "error",
                "error_message": f"Failed to set token: {response.text}",
            }

    except Exception as e:
        print(f"Error setting token from form data: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to set token from form data: {str(e)}",
        }


def check_auth_status() -> Dict[str, Any]:
    """Checks if the application is authenticated with Microsoft Exchange.

    Returns:
        dict: Authentication status.
    """
    try:
        # Call the status endpoint on the local server
        response = requests.get(f"{LOCAL_EXCHANGE_API_URL}/status")

        if response.status_code == 200:
            status_data = response.json()
            return {
                "status": "success",
                "authenticated": status_data.get("authenticated", False),
            }
        else:
            return {"status": "success", "authenticated": False}
    except Exception as e:
        print(f"Error checking auth status: {e}")
        return {"status": "success", "authenticated": False}


def get_authorization_url() -> Dict[str, Any]:
    """Generates a URL for authorizing the application with Microsoft Exchange.

    Returns:
        dict: Status and authorization URL or error message.
    """
    try:
        # Get the authorization URL from the local API
        response = requests.get(f"{LOCAL_EXCHANGE_API_URL}/authorize")

        # If the response is a redirect, extract the Location header
        if response.status_code in (301, 302, 303, 307, 308):
            auth_url = response.headers.get("Location")
            return {"status": "success", "authorization_url": auth_url}
        elif response.status_code == 200 and "authorization_url" in response.json():
            # If the API returns the URL directly in the response
            auth_url = response.json().get("authorization_url")
            return {"status": "success", "authorization_url": auth_url}
        else:
            return {
                "status": "error",
                "error_message": f"Failed to get authorization URL: {response.text}",
            }
    except Exception as e:
        print(f"Error getting authorization URL: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to generate authorization URL: {str(e)}",
        }


def exchange_code_for_token(code: str) -> Dict[str, Any]:
    """Exchange an authorization code for an access token.

    Args:
        code (str): The authorization code from the OAuth flow

    Returns:
        dict: Status and access token information
    """
    try:
        # Forward the code to the local API
        response = requests.post(
            f"{LOCAL_EXCHANGE_API_URL}/callback", params={"code": code}
        )

        if response.status_code == 200:
            # Attempt to parse JSON response if available
            try:
                token_data = response.json()

                # Update our local cache
                if "access_token" in token_data:
                    _save_token_cache(
                        {
                            "access_token": token_data.get("access_token", ""),
                            "refresh_token": token_data.get("refresh_token", ""),
                            "expires_at": int(datetime.datetime.now().timestamp())
                            + int(token_data.get("expires_in", 3600))
                            - 300,
                        }
                    )

                return {
                    "status": "success",
                    "access_token": token_data.get("access_token", ""),
                    "refresh_token": token_data.get("refresh_token", ""),
                    "expires_in": token_data.get("expires_in", 3600),
                }
            except:
                # If it's not JSON, the endpoint might have redirected or returned HTML
                return {
                    "status": "success",
                    "message": "Authentication flow completed successfully",
                }
        else:
            return {
                "status": "error",
                "error_message": f"Failed to exchange code for token: {response.text}",
            }
    except Exception as e:
        print(f"Error exchanging code for token: {e}")
        return {
            "status": "error",
            "error_message": f"Failed to exchange code for token: {str(e)}",
        }
