// @ts-nocheck
// For Inferno, we recommend using Component classes instead of hooks
// This shim provides minimal hooks compatibility for compatibility only

const hookStates = new WeakMap();

export function useState<T>(initialValue?: T): [T, (value: T | ((prev: T) => T)) => void] {
  // This is a stub that returns initial value
  // For proper state management in Inferno, use Component class instead
  const state = initialValue;
  const setState = (value: any) => {
    // No-op in functional components
  };
  return [state, setState];
}

export function useEffect(effect: () => void | (() => void), deps?: any[]) {
  // This is a stub - effects don't work in functional components
  // Use componentDidMount/componentDidUpdate in Component class instead
}

export function useRef<T>(initialValue?: T): { current: T | undefined } {
  return { current: initialValue };
}