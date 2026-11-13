import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import startBackgroundUrl from '@assets/IMG_1402_1791524151994.jpeg';
import { preloadGameTextures } from './textures';

export default function StartupSplash() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const previousBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const backgroundReady = new Promise<void>(resolve => {
      const image = new Image();
      image.onload = () => resolve();
      image.onerror = () => resolve();
      image.src = startBackgroundUrl;
      if (image.complete) resolve();
    });

    void Promise.all([
      preloadGameTextures(),
      backgroundReady,
      document.fonts?.ready ?? Promise.resolve(),
    ]).finally(() => {
      if (active) {
        document.body.style.overflow = previousBodyOverflow;
        setReady(true);
      }
    });

    return () => {
      active = false;
      document.body.style.overflow = previousBodyOverflow;
    };
  }, []);

  if (ready) return null;

  return createPortal(
    <div className="startup-splash" role="status" aria-live="polite">
      <div className="startup-splash-title">TipeTek</div>
      <div className="startup-splash-caption">RESSOURCEN WERDEN GELADEN</div>
      <div className="startup-splash-track" aria-hidden="true">
        <span />
      </div>
    </div>,
    document.body,
  );
}
