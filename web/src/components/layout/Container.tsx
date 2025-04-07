import styled from "styled-components";

export const Container = styled.div`
  margin-top: 4.5rem; // Account for fixed header height
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;
  max-width: 1800px;
  margin-left: auto;
  margin-right: auto;
`;

export const SimpleContainer = styled.div`
  width: 100%;
  box-sizing: border-box;
  max-width: 1800px;
  margin-left: auto;
  margin-right: auto;
`;

export const BaseContentBoxContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  position: relative;
  background-color: ${({ theme }) => theme.colors.red};
  flex-direction: row;
  padding-top: ${({ theme }) => theme.spacing.medium};
  padding-bottom: ${({ theme }) => theme.spacing.medium};
  width: 100%;

  margin: 0 auto;
  z-index: 1;
`;

export const ContentBoxContainer = styled(BaseContentBoxContainer)``;

export const ContentBoxContainerPrimary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
  position: relative;
  z-index: 1;
  background-color: #ffffff;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: radial-gradient(#f0f0f0 2px, transparent 2px);
    background-size: 30px 30px;
    background-position: 0 0;
    opacity: 0.5;
    z-index: -1;
    animation: floatingDots 120s linear infinite;
  }

  @keyframes floatingDots {
    0% {
      background-position: 0 0;
    }
    100% {
      background-position: 100% 100%;
    }
  }
`;
