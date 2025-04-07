import styled from "styled-components";

export const Banner = styled.div`
  background: #ffffff;
  padding: 3rem;
  margin: 2rem 2rem 3rem 2rem;
  border-radius: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.03);
`;

export const BannerTitle = styled.h1`
  font-size: 2.4rem;
  margin: 0 0 0.5rem 0;
  color: #1a1a1a;
  font-weight: 700;
`;

export const BannerText = styled.p`
  font-size: 1.1rem;
  color: #666;
  margin: 0;
  max-width: 600px;
  line-height: 1.6;
`;
