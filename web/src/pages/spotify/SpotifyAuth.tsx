import { useEffect, useState } from "react";
import { API_BASE_URL } from "../../utils/api/config";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { paths } from "../../config/paths";

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: #121212;
  color: #1db954;
  font-size: 18px;
`;

const SpotifyAuth: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're returning from Spotify auth (URL has error or code param)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get("error");

    if (error) {
      console.error("Spotify authentication error:", error);
      // Navigate to music dashboard with error parameter
      navigate(`${paths.spotify.musicDashboard}?error=${error}`, {
        replace: true,
      });
      return;
    }

    // Check if user is already authenticated
    async function checkAuth() {
      try {
        const response = await fetch(
          `${API_BASE_URL}/spotify/currently-playing`,
          {
            credentials: "include",
          }
        );

        // If we get a 401, we need to authenticate
        if (response.status === 401) {
          window.location.href = `${API_BASE_URL}/spotify`;
        } else {
          // User is already authenticated, redirect to music dashboard
          navigate(paths.spotify.musicDashboard, { replace: true });
        }
      } catch (error) {
        console.error("Error checking authentication:", error);
        // On error, try to authenticate
        window.location.href = `${API_BASE_URL}/spotify`;
      } finally {
        setIsLoading(false);
      }
    }

    checkAuth();
  }, [navigate]);

  return <LoadingContainer>Connecting to Spotify...</LoadingContainer>;
};

export default SpotifyAuth;
