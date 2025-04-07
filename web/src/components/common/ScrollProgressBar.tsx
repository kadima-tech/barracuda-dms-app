import { useEffect, useState } from 'react';
import styled from 'styled-components';

const ProgressBarContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: transparent;
  z-index: 1001;
`;

const ProgressBar = styled.div<{ width: number }>`
  height: 100%;
  background: ${({ theme }) => theme.colors.primary};
  width: ${({ width }) => width}%;
  transition: width 0.2s ease-out;
`;

export const ScrollProgressBar = () => {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const scrollProgress = (scrollTop / docHeight) * 100;
      setWidth(scrollProgress);
    };

    window.addEventListener('scroll', updateProgress);
    updateProgress();

    return () => window.removeEventListener('scroll', updateProgress);
  }, []);

  return (
    <ProgressBarContainer>
      <ProgressBar width={width} />
    </ProgressBarContainer>
  );
}; 