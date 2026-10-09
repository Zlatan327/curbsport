'use client';

import { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone } from 'lucide-react';

export function PwaInstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone display mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) return;

    // Check if user dismissed prompt recently
    const dismissedUntil = localStorage.getItem('inside-life-pwa-dismissed');
    if (dismissedUntil && Number(dismissedUntil) > Date.now()) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    if (isIosDevice) {
      // Show banner on iOS after a brief delay
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Android / Desktop Chromium beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowBanner(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    setShowIosGuide(false);
    // Dismiss for 5 days
    localStorage.setItem(
      'inside-life-pwa-dismissed',
      String(Date.now() + 5 * 24 * 60 * 60 * 1000)
    );
  };

  if (!showBanner) return null;

  return (
    <>
      <div className="pwa-banner" role="region" aria-label="Install App">
        <div className="pwa-banner__icon">
          <Smartphone size={18} />
        </div>
        <div className="pwa-banner__content">
          <strong>INSTALL INSIDE LIFE</strong>
          <span>Instant pitch radar & 1-tap sets from your home screen</span>
        </div>
        <div className="pwa-banner__actions">
          <button
            type="button"
            className="pwa-install-btn"
            onClick={handleInstallClick}
          >
            <Download size={13} />
            <span>INSTALL</span>
          </button>
          <button
            type="button"
            className="pwa-dismiss-btn"
            onClick={handleDismiss}
            aria-label="Dismiss install prompt"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {showIosGuide && (
        <div className="ios-pwa-modal-backdrop" onClick={() => setShowIosGuide(false)}>
          <div className="ios-pwa-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ios-pwa-modal__header">
              <h3>INSTALL ON IPHONE</h3>
              <button
                type="button"
                className="match-modal-close"
                onClick={() => setShowIosGuide(false)}
              >
                <X size={16} />
              </button>
            </div>
            <p className="ios-pwa-modal__desc">
              Add Inside Life to your Home Screen for zero-delay ball alerts:
            </p>
            <ol className="ios-pwa-steps">
              <li>
                <span>1.</span> Tap the <strong>Share</strong> button <Share size={14} className="inline-icon" /> at the bottom of Safari.
              </li>
              <li>
                <span>2.</span> Scroll down and tap <strong>Add to Home Screen</strong> <PlusSquare size={14} className="inline-icon" />.
              </li>
              <li>
                <span>3.</span> Tap <strong>Add</strong> in the top right corner.
              </li>
            </ol>
            <button
              type="button"
              className="button button--green button--full"
              onClick={() => setShowIosGuide(false)}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </>
  );
}
