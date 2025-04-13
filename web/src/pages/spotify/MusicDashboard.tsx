import styled from 'styled-components';
import { useState, useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../../utils/api/config';
import NewsTicker from '../../components/NewsTicker';
//import { api } from "../../utils/api/instance";

// Types
interface TrackInfo {
  name: string;
  artist: string;
  albumCover: string;
  sessionId: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  sessionUrl?: string;
  nextTrack?: {
    name: string;
    artist: string;
    albumCover: string;
  };
  sessionUsers?: SessionUser[];
}

interface SessionUser {
  id: string;
  name: string;
  avatar?: string;
  isHost: boolean;
}

// Styled components
const DashboardContainer = styled.div`
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  color: #ffffff;
  width: 100vw;
  height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  padding: 32px;
  padding-bottom: 64px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40%;
    background: linear-gradient(
      180deg,
      rgba(29, 185, 84, 0.15) 0%,
      rgba(29, 185, 84, 0) 100%
    );
    z-index: 0;
    pointer-events: none;
  }
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 800;
  color: #1db954; /* Spotify green */
  margin-right: auto;
  letter-spacing: -0.5px;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 0;
    width: 24px;
    height: 3px;
    background-color: #1db954;
    border-radius: 2px;
  }
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  font-size: 14px;
  font-weight: 600;
  color: #ffffff;
  background: rgba(29, 185, 84, 0.2);
  padding: 6px 12px;
  border-radius: 20px;

  &::before {
    content: '';
    display: inline-block;
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #1db954;
    margin-right: 8px;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0% {
      opacity: 0.6;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0.6;
    }
  }
`;

const ContentWrapper = styled.div`
  display: flex;
  flex: 1;
  gap: 40px;
  height: calc(100% - 80px);
  position: relative;
  z-index: 1;
`;

const LeftColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 45%;
`;

const AlbumArt = styled.img`
  width: 100%;
  height: auto;
  object-fit: contain;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
  }
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 55%;
  padding: 12px 0;
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const TopSection = styled.div`
  display: flex;
  gap: 32px;
  width: 100%;
`;

const TrackInfoSection = styled.div`
  flex: 1.5;
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BottomSection = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: 24px;
  width: 100%;
  min-height: 120px;
`;

const NowPlayingLabel = styled.div`
  font-size: 14px;
  color: #1db954;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
  font-weight: 600;
  display: flex;
  align-items: center;

  &::before {
    content: '';
    display: inline-block;
    width: 20px;
    height: 2px;
    background-color: #1db954;
    margin-right: 8px;
  }
`;

const TrackName = styled.h2`
  color: #ffffff;
  font-size: 42px;
  margin: 0;
  line-height: 1.1;
  font-weight: 800;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const ArtistName = styled.div`
  color: #e0e0e0;
  font-size: 24px;
  font-weight: 500;
  letter-spacing: -0.01em;
`;

const ProgressBar = styled.div`
  width: 100%;
  height: 6px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
  margin: 16px 0 8px;
  overflow: hidden;
`;

const Progress = styled.div<{ width: number }>`
  height: 100%;
  width: ${(props) => props.width}%;
  background-color: #1db954;
  border-radius: 3px;
  transition: width 0.3s ease;
`;

const TimeInfo = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
  color: #b3b3b3;
  margin-bottom: 16px;
`;

const NextTrackSection = styled.div`
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  height: 100%;
  opacity: 1;
  animation: fadeIn 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const NextTrackThumbnail = styled.img`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  object-fit: cover;
`;

const NextTrackInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const NextTrackLabel = styled.div`
  font-size: 12px;
  color: #1db954;
  text-transform: uppercase;
  letter-spacing: 1px;
  font-weight: 600;
  display: flex;
  align-items: center;

  &::before {
    content: '›';
    margin-right: 4px;
    font-size: 16px;
  }
`;

const NextTrackName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #ffffff;
`;

const NextTrackArtist = styled.div`
  font-size: 14px;
  color: #b3b3b3;
`;

const ControlsSection = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 0 0;
  background: rgba(0, 0, 0, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 40px;
  padding: 12px 24px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.05);
  width: fit-content;
  align-self: center;

  @media (max-width: 1024px) {
    gap: 16px;
    padding: 10px 20px;
    margin: 20px 0;
  }
`;

const ControlButton = styled.button`
  background: rgba(29, 185, 84, 0.15);
  border: 1px solid rgba(29, 185, 84, 0.3);
  color: #1db954;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(29, 185, 84, 0.3);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 22px;
    height: 22px;
  }

  @media (max-width: 1024px) {
    width: 40px;
    height: 40px;

    svg {
      width: 20px;
      height: 20px;
    }
  }
`;

const PlayPauseButton = styled(ControlButton)`
  width: 52px;
  height: 52px;
  background: white;
  border: none;
  color: black;

  svg {
    width: 26px;
    height: 26px;
  }

  &:hover {
    background: #f0f0f0;
  }

  @media (max-width: 1024px) {
    width: 48px;
    height: 48px;

    svg {
      width: 24px;
      height: 24px;
    }
  }
`;

const PlayIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

const PauseIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

const SkipNextIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
  </svg>
);

const SkipPrevIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
  </svg>
);

const NextTrackLoadingSection = styled(NextTrackSection)`
  justify-content: flex-start;
  gap: 16px;
  min-height: 100px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  gap: 16px;
  align-items: center;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  height: 100%;
  opacity: 0.7;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3);
  }
`;

const NextTrackLoadingThumbnail = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 8px;
  background: linear-gradient(110deg, #1a1a1a 8%, #222 18%, #1a1a1a 33%);
  background-size: 200% 100%;
  animation: shine 1.5s linear infinite;

  @keyframes shine {
    to {
      background-position-x: -200%;
    }
  }
`;

const NextTrackLoadingText = styled.div`
  width: 120px;
  height: 14px;
  background: linear-gradient(110deg, #1a1a1a 8%, #222 18%, #1a1a1a 33%);
  background-size: 200% 100%;
  animation: shine 1.5s linear infinite;
  border-radius: 4px;
  margin: 4px 0;
`;

export const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #121212 0%, #1a1a1a 100%);
  color: #1db954;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: 0.5px;

  &::after {
    content: '...';
    animation: loadingDots 1.5s infinite;
    width: 24px;
    display: inline-block;
    text-align: left;
  }

  @keyframes loadingDots {
    0% {
      content: '.';
    }
    33% {
      content: '..';
    }
    66% {
      content: '...';
    }
    100% {
      content: '.';
    }
  }
`;

const ErrorContainer = styled(LoadingContainer)`
  color: #ff5252;
  flex-direction: column;
  gap: 16px;

  &::after {
    content: none;
  }
`;

const ErrorIcon = styled.div`
  font-size: 48px;
  margin-bottom: 16px;
`;

// No props needed, using a type instead of an empty interface
type SpotifyDashboardProps = Record<string, never>;

const SpotifyDashboard: React.FC<SpotifyDashboardProps> = () => {
  const [track, setTrack] = useState<TrackInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isControlLoading, setIsControlLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const progressInterval = useRef<number>(0);
  const lastTickRef = useRef<number>(Date.now());
  const currentProgressRef = useRef(0);
  const skipInProgressRef = useRef(false);
  const pollingTimeoutRef = useRef<number>(0);
  const lastControlActionRef = useRef<number>(0);
  const lastFetchRef = useRef<number>(0);
  const CONTROL_DEBOUNCE = 300; // Reduced from 1000ms to 300ms
  const POLLING_INTERVAL = 5000; // Reduced from 15000ms to 5000ms for more responsive updates
  const FETCH_DEBOUNCE = 1000; // Reduced from 2000ms to 1000ms

  // Handle progress updates with useCallback
  const updateProgress = useCallback(() => {
    if (!progressInterval.current) return;

    const now = Date.now();
    const delta = now - lastTickRef.current;
    lastTickRef.current = now;

    currentProgressRef.current += delta;
    // Only update state every 10 frames (roughly 160ms) to reduce renders
    if (currentProgressRef.current % 160 < 16) {
      setProgress(currentProgressRef.current);
    }
  }, []);

  // Progress effect
  useEffect(() => {
    if (!track) return;

    // Clear existing interval
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    // Reset progress state
    currentProgressRef.current = track.progress;
    lastTickRef.current = Date.now();
    setProgress(track.progress);

    if (track.isPlaying) {
      progressInterval.current = window.setInterval(() => {
        updateProgress();

        // Stop at end of track
        if (currentProgressRef.current >= track.duration) {
          clearInterval(progressInterval.current);
        }
      }, 16); // 60fps timing
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [track?.progress, track?.isPlaying, track?.duration, updateProgress]);

  const fetchNowPlaying = useCallback(async () => {
    // Don't fetch if a skip operation is in progress
    if (skipInProgressRef.current) return;

    // Add debounce for fetching
    const now = Date.now();
    if (now - lastFetchRef.current < FETCH_DEBOUNCE) {
      return;
    }
    lastFetchRef.current = now;

    try {
      if (!track) setIsLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/spotify/currently-playing`,
        {
          credentials: 'include',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.status === 401) {
        window.location.href = `${API_BASE_URL}/spotify`;
        return;
      }

      if (response.status === 204) {
        if (!isLoading && !track) {
          setTrack(null);
          setError(null);
        }
        return;
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Only update if we're not in the middle of a skip operation
      if (!skipInProgressRef.current) {
        setTrack(data);
        setError(null);
      }
    } catch (error) {
      console.error(error);
      if (!isLoading) {
        setError(
          `Failed to load track data: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [track, isLoading]);

  // Set up polling with cleanup
  useEffect(() => {
    // Initial fetch
    fetchNowPlaying();

    // Set up polling with a shorter initial interval
    const initialPollingTimeout = setTimeout(() => {
      fetchNowPlaying();
      // Then set up the regular polling interval
      pollingTimeoutRef.current = window.setInterval(
        fetchNowPlaying,
        POLLING_INTERVAL
      );
    }, 1000); // Initial fetch after 1 second

    return () => {
      clearTimeout(initialPollingTimeout);
      if (pollingTimeoutRef.current) {
        clearInterval(pollingTimeoutRef.current);
      }
    };
  }, [fetchNowPlaying, track]);

  // Add debounce check for control actions
  const isControlDebounced = () => {
    const now = Date.now();
    if (now - lastControlActionRef.current < CONTROL_DEBOUNCE) {
      return true;
    }
    lastControlActionRef.current = now;
    return false;
  };

  // Handle skip operations
  const handleSkipOperation = useCallback(
    async (operation: () => Promise<Response>) => {
      if (isControlLoading || isControlDebounced()) return;

      try {
        setIsControlLoading(true);
        skipInProgressRef.current = true;

        const response = await operation();
        if (!response.ok) {
          throw new Error('Failed to perform skip operation');
        }

        // Fetch updated track state immediately
        await fetchNowPlaying();
      } catch (error) {
        console.error('Error performing skip operation:', error);
      } finally {
        setIsControlLoading(false);
        skipInProgressRef.current = false;
      }
    },
    [isControlLoading, fetchNowPlaying]
  );

  const handleSkipNext = useCallback(() => {
    if (!track?.nextTrack) return;

    handleSkipOperation(() =>
      fetch(`${API_BASE_URL}/spotify/player/next`, {
        method: 'POST',
        credentials: 'include',
      })
    );
  }, [track?.nextTrack, handleSkipOperation]);

  const handleSkipPrevious = useCallback(() => {
    if (!track) return;

    handleSkipOperation(() =>
      fetch(`${API_BASE_URL}/spotify/player/previous`, {
        method: 'POST',
        credentials: 'include',
      })
    );
  }, [track, handleSkipOperation]);

  // Update play/pause handler
  const handlePlayPause = useCallback(async () => {
    if (isControlLoading || isControlDebounced()) return;

    try {
      setIsControlLoading(true);
      const endpoint = track?.isPlaying ? 'pause' : 'play';

      const response = await fetch(
        `${API_BASE_URL}/spotify/player/${endpoint}`,
        {
          method: 'PUT',
          credentials: 'include',
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to ${endpoint}`);
      }

      // Fetch updated track state immediately
      await fetchNowPlaying();
    } catch (error) {
      console.error(`Error controlling playback:`, error);
    } finally {
      setIsControlLoading(false);
    }
  }, [track?.isPlaying, isControlLoading, fetchNowPlaying]);

  // Format time function
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Use progress in the render
  const progressPercentage = track ? (progress / track.duration) * 100 : 0;

  if (isLoading)
    return <LoadingContainer>Loading your music...</LoadingContainer>;
  if (error)
    return (
      <ErrorContainer>
        <ErrorIcon>⚠️</ErrorIcon>
        Error: {error}
      </ErrorContainer>
    );
  if (!track)
    return <LoadingContainer>No track currently playing</LoadingContainer>;

  return (
    <DashboardContainer>
      <Header>
        <Logo>BarracudaFM</Logo>
        <StatusIndicator>Now Playing</StatusIndicator>
      </Header>

      <ContentWrapper>
        <LeftColumn>
          <AlbumArt src={track.albumCover} alt="Album cover" />
        </LeftColumn>

        <InfoSection>
          <MainContent>
            <TopSection>
              <TrackInfoSection>
                <NowPlayingLabel>Now Playing</NowPlayingLabel>
                <TrackName>{track.name}</TrackName>
                <ArtistName>{track.artist}</ArtistName>

                <ProgressBar>
                  <Progress width={progressPercentage} />
                </ProgressBar>
                <TimeInfo>
                  <span>{formatTime(progress)}</span>
                  <span>{formatTime(track.duration)}</span>
                </TimeInfo>

                <ControlsSection>
                  <ControlButton
                    onClick={handleSkipPrevious}
                    disabled={isControlLoading}
                    title="Previous track"
                  >
                    <SkipPrevIcon />
                  </ControlButton>

                  <PlayPauseButton
                    onClick={handlePlayPause}
                    disabled={isControlLoading}
                    title={track.isPlaying ? 'Pause' : 'Play'}
                  >
                    {track.isPlaying ? <PauseIcon /> : <PlayIcon />}
                  </PlayPauseButton>

                  <ControlButton
                    onClick={handleSkipNext}
                    disabled={isControlLoading}
                    title="Next track"
                  >
                    <SkipNextIcon />
                  </ControlButton>
                </ControlsSection>
              </TrackInfoSection>
            </TopSection>

            <BottomSection>
              {track.nextTrack ? (
                <NextTrackSection>
                  <NextTrackThumbnail
                    src={track.nextTrack.albumCover}
                    alt="Next track"
                  />
                  <NextTrackInfo>
                    <NextTrackLabel>Up Next</NextTrackLabel>
                    <NextTrackName>{track.nextTrack.name}</NextTrackName>
                    <NextTrackArtist>{track.nextTrack.artist}</NextTrackArtist>
                  </NextTrackInfo>
                </NextTrackSection>
              ) : (
                <NextTrackLoadingSection>
                  <NextTrackLoadingThumbnail />
                  <NextTrackInfo>
                    <NextTrackLabel>Up Next</NextTrackLabel>
                    <NextTrackLoadingText />
                    <NextTrackLoadingText style={{ width: '80px' }} />
                  </NextTrackInfo>
                </NextTrackLoadingSection>
              )}
            </BottomSection>
          </MainContent>
        </InfoSection>
      </ContentWrapper>
      <NewsTicker />
    </DashboardContainer>
  );
};

export default SpotifyDashboard;
