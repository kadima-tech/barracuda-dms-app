import styled, { css } from "styled-components";


type TitleProps = {
  active?: boolean;
};

type SmallProps = {
  margin?: boolean;
  children: React.ReactNode;
};

export const TitleH4 = styled.h4<TitleProps>`
  margin: 0;
  margin-bottom: ${({ theme }) => theme.spacing.medium};
  color: ${({ theme }) => theme.colors.primary};
`;


const StyledSmall = styled.small<SmallProps>`
  font-weight: 400;
  color: #aaa;

  ${({ margin }) =>
    margin &&
    css`
      margin-bottom: 0.4rem;
    `}
`;

export const Small: React.FC<SmallProps> = ({ margin, children, ...props }) => {
  return (
    <StyledSmall margin={margin} {...props}>
      {children}
    </StyledSmall>
  );
};
