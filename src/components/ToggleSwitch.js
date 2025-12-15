import React from 'react';
import styled from 'styled-components';

const SwitchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
`;

const SwitchLabel = styled.label`
  font-size: 11px;
  color: ${props => props.theme.colors.secondary};
  cursor: pointer;
  user-select: none;
  font-weight: 500;
`;

const SwitchWrapper = styled.div`
  position: relative;
  display: inline-block;
`;

const SwitchInput = styled.input`
  opacity: 0;
  width: 0;
  height: 0;
  position: absolute;
`;

const SwitchSlider = styled.span`
  position: relative;
  display: inline-block;
  width: 32px;
  height: 18px;
  background-color: ${props => props.checked ? props.theme.colors.accent : 'rgba(255, 255, 255, 0.25)'};
  border-radius: 18px;
  transition: all 0.2s ease;
  cursor: pointer;

  &:before {
    content: '';
    position: absolute;
    top: 2px;
    left: ${props => props.checked ? '16px' : '2px'};
    width: 14px;
    height: 14px;
    background-color: ${props => props.checked ? '#000' : '#fff'};
    border-radius: 50%;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    background-color: ${props => props.checked ? 
      '#E9D5FF' : 
      'rgba(255, 255, 255, 0.35)'
    };
  }
`;

const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  color: ${props => props.theme.colors.secondary};
  opacity: 0.8;
`;

function ToggleSwitch({ 
  checked, 
  onChange, 
  label, 
  disabled = false,
  icon,
  tooltip 
}) {
  return (
    <SwitchContainer title={tooltip}>
      {icon && (
        <IconWrapper>
          {icon}
        </IconWrapper>
      )}
      
      <SwitchWrapper>
        <SwitchInput
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
        />
        <SwitchSlider 
          checked={checked}
          onClick={!disabled ? onChange : undefined}
        />
      </SwitchWrapper>
      
      {label && (
        <SwitchLabel onClick={!disabled ? onChange : undefined}>
          {label}
        </SwitchLabel>
      )}
    </SwitchContainer>
  );
}

export default ToggleSwitch;

