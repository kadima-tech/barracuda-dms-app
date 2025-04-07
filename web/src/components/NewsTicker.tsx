import styled from "styled-components";
import { useEffect, useState, useRef } from "react";
import { API_BASE_URL } from "../utils/api/config";

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
}

const TickerContainer = styled.div`
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16px 0;
  z-index: 9999;
  overflow: hidden;
`;

const TickerWrapper = styled.div`
  display: flex;
  position: relative;
  width: 100%;
  height: 30px;
  overflow: hidden;
`;

const TickerContent = styled.div<{ offset: number }>`
  display: flex;
  align-items: center;
  white-space: nowrap;
  position: absolute;
  left: ${(props) => props.offset}px;
`;

const NewsLabel = styled.span`
  background: #1db954;
  color: black;
  padding: 6px 10px;
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
  margin-right: 20px;
  text-transform: uppercase;
`;

const NewsHeadline = styled.a`
  color: white;
  text-decoration: none;
  margin-right: 48px;
  font-size: 15px;
  opacity: 0.9;
  transition: opacity 0.3s ease;
  display: inline-block;
  letter-spacing: 0.2px;

  &:hover {
    opacity: 1;
    text-decoration: underline;
  }
`;

const NewsTicker = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [offset, setOffset] = useState(window.innerWidth);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const animationRef = useRef<number>();
  const lastTimeRef = useRef<number>();
  const currentOffsetRef = useRef<number>(window.innerWidth);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/proxy`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setNews(data);
      } catch (error) {
        console.error("Error fetching news:", error);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 300000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (contentRef.current) {
      setContentWidth(contentRef.current.offsetWidth);
    }
  }, [news]);

  useEffect(() => {
    if (!contentWidth) return;

    const PIXELS_PER_SECOND = 50; // Adjust speed here

    const animate = (timestamp: number) => {
      if (!lastTimeRef.current) {
        lastTimeRef.current = timestamp;
      }

      const deltaTime = timestamp - lastTimeRef.current;
      lastTimeRef.current = timestamp;

      // Calculate how many pixels to move based on time
      const pixelsToMove = (deltaTime / 1000) * PIXELS_PER_SECOND;

      currentOffsetRef.current -= pixelsToMove;

      // Reset position when content is off screen
      if (currentOffsetRef.current <= -contentWidth) {
        currentOffsetRef.current = window.innerWidth;
      }

      // Update state with interpolated value
      setOffset(currentOffsetRef.current);

      // Request next frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [contentWidth]);

  if (!news || news.length === 0) {
    return null;
  }

  return (
    <TickerContainer>
      <TickerWrapper>
        <TickerContent ref={contentRef} offset={offset}>
          {news.map((item, index) => (
            <div
              key={index}
              style={{
                display: "inline-flex",
                alignItems: "center",
              }}
            >
              <NewsLabel>NOS</NewsLabel>
              <NewsHeadline
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
              >
                {item.title}
              </NewsHeadline>
            </div>
          ))}
        </TickerContent>
      </TickerWrapper>
    </TickerContainer>
  );
};

export default NewsTicker;
