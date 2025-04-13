'use client';

import styled from 'styled-components';

import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';

import { paths } from '../../config/paths';
import ClientOnly from './ClientOnly';

interface navProps {
  isMobile: boolean;
  type?: string;
  drawerState?: boolean;
}

const NavItem = styled(Link)<{ mobile: number; isActive?: boolean }>`
  display: flex;
  align-items: center;
  color: ${(props) => (props.isActive ? '#0CBAB1' : '#4a5568')};
  font-weight: 500;
  text-decoration: none;
  font-size: 0.95rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  transition: all 0.2s ease-in-out;
  position: relative;

  &:after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 50%;
    transform: translateX(-50%);
    width: ${(props) => (props.isActive ? '80%' : '0')};
    height: 2px;
    background-color: #0cbab1;
    transition: all 0.2s ease-in-out;
  }

  ${(props) =>
    props.mobile === 1
      ? `
    border: 1px solid #e2e8f0;
    width: 100%;
    justify-content: center;
    margin: 0.25rem 0;
    
    &:after {
      display: none;
    }
  `
      : ''}

  &:hover {
    color: #0cbab1;
    background-color: ${(props) =>
      props.isActive ? 'transparent' : 'rgba(12, 186, 177, 0.05)'};

    &:after {
      width: ${(props) => (props.mobile === 0 ? '80%' : '0')};
    }
  }
`;

const StyledNav = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`;

const NavItemWrapper = styled.div<navProps>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  height: 100%;

  @media (max-width: 991px) {
    position: fixed;
    top: 4.5rem;
    right: ${(props) => (props.drawerState ? '0' : '-100%')};
    width: 250px;
    height: calc(100vh - 4.5rem);
    background-color: white;
    flex-direction: column;
    padding: 1rem;
    box-shadow: -2px 0 8px rgba(0, 0, 0, 0.1);
    transition: right 0.3s ease-in-out;
  }
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #4a5568;

  @media (max-width: 991px) {
    display: block;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const Navbar = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 992);
      if (window.innerWidth >= 992) {
        setIsDrawerOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const toggleDrawer = () => {
    setIsDrawerOpen(!isDrawerOpen);
  };

  const NavItems = (mobile: number) => (
    <>
      <NavItem
        mobile={mobile}
        to={paths.global.dashboard}
        isActive={window.location.pathname === paths.global.dashboard}
      >
        Dashboard
      </NavItem>
      <NavItem
        mobile={mobile}
        to={paths.global.deviceManagement}
        isActive={window.location.pathname === paths.global.deviceManagement}
      >
        Device Management
      </NavItem>
      <NavItem
        mobile={mobile}
        to={paths.global.alert}
        isActive={window.location.pathname === paths.global.alert}
      >
        Alerts
      </NavItem>
      <NavItem
        mobile={mobile}
        to={paths.global.userManagement}
        isActive={window.location.pathname === paths.global.userManagement}
      >
        User Management
      </NavItem>
      <NavItem
        mobile={mobile}
        to={paths.global.contact}
        isActive={window.location.pathname === paths.global.contact}
      >
        Contact
      </NavItem>
    </>
  );

  return (
    <ClientOnly fallback={<div>Loading navigation...</div>}>
      <StyledNav>
        {isMobile && (
          <MobileMenuButton onClick={toggleDrawer}>
            {isDrawerOpen ? '✕' : '☰'}
          </MobileMenuButton>
        )}
        <NavItemWrapper isMobile={isMobile} drawerState={isDrawerOpen}>
          {NavItems(isMobile ? 1 : 0)}
        </NavItemWrapper>
      </StyledNav>
    </ClientOnly>
  );
};

export default Navbar;
