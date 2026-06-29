/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import App from '../App';

jest.mock('react-native-sound', () => {
  const SoundMock = jest.fn().mockImplementation((_file, _basePath, onLoad) => {
    onLoad?.();

    return {
      isLoaded: jest.fn(() => true),
      play: jest.fn(),
      release: jest.fn(),
      setCurrentTime: jest.fn(),
      setNumberOfLoops: jest.fn(),
      setVolume: jest.fn(),
      stop: jest.fn(onStop => onStop?.()),
    };
  });

  SoundMock.setCategory = jest.fn();

  return SoundMock;
});

test('renders correctly', async () => {
  let app: ReactTestRenderer.ReactTestRenderer | undefined;

  await ReactTestRenderer.act(() => {
    app = ReactTestRenderer.create(<App />);
  });

  app?.unmount();
});
