declare module 'react-native-worklets' {
  export function scheduleOnRN<Args extends unknown[], ReturnValue>(
    fn: (...args: Args) => ReturnValue,
    ...args: Args
  ): void;
}
