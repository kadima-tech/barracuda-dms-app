import { useEffect, useState } from "react";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import { paths } from "../config/paths";

const LandingContainer = styled.div`
  width: 100%;
  height: 100%;
  overflow-y: auto;
  position: relative;
`;

const AppButton = styled.button`
  position: fixed;
  bottom: 2rem;
  right: 2rem;
  background: linear-gradient(135deg, #0cbab1 0%, #098f88 100%);
  color: white;
  border: none;
  border-radius: var(--border-radius, 12px);
  padding: 0.75rem 1.5rem;
  font-weight: 600;
  font-size: 0.95rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(12, 186, 177, 0.15);
  transition: all 0.3s ease;
  z-index: 100;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
    sans-serif;
  letter-spacing: 0.01em;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(12, 186, 177, 0.25);
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(12, 186, 177, 0.2);
  }

  svg {
    transition: transform 0.2s ease;
  }

  &:hover svg {
    transform: rotate(90deg);
  }
`;

const Landing = () => {
  const navigate = useNavigate();
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [cssStyles, setCssStyles] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch the index.html content
    fetch("/index.html")
      .then((response) => response.text())
      .then((html) => {
        // Extract the body content from the HTML
        const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);

        // Extract styles from the head
        const styleMatch = html.match(/<style[^>]*>([\s\S]*)<\/style>/i);

        if (bodyMatch && bodyMatch[1]) {
          // Fix asset paths in the HTML content
          let content = bodyMatch[1];
          // Replace relative URLs with absolute URLs
          content = content.replace(/src="\/assets\//g, 'src="/assets/');
          content = content.replace(/href="\/assets\//g, 'href="/assets/');

          setHtmlContent(content);
        } else {
          console.error("Could not extract body content from index.html");
          setHtmlContent("<div>Error loading landing page content</div>");
        }

        if (styleMatch && styleMatch[1]) {
          // Fix asset paths in the CSS
          let styles = styleMatch[1];
          // Replace relative URLs with absolute URLs in CSS
          styles = styles.replace(/url\(\/assets\//g, "url(/assets/");

          setCssStyles(styles);
        } else {
          console.error("Could not extract style content from index.html");
        }

        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching index.html:", error);
        setHtmlContent("<div>Error loading landing page content</div>");
        setLoading(false);
      });
  }, []);

  const goToDashboard = () => {
    navigate(paths.global.dashboard);
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Loading landing page...</p>
      </div>
    );
  }

  return (
    <LandingContainer>
      {cssStyles && <style dangerouslySetInnerHTML={{ __html: cssStyles }} />}
      <div dangerouslySetInnerHTML={{ __html: htmlContent }} />
      {/* <AppButton onClick={goToDashboard}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 22V12h6v10"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        Explore Dashboard
      </AppButton> */}
    </LandingContainer>
  );
};

export default Landing;
