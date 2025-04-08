import styled from 'styled-components';
import Navbar from './Navbar';
import { Link } from 'react-router-dom';
import { paths } from '../../config/paths';

const StyledHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
  background-color: white;
  height: 4.5rem;
  padding: 0 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
`;

const LogoLink = styled(Link)`
  text-decoration: none;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;

  img {
    height: 4rem;
    width: auto;
  }

  h3 {
    display: flex;
    align-items: center;
    margin: 0;

    > :first-child {
      background: linear-gradient(135deg, #0a8f88 0%, #14b8b0 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      font-size: 2rem;
      font-weight: 900;
      letter-spacing: -0.02em;
      text-shadow: 0px 2px 4px rgba(10, 143, 136, 0.2);
      position: relative;
      display: inline-block;
    }

    span.divider {
      color: #0a8f88;
      font-weight: 200;
      margin: 0 0.75rem;
      opacity: 0.3;
    }

    span.punchline {
      color: #2c3e50;
      font-size: 0.875rem;
      font-weight: 500;
      letter-spacing: 0.01em;
      opacity: 0.85;
    }
  }
`;

const Header = () => {
  return (
    <StyledHeader>
      <LogoLink to={paths.global.landingPage}>
        <Logo>
          <img src="/assets/logo.png" alt="Barracuda Logo" />
          <h3>
            <span>BarracudaDMS</span>
            <span className="divider">|</span>
            <span className="punchline">Streamline Your Device Management</span>
          </h3>
        </Logo>
      </LogoLink>
      <Navbar />
    </StyledHeader>
  );
};

export { Header };
