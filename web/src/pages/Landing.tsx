import styled from 'styled-components';
import { useEffect } from 'react';

const LandingContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
    Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #2d3748;
  background-color: #f8f9ff;
  display: flex;
  flex-direction: column;
`;

const ProgressContainer = styled.div`
  position: fixed;
  top: 0;
  z-index: 1000;
  width: 100%;
  height: 4px;
  background: transparent;
`;

const ProgressBar = styled.div<{ width: string }>`
  height: 4px;
  background: #0cbab1;
  width: ${(props) => props.width};
`;

const Header = styled.header`
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  position: fixed;
  width: 100%;
  top: 0;
  z-index: 100;
  height: 4.5rem;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    height: 3.5rem;
  }
`;

const HeaderContent = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;

  img {
    height: 3.5rem;
    width: auto;
    margin-right: 0.5rem;

    @media (max-width: 768px) {
      height: 2.5rem;
    }
  }

  h1 {
    display: flex;
    align-items: center;
    font-size: 1.8rem;
    margin: 0;

    @media (max-width: 768px) {
      font-size: 1.4rem;
    }
  }
`;

const GradientText = styled.span`
  background: linear-gradient(135deg, #0a8f88 0%, #14b8b0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-shadow: 0px 2px 4px rgba(10, 143, 136, 0.2);
  position: relative;
  display: inline-block;

  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Divider = styled.span`
  color: #0cbab1;
  font-weight: 200;
  margin: 0 0.5rem;
  opacity: 0.3;
`;

const Punchline = styled.span`
  color: #2d3748;
  font-size: 0.8rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0.85;

  @media (max-width: 768px) {
    font-size: 0.65rem;
  }
`;

const Hero = styled.section`
  background: linear-gradient(135deg, #0cbab1 0%, #098f88 100%);
  color: white;
  padding: 6rem 0 4rem;
  margin-bottom: 2rem;
  text-align: center;
  position: relative;
  overflow: hidden;
  border-radius: 0;
  box-shadow: none;
  display: flex;
  align-items: center;
  min-height: 60vh;

  @media (max-width: 768px) {
    padding: 4rem 0 3rem;
    min-height: 50vh;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 70%
    );
    z-index: 1;
  }
`;

const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;

  @media (max-width: 768px) {
    padding: 0 1rem;
  }
`;

const HeroContent = styled.div`
  position: relative;
  z-index: 2;
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;

  h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    line-height: 1.2;

    @media (max-width: 768px) {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  }

  p {
    font-size: 1.2rem;
    max-width: 800px;
    margin: 0 auto 2rem;
    opacity: 0.95;
    line-height: 1.7;

    @media (max-width: 768px) {
      font-size: 1rem;
      margin: 0 auto 1.5rem;
    }
  }
`;

const Button = styled.a`
  display: inline-block;
  padding: 1rem 2rem;
  background-color: white;
  color: #0cbab1;
  text-decoration: none;
  border-radius: 50px;
  font-weight: 600;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  font-size: 1.1rem;

  @media (max-width: 768px) {
    padding: 0.8rem 1.6rem;
    font-size: 1rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
  }
`;

const Main = styled.main`
  margin-top: 5rem;
  flex: 1;
  padding: 2rem 0;
`;

const Section = styled.section`
  margin-bottom: 3rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const SectionTitle = styled.h3`
  text-align: center;
  color: #4a5568;
  font-size: 1.8rem;
  margin: 1.5rem 0;
  font-weight: 600;
  position: relative;

  &:after {
    content: '';
    display: block;
    width: 40px;
    height: 2px;
    background: #0cbab1;
    margin: 0.5rem auto 0;
  }
`;

const FeaturesContainer = styled.div`
  padding: 2rem 2.5rem 3rem;

  @media (max-width: 768px) {
    padding: 1.5rem 1rem 2rem;
  }
`;

const FeaturesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const FeatureCard = styled.div`
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    margin: 0 0.5rem;
  }

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 8px 16px rgba(12, 186, 177, 0.12);
  }
`;

const FeatureImage = styled.div`
  background: linear-gradient(135deg, #0cbab1 0%, #098f88 100%);
  height: 220px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2.5rem;
  position: relative;
  overflow: hidden;

  @media (max-width: 768px) {
    height: 180px;
    padding: 1.5rem;
  }

  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(
      circle at center,
      rgba(255, 255, 255, 0.15) 0%,
      transparent 70%
    );
  }

  span {
    position: relative;
    z-index: 1;
    font-size: 3.5rem;
    transition: transform 0.3s ease;
  }

  ${FeatureCard}:hover & span {
    transform: scale(1.15) rotate(5deg);
  }
`;

const FeatureContent = styled.div`
  padding: 2rem;
  background: #f8f9ff;
  border-top: 3px solid rgba(12, 186, 177, 0.15);
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const FeatureTitle = styled.h4`
  color: #0cbab1;
  font-size: 1.25rem;
  margin: 0 0 1rem 0;
  text-align: center;
  font-weight: 700;
  width: 100%;
`;

const FeatureDescription = styled.p`
  color: #4a5568;
  text-align: center;
  line-height: 1.7;
  font-size: 0.95rem;
  margin: 0;
  flex-grow: 1;
`;

const ArchitectureContainer = styled.div`
  padding: 1.5rem 2.5rem 2.5rem;
`;

const ArchitectureContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const ArchitectureImage = styled.img`
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
`;

const ArchitectureText = styled.div`
  max-width: 800px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  font-size: 0.875rem;

  p {
    margin-bottom: 1rem;
    color: #4a5568;
  }

  ul {
    margin: 1rem 0 1rem 2rem;
    color: #4a5568;
  }

  ul li {
    margin-bottom: 0.5rem;
  }
`;

const BenefitsContainer = styled.div`
  padding: 2rem 2.5rem 3rem;
`;

const BenefitsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(380px, 1fr));
  gap: 1.5rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const BenefitItem = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 1.25rem;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 1rem;
    gap: 1rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(12, 186, 177, 0.12);
  }
`;

const BenefitIcon = styled.div`
  font-size: 1.75rem;
  color: #0cbab1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(12, 186, 177, 0.1);
  width: 50px;
  height: 50px;
  border-radius: 12px;

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    font-size: 1.4rem;
  }
`;

const BenefitContent = styled.div`
  h4 {
    font-size: 1.2rem;
    margin-bottom: 0.75rem;
    color: #2d3748;
    font-weight: 700;

    @media (max-width: 768px) {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
  }

  p {
    color: #4a5568;
    font-size: 0.95rem;
    line-height: 1.7;

    @media (max-width: 768px) {
      font-size: 0.85rem;
      line-height: 1.6;
    }
  }
`;

const ApplicationsContainer = styled.div`
  padding: 2rem 2.5rem 3rem;
`;

const ApplicationsList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  text-align: center;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const ApplicationItem = styled.div`
  padding: 2rem;
  background: white;
  border-radius: 12px;
  transition: all 0.3s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 1.5rem;
  }

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 16px rgba(12, 186, 177, 0.12);
  }

  h4 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    color: #2d3748;
    font-weight: 600;

    @media (max-width: 768px) {
      font-size: 1rem;
      margin-bottom: 0.5rem;
    }
  }

  p {
    color: #4a5568;
    font-size: 0.9rem;
    line-height: 1.6;
    text-align: center;

    @media (max-width: 768px) {
      font-size: 0.85rem;
      line-height: 1.5;
    }
  }
`;

const ApplicationIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 1.25rem;
  color: #0cbab1;
  background: rgba(12, 186, 177, 0.1);
  width: 80px;
  height: 80px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 2.5rem;
    margin-bottom: 1rem;
    border-radius: 15px;
  }
`;

const Footer = styled.footer`
  background: white;
  padding: 1.5rem 0;
  border-top: 2px solid #0cbab1;
  margin-top: auto;

  @media (max-width: 768px) {
    padding: 1rem 0;
  }
`;

const FooterContent = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
    gap: 0.75rem;
  }
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 2rem;
  flex-wrap: wrap;

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 0.75rem;
  }
`;

const BrandName = styled.a`
  color: #0cbab1;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const Copyright = styled.div`
  color: #4a5568;
  font-size: 0.9rem;

  @media (max-width: 768px) {
    font-size: 0.8rem;
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 2rem;

  @media (max-width: 768px) {
    gap: 1rem;
  }

  a {
    color: #a0aec0;
    text-decoration: none;
    font-size: 0.9rem;
    transition: color 0.2s ease;

    @media (max-width: 768px) {
      font-size: 0.8rem;
    }

    &:hover {
      color: #0cbab1;
    }
  }
`;

const SocialLinks = styled.div`
  display: flex;
  gap: 1rem;

  @media (max-width: 768px) {
    margin-top: 0.5rem;
  }

  a {
    color: #a0aec0;
    text-decoration: none;
    font-size: 1.2rem;
    transition: color 0.2s ease;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }

    &:hover {
      color: #0cbab1;
    }
  }
`;

const Landing = () => {
  useEffect(() => {
    // Progress Bar
    const handleScroll = () => {
      const winScroll = document.documentElement.scrollTop;
      const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      const progressBar = document.getElementById('progressBar');
      if (progressBar) {
        progressBar.style.width = `${scrolled}%`;
      }
    };

    window.addEventListener('scroll', handleScroll);

    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
      anchor.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.querySelector(
          anchor.getAttribute('href') || ''
        );
        if (target) {
          target.scrollIntoView({
            behavior: 'smooth',
          });
        }
      });
    });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <LandingContainer>
      <ProgressContainer>
        <ProgressBar id="progressBar" width="0%" />
      </ProgressContainer>

      <Header>
        <Container>
          <HeaderContent>
            <Logo>
              <img src="/assets/logo.png" alt="Barracuda Logo" />
              <h1>
                <GradientText>BarracudaDMS</GradientText>
                <Divider>|</Divider>
                <Punchline>Streamline Your Device Management</Punchline>
              </h1>
            </Logo>
          </HeaderContent>
        </Container>
      </Header>

      <Hero>
        <Container>
          <HeroContent>
            <h2>A Scalable and Modular Cloud-Based Digital Signage Solution</h2>
            <p>
              BarracudaDMS is a powerful Device Management System designed to
              revolutionize how organizations monitor, manage, and control
              connected digital signage devices. Built on modern technology
              stack with React, TypeScript, Node.js, and PostgreSQL, it
              overcomes the limitations of traditional systems by offering
              modular hardware components, real-time monitoring, and seamless
              content distribution.
            </p>
            <Button href="#features">Explore Features</Button>
          </HeroContent>
        </Container>
      </Hero>

      <Main>
        <Container>
          <Section id="features">
            <SectionTitle>Platform Features</SectionTitle>
            <FeaturesContainer>
              <FeaturesGrid>
                <FeatureCard>
                  <FeatureImage>
                    <span>🖥️</span>
                  </FeatureImage>
                  <FeatureContent>
                    <FeatureTitle>Advanced Device Management</FeatureTitle>
                    <FeatureDescription>
                      Comprehensive control panel for monitoring and managing
                      connected devices via WebSockets. Track device health
                      metrics including temperature, CPU load, memory usage, and
                      uptime in real-time. Send remote commands like reboot
                      without physical access to devices.
                    </FeatureDescription>
                  </FeatureContent>
                </FeatureCard>
                <FeatureCard>
                  <FeatureImage>
                    <span>🔄</span>
                  </FeatureImage>
                  <FeatureContent>
                    <FeatureTitle>
                      Intelligent Content Distribution
                    </FeatureTitle>
                    <FeatureDescription>
                      Dynamically update content across all devices from a
                      central dashboard. Change web application URLs remotely,
                      upload multimedia content directly to devices, and
                      schedule content deployment with intelligent pre-caching
                      to minimize network traffic and ensure smooth transitions.
                    </FeatureDescription>
                  </FeatureContent>
                </FeatureCard>
                <FeatureCard>
                  <FeatureImage>
                    <span>📊</span>
                  </FeatureImage>
                  <FeatureContent>
                    <FeatureTitle>Comprehensive Analytics</FeatureTitle>
                    <FeatureDescription>
                      Monitor critical device metrics including temperature,
                      uptime, CPU load, memory usage, and disk utilization.
                      Receive alerts for potential issues, analyze performance
                      trends, and anticipate maintenance needs before problems
                      affect your digital signage network.
                    </FeatureDescription>
                  </FeatureContent>
                </FeatureCard>
              </FeaturesGrid>
            </FeaturesContainer>
          </Section>

          <Section id="architecture">
            <SectionTitle>System Architecture</SectionTitle>
            <ArchitectureContainer>
              <ArchitectureContent>
                <ArchitectureImage
                  src="/assets/architecture.svg"
                  alt="BarracudaDMS System Architecture"
                />
                <ArchitectureText>
                  <p>
                    BarracudaDMS consists of a modular architecture designed for
                    scalability, reliability, and future extensibility:
                  </p>
                  <ul>
                    <li>
                      <strong>Frontend:</strong> React + TypeScript application
                      providing an intuitive user interface with real-time
                      device monitoring and content management capabilities
                    </li>
                    <li>
                      <strong>Backend:</strong> Node.js with Express, providing
                      RESTful APIs and Socket.IO WebSocket server for
                      persistent, real-time communication with devices
                    </li>
                    <li>
                      <strong>Database:</strong> PostgreSQL for reliable data
                      storage of device information, performance metrics, and
                      content management records
                    </li>
                    <li>
                      <strong>Hardware:</strong> Raspberry Pi 5 for our first
                      version, with plans to use the Compute Module 4/5 (CM4/5)
                      for future versions, featuring dual-display support up to
                      4K resolution and hardware video-decoding capabilities
                    </li>
                    <li>
                      <strong>Displays:</strong> Modular display components that
                      can be easily swapped or upgraded without replacing the
                      entire system
                    </li>
                    <li>
                      <strong>Connectivity:</strong> WebSocket connections for
                      real-time updates and Power over Ethernet (PoE) for
                      simplified installation with a single cable for both power
                      and data
                    </li>
                    <li>
                      <strong>Kiosk Mode:</strong> Custom Chromium kiosk
                      implementation that automatically boots into full-screen
                      browser mode for seamless display operation with enhanced
                      security and performance
                    </li>
                  </ul>
                  <p>
                    This robust architecture enables the system to handle more
                    than 1000 devices simultaneously while maintaining efficient
                    content delivery through pre-caching mechanisms and
                    optimized network communication.
                  </p>
                </ArchitectureText>
              </ArchitectureContent>
            </ArchitectureContainer>
          </Section>

          <Section id="benefits">
            <SectionTitle>Key Benefits</SectionTitle>
            <BenefitsContainer>
              <BenefitsList>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Hardware Modularity</h4>
                    <p>
                      The Raspberry Pi architecture allows individual components
                      to be replaced rather than entire systems, significantly
                      reducing maintenance costs and electronic waste while
                      extending the overall lifespan of your digital signage
                      investment.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Future-Proof Design</h4>
                    <p>
                      The system ensures compatibility with future hardware
                      versions and provides ongoing software updates through
                      CI/CD pipelines. The modular architecture allows seamless
                      upgrades without requiring complete system replacement,
                      protecting your investment.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Simplified Infrastructure</h4>
                    <p>
                      Power over Ethernet (PoE) capabilities dramatically reduce
                      installation complexity by combining power and data
                      transmission in a single cable, eliminating the need for
                      additional power outlets and reducing cable management
                      issues in deployment locations.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Enhanced Security Protocol</h4>
                    <p>
                      All system communications are secured via HTTPS, with
                      robust device authentication during registration to
                      prevent unauthorized access. The system maintains updated
                      security protocols, unlike legacy systems with outdated
                      TLS/SSL implementations.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Centralized Management Console</h4>
                    <p>
                      The comprehensive dashboard provides a single interface
                      for managing all devices, content, and system health.
                      Real-time metrics, alerts, and command execution
                      capabilities eliminate the need for multiple tools and
                      reduce operational complexity.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Minimal Energy Consumption</h4>
                    <p>
                      The system leverages the energy-efficient ARM architecture
                      of the Raspberry Pi, consuming significantly less power
                      than traditional digital signage solutions while
                      maintaining optimal performance and reliability for 24/7
                      operation.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Automatic Device Registration</h4>
                    <p>
                      Newly deployed devices automatically register with the DMS
                      upon first startup, eliminating manual configuration steps
                      and allowing for rapid deployment of multiple devices
                      across different locations simultaneously.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>✅</BenefitIcon>
                  <BenefitContent>
                    <h4>Proactive Maintenance</h4>
                    <p>
                      The system continuously monitors device health metrics and
                      alerts administrators to potential issues before they
                      cause failures. This proactive approach minimizes downtime
                      and ensures reliable operation of your digital signage
                      network.
                    </p>
                  </BenefitContent>
                </BenefitItem>
              </BenefitsList>
            </BenefitsContainer>
          </Section>

          <Section id="applications">
            <SectionTitle>Applications</SectionTitle>
            <ApplicationsContainer>
              <ApplicationsList>
                <ApplicationItem>
                  <ApplicationIcon>🚪</ApplicationIcon>
                  <h4>Meeting Room & Door Displays</h4>
                  <p>
                    Interactive room status indicators for offices, conference
                    centers, and healthcare facilities. Show real-time booking
                    information, availability status, and upcoming meetings with
                    integration to popular calendar systems.
                  </p>
                </ApplicationItem>
                <ApplicationItem>
                  <ApplicationIcon>🏪</ApplicationIcon>
                  <h4>Retail Digital Signage</h4>
                  <p>
                    Dynamic product information displays, promotional content,
                    and wayfinding solutions for retail environments. Remotely
                    update pricing, promotions, and product details across
                    multiple store locations from a central dashboard.
                  </p>
                </ApplicationItem>
                <ApplicationItem>
                  <ApplicationIcon>🏥</ApplicationIcon>
                  <h4>Healthcare Information Systems</h4>
                  <p>
                    Clear wayfinding, patient information, and queue management
                    displays for hospitals and healthcare facilities. Improve
                    patient experience while reducing staff workload with
                    automated, real-time information distribution.
                  </p>
                </ApplicationItem>
                <ApplicationItem>
                  <ApplicationIcon>📱</ApplicationIcon>
                  <h4>Interactive Digital Kiosks</h4>
                  <p>
                    Self-service information points for public spaces, museums,
                    transportation hubs, and commercial venues. Provide
                    interactive maps, schedules, product catalogs, and
                    information services with centralized content management.
                  </p>
                </ApplicationItem>
                <ApplicationItem>
                  <ApplicationIcon>📺</ApplicationIcon>
                  <h4>Large-Format LED Walls</h4>
                  <p>
                    High-impact visual displays for events, stadiums, corporate
                    lobbies, and advertising installations. Deliver stunning
                    visual content at scale with remote management capabilities
                    and reliable 24/7 operation.
                  </p>
                </ApplicationItem>
                <ApplicationItem>
                  <ApplicationIcon>🏢</ApplicationIcon>
                  <h4>Corporate Communication</h4>
                  <p>
                    Internal communication displays for employee information,
                    KPI dashboards, and company announcements. Keep your entire
                    organization informed with targeted messaging across
                    multiple locations and departments.
                  </p>
                </ApplicationItem>
              </ApplicationsList>
            </ApplicationsContainer>
          </Section>

          <Section id="technical">
            <SectionTitle>Technical Implementation</SectionTitle>
            <BenefitsContainer>
              <BenefitsList>
                <BenefitItem>
                  <BenefitIcon>🔌</BenefitIcon>
                  <BenefitContent>
                    <h4>WebSocket Communication</h4>
                    <p>
                      The system utilizes Socket.IO for reliable, bidirectional
                      communication between devices and the management server.
                      This enables real-time monitoring, instant command
                      execution, and resilient connections with automatic
                      reconnection capabilities.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>🔄</BenefitIcon>
                  <BenefitContent>
                    <h4>CI/CD Integration</h4>
                    <p>
                      A robust CI/CD pipeline built with Docker and Terraform
                      ensures reliable and automated deployments, consistent
                      testing, and seamless updates to both server and client
                      components without disrupting active displays.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>🛡️</BenefitIcon>
                  <BenefitContent>
                    <h4>Device Authentication</h4>
                    <p>
                      Each device is identified by a unique hardware ID derived
                      from its CPU serial number, ensuring secure authentication
                      and preventing unauthorized devices from connecting to the
                      management system.
                    </p>
                  </BenefitContent>
                </BenefitItem>
                <BenefitItem>
                  <BenefitIcon>📡</BenefitIcon>
                  <BenefitContent>
                    <h4>Resilient Connectivity</h4>
                    <p>
                      Advanced reconnection logic and error handling ensure
                      devices maintain persistent connections with the
                      management server, automatically recovering from network
                      interruptions without manual intervention.
                    </p>
                  </BenefitContent>
                </BenefitItem>
              </BenefitsList>
            </BenefitsContainer>
          </Section>
        </Container>
      </Main>

      <Footer>
        <Container>
          <FooterContent>
            <FooterLeft>
              <BrandName href="#">BarracudaDMS</BrandName>
              <Copyright>© 2024 BarracudaDMS. All rights reserved.</Copyright>
              <FooterLinks>
                <a href="#">Privacy</a>
                <a href="#">Terms</a>
                <a href="#">Contact</a>
              </FooterLinks>
            </FooterLeft>
            <SocialLinks>
              <a href="mailto:maurice@dvpd.nl">
                <span>&#x2709;</span>
              </a>
            </SocialLinks>
          </FooterContent>
        </Container>
      </Footer>
    </LandingContainer>
  );
};

export default Landing;
