import { useEffect, useRef } from 'react';
import { useMeetingStore } from '../store/useMeetingStore';

/**
 * useTabVisibilityTracker
 * Monitors student presence using Page Visibility API + window blur/focus.
 * Triggers alerts only for students when they navigate to external tabs/windows (YouTube, Games, etc.).
 * In-app AI tools (Quiz, Simplifier, Notes, PPT) do not cause tab switches.
 */
export const useTabVisibilityTracker = () => {
  const { userRole, sendTabSwitchEventFn, addToast } = useMeetingStore();
  const awayStartTimeRef = useRef<number | null>(null);
  const violationCountRef = useRef<number>(0);
  const debounceTimerRef = useRef<any>(null);
  const isAwayRef = useRef<boolean>(false);

  useEffect(() => {
    // Only track students. Teachers/Hosts are not monitored.
    if (userRole !== 'student') return;

    const originalTitle = document.title || 'Smart Meet';

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab was switched or minimized
        if (!isAwayRef.current) {
          // Debounce slightly (800ms) to ignore momentary OS focus glitches
          debounceTimerRef.current = setTimeout(() => {
            isAwayRef.current = true;
            awayStartTimeRef.current = Date.now();
            document.title = '⚠️ ATTENTION: Return to Classroom!';

            const fn = useMeetingStore.getState().sendTabSwitchEventFn;
            if (fn) {
              fn('away', 0, 'social_or_external_tab');
            }
          }, 800);
        }
      } else {
        // Tab was restored/focused
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
          debounceTimerRef.current = null;
        }

        if (isAwayRef.current && awayStartTimeRef.current) {
          const duration = Math.max(1, Math.round((Date.now() - awayStartTimeRef.current) / 1000));
          isAwayRef.current = false;
          awayStartTimeRef.current = null;
          document.title = originalTitle;

          violationCountRef.current += 1;
          const currentViolations = violationCountRef.current;

          // Notify teacher via WebRTC / BroadcastChannel
          const fn = useMeetingStore.getState().sendTabSwitchEventFn;
          if (fn) {
            fn('returned', duration, 'social_or_external_tab');
          }

          // Show student notice
          useMeetingStore.setState({
            studentReturnedNotice: {
              duration,
              violationCount: currentViolations
            }
          });

          addToast(
            `⚠️ Proctor Warning: You were away from class for ${duration}s. Teacher has been notified! (Violation #${currentViolations})`,
            'warning'
          );
        }
      }
    };

    const handleWindowBlur = () => {
      // Optional: triggers when user clicks outside browser or switches to another desktop app
      if (!isAwayRef.current && document.hidden) {
        handleVisibilityChange();
      }
    };

    const handleWindowFocus = () => {
      if (isAwayRef.current) {
        handleVisibilityChange();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.title = originalTitle;
    };
  }, [userRole, sendTabSwitchEventFn, addToast]);
};

export default useTabVisibilityTracker;
