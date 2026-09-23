import { useEffect, useState } from 'react';

/**
 * Cuenta regresiva en segundos. Se basa en `remainingSeconds` que calcula el
 * servidor (no en la hora del navegador), así no importa si el reloj local está desfasado.
 */
export function useCountdown(remainingSeconds: number | null, running: boolean): number | null {
  const [seconds, setSeconds] = useState(remainingSeconds);

  useEffect(() => {
    setSeconds(remainingSeconds);
    if (remainingSeconds === null || !running) {
      return;
    }

    const deadline = Date.now() + remainingSeconds * 1000;
    const timer = window.setInterval(() => {
      const left = Math.max(0, Math.round((deadline - Date.now()) / 1000));
      setSeconds(left);
      if (left === 0) {
        window.clearInterval(timer);
      }
    }, 1000);

    return () => window.clearInterval(timer);
  }, [remainingSeconds, running]);

  return seconds;
}
