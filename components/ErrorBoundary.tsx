import React from 'react';
import { Pressable, Text, View } from 'react-native';

type Props = { children: React.ReactNode };
type State = { hasError: boolean; message: string };

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, message: '' };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 items-center justify-center bg-background px-8">
          <Text className="font-display text-xl text-foreground mb-2">Something went wrong</Text>
          <Text className="font-sans text-sm text-muted-fg text-center mb-6">
            {this.state.message || 'An unexpected error occurred.'}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => this.setState({ hasError: false, message: '' })}
            className="bg-primary rounded-md px-6 py-3"
          >
            <Text className="font-sans text-white">Try again</Text>
          </Pressable>
        </View>
      );
    }
    return this.props.children;
  }
}
