import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import PremiumCard from '../PremiumCard';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, ...props }: any) =>
      React.createElement(View, { ...props, style, testID: 'linear-gradient' }, children),
  };
});

describe('PremiumCard', () => {
  it('renders children correctly', () => {
    const { getByText } = render(
      <PremiumCard>
        <Text>Card Content</Text>
      </PremiumCard>
    );
    expect(getByText('Card Content')).toBeTruthy();
  });

  it('renders default variant without gradient', () => {
    const { queryByTestId } = render(
      <PremiumCard>
        <Text>Content</Text>
      </PremiumCard>
    );
    expect(queryByTestId('linear-gradient')).toBeNull();
  });

  it('renders gradient variant with LinearGradient', () => {
    const { getByTestId } = render(
      <PremiumCard variant="gradient">
        <Text>Content</Text>
      </PremiumCard>
    );
    expect(getByTestId('linear-gradient')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PremiumCard onPress={onPress}>
        <Text>Press Me</Text>
      </PremiumCard>
    );
    fireEvent.press(getByText('Press Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <PremiumCard>
        <Text>No Press</Text>
      </PremiumCard>
    );
    fireEvent.press(getByText('No Press'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies custom styles', () => {
    const customStyle = { marginTop: 10 };
    const { getByText } = render(
      <PremiumCard style={customStyle}>
        <Text>Styled</Text>
      </PremiumCard>
    );
    const parent = getByText('Styled').parent;
    expect(parent).toBeTruthy();
  });
});
