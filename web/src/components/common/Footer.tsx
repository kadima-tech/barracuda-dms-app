import styled from 'styled-components';
import { Link } from 'react-router-dom';
import { GitHub, Mail } from 'react-feather';

const FooterContainer = styled.footer`
  background: white;
  padding: 1rem 0;
  border-top: 2px solid ${({ theme }) => theme.colors.primary};
  flex-shrink: 0;
`;

const FooterContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }
`;

const LeftSection = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
  }
`;

const BrandName = styled(Link)`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;

  a {
    color: ${({ theme }) => theme.colors.grey};
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  a {
    color: ${({ theme }) => theme.colors.grey};
    transition: color 0.2s ease;

    &:hover {
      color: ${({ theme }) => theme.colors.primary};
    }
  }
`;

const Copyright = styled.div`
  color: ${({ theme }) => theme.colors.grey};
  font-size: 0.9rem;
`;
export const Footer = () => {
  return (
    <FooterContainer>
      <FooterContent>
        <LeftSection>
          <BrandName to="/dashboard">BarracudaDMS</BrandName>

          <Copyright>
            © {new Date().getFullYear()} BarracudaDMS. All rights reserved.
          </Copyright>
          <FooterLinks>
            <Link to="/privacy">Privacy</Link>
            <Link to="/terms">Terms</Link>
            <Link to="/contact">Contact</Link>
          </FooterLinks>
        </LeftSection>

        <SocialLinks>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GitHub size={16} />
          </a>
          <a href="mailto:maurice@dvpd.nl">
            <Mail size={16} />
          </a>
        </SocialLinks>
      </FooterContent>
    </FooterContainer>
  );
};
