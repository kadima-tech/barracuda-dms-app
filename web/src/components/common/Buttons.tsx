import React from 'react';
import styled from 'styled-components';
import Icon from './Icon';



interface ButtonProps {
  color?: string;
  icon?: string;
  children?: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  style?: object;
  disabled?: boolean;
  hasText?: boolean;
}

export const ButtonContainer = styled.div<{
  direction?: 'vertical' | 'horizontal';
}>`
  display: flex;
  flex-direction: ${(props) =>
    props.direction === 'horizontal' ? 'row' : 'column'};
  margin-top: ${(props) => props.theme.spacing.small};
  min-width: 15rem;
  align-items: center;
  gap: ${(props) => props.theme.spacing.medium};
`;

const ButtonPrimaryStyle = styled.button<ButtonProps>`
  background-color: ${(props) =>
    props.disabled
      ? 'lightgrey'
      : props.color === 'important'
      ? 'red'
      : props.theme.colors.primary};
  white-space: nowrap;
  display: inline-flex;
  align-self: flex-start;
  align-items: center;
  justify-content: center;
  padding: ${(props) =>
    !props.hasText ? '0' : `0 ${props.theme.spacing.medium}`};
  height: ${(props) => props.theme.spacing.large};
  min-width: ${(props) => props.theme.spacing.large};
  gap: 8px;
  border-radius: 50rem;
  border-style: solid;
  border-width: 0;
  border-color: inherit;
  font-size: 18px;
  color: ${(props) => props.theme.colors.white};
  cursor: pointer;

  &:hover {
    cursor: ${(props) => (props.disabled ? 'default' : 'pointer')};
    background-color: ${(props) => props.theme.colors.secondary};
    color: ${(props) => props.theme.colors.white};
  }
`;

const ButtonSecondaryStyle = styled(ButtonPrimaryStyle)`
  background-color: ${(props) =>
    props.disabled ? 'lightgrey' : props.theme.colors.white};
  border-width: 4px;
  border-color: currentColor;
  color: ${(props) =>
    props.color === 'primary'
      ? props.theme.colors.primary
      : props.theme.colors.secondary};

  &:hover {
    background-color: ${(props) => props.theme.colors.white};
    color: ${(props) =>
      props.color === 'primary'
        ? props.theme.colors.secondary
        : props.theme.colors.primary};
  }
`;

export const ButtonSmallStyle = styled.button<ButtonProps>`
  background-color: transparent;
  border: none;
  border-bottom: 1px solid currentColor;
  color: ${(props) => props.theme.colors.primary};
  font-weight: 700;
  font-size: 1rem;
  line-height: 1.5;
  display: flex;
  width: auto;
  cursor: pointer;
  padding: 0;
  align-items: center;
  gap: ${(props) => props.theme.spacing.xxsmall};
  transition: min-width 0.3s ease-in-out;

  &:hover,
  &.active {
    color: ${(props) => props.theme.colors.secondary};
  }
`;

export const Button = styled.button`
  width: 300px;
  height: 35px;
  background-color: red;
  border-radius: 3px;
`;

const ButtonPrimary = ({ color, icon, ...props }: ButtonProps) => {
  return (
    <ButtonPrimaryStyle
      {...props}
      color={color}
      onClick={props.onClick}
      icon={icon}
      hasText={!!props.children}
    >
      {icon ? <Icon variant={icon} size="medium" /> : undefined}
      {props.children}
    </ButtonPrimaryStyle>
  );
};

const ButtonSecondary = ({ color, icon, ...props }: ButtonProps) => {
  return (
    <ButtonSecondaryStyle
      {...props}
      color={color}
      onClick={props.onClick}
      icon={icon}
      hasText={!!props.children}
    >
      {icon ? <Icon variant={icon} size="medium" /> : undefined}
      {props.children}
    </ButtonSecondaryStyle>
  );
};

const ButtonSmall = ({ color, icon, ...props }: ButtonProps) => {
  return (
    <ButtonSmallStyle
      {...props}
      color={color}
      onClick={props.onClick}
      icon={icon}
      hasText={!!props.children}
    >
      {icon ? <Icon variant={icon} size="small" /> : undefined}
      {props.children}
    </ButtonSmallStyle>
  );
};

export { ButtonPrimary, ButtonSecondary, ButtonSmall };

export default ButtonContainer;
