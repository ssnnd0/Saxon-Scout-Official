import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  delay?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onHold?: () => void;
  holdInterval?: number; // Interval for repeated triggers while holding
}

export const useLongPress = (
  onLongPress: () => void,
  options: UseLongPressOptions = {}
) => {
  const {
    delay = 500,
    onStart,
    onEnd,
    onHold,
    holdInterval = 150
  } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressRef = useRef(false);
  const touchStartTimeRef = useRef(0);

  const handleMouseDown = useCallback(() => {
    isLongPressRef.current = false;
    touchStartTimeRef.current = Date.now();
    onStart?.();

    timeoutRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      onHold?.();
      onLongPress();

      // Set up interval for repeated triggers
      intervalRef.current = setInterval(() => {
        onLongPress();
      }, holdInterval);
    }, delay);
  }, [delay, holdInterval, onStart, onHold, onLongPress]);

  const handleMouseUp = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onEnd?.();
    isLongPressRef.current = false;
  }, [onEnd]);

  const handleMouseLeave = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    onEnd?.();
    isLongPressRef.current = false;
  }, [onEnd]);

  // Touch events for mobile
  const handleTouchStart = useCallback(() => {
    handleMouseDown();
  }, [handleMouseDown]);

  const handleTouchEnd = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  const handleTouchCancel = useCallback(() => {
    handleMouseLeave();
  }, [handleMouseLeave]);

  return {
    onMouseDown: handleMouseDown,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseLeave,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel
  };
};
