'use client';

import React, { useEffect } from 'react';
import { API_BASE_URL } from '../../utils/api/config';
import styled from 'styled-components';
import { paths } from '../../config/paths';
import { useNavigate } from 'react-router-dom';
import ClientOnly from '../../components/common/ClientOnly';

const AuthContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  color: #1db954;
  font-size: 20px;
  font-weight: 600;
`;

// The main component with two parts: client-safe UI and client-only router logic
const SpotifyAuth = () => {
  return (
    <ClientOnly
      fallback={
        <AuthContainer>
          <h1>Loading Spotify authentication...</h1>
        </AuthContainer>
      }
    >
      <SpotifyAuthClient />
    </ClientOnly>
  );
};

// Client-side component that uses React Router
const SpotifyAuthClient = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if we're returning from Spotify auth (URL has error or code param)
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');

    if (error) {
      console.error('Spotify authentication error:', error);
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
            credentials: 'include',
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
        console.error('Error checking authentication:', error);
        // On error, try to authenticate
        window.location.href = `${API_BASE_URL}/spotify`;
      }
    }

    checkAuth();
  }, [navigate]);

  return (
    <AuthContainer>
      <h1>Authenticating with Spotify...</h1>
    </AuthContainer>
  );
};

// Tell Next.js to always fetch this page fresh
export const dynamic = 'force-dynamic';

export default SpotifyAuth;
