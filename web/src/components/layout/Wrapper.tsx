import styled from "styled-components";
import {
  Container,
  ContentBoxContainerPrimary,
  SimpleContainer,
} from "./Container";
import Theme from "../themes/defaultTheme";
import { ScrollProgressBar } from "../common/ScrollProgressBar";
import { Footer } from "../common/Footer";

const WrapperContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
`;

export const Wrapper = ({
  header,
  contentBoxPrimary,
  children,
}: {
  header?: React.ReactNode;
  contentBoxPrimary?: React.ReactNode;
  children?: React.ReactNode;
  contentBoxSecondary?: React.ReactNode;
  headerImage?: boolean;
}) => (
  <Theme>
    <WrapperContainer>
      <ScrollProgressBar />
      {header && <header>{header}</header>}

      <Container style={{ flex: 1 }}>
        <ContentBoxContainerPrimary>
          {contentBoxPrimary}
        </ContentBoxContainerPrimary>

        {children}
      </Container>
      <Footer />
    </WrapperContainer>
  </Theme>
);

export const SimpleWrapper = ({
  contentBoxPrimary,
  children,
}: {
  contentBoxPrimary?: React.ReactNode;
  children?: React.ReactNode;
}) => (
  <Theme>
    <WrapperContainer>
      <SimpleContainer>
        <ContentBoxContainerPrimary>
          {contentBoxPrimary}
        </ContentBoxContainerPrimary>

        {children}
      </SimpleContainer>
    </WrapperContainer>
  </Theme>
);
