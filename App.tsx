import React from 'react';
import {StatusBar, useColorScheme} from 'react-native';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import Navigation from './src/navigation';
import Toast from 'react-native-toast-message';
import {toastConfig} from './src/utils/toastConfig';

// Create a client for TanStack Query
const queryClient = new QueryClient();

function App(): React.JSX.Element {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#000' : '#fff'}
      />
      <Navigation />
      <Toast position="bottom" config={toastConfig} />
    </QueryClientProvider>
  );
}

export default App;
