import React, { useState, useEffect } from 'react';

interface LiveStatusIndicatorProps {
  isLive?: boolean;
  lastUpdated?: Date | null;
  interval?: number; // polling interval in ms
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const LiveStatusIndicator: React.FC<LiveStatusIndicatorProps> = ({
  isLive = true,
  lastUpdated,
  interval,
  showLabel = true,
  size = 'sm'
}) => {
  const [timeAgo, setTimeAgo] = useState('');

  useEffect(() => {
    if (!lastUpdated) return;

    const updateTimeAgo = () => {
      const now = new Date();
      const diff = Math.floor((now.getTime() - lastUpdated.getTime()) / 1000);

      if (diff < 5) {
        setTimeAgo('Just now');
      } else if (diff < 60) {
        setTimeAgo(`${diff}s ago`);
      } else if (diff < 3600) {
        setTimeAgo(`${Math.floor(diff / 60)}m ago`);
      } else {
        setTimeAgo(lastUpdated.toLocaleTimeString());
      }
    };

    updateTimeAgo();
    const timer = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(timer);
  }, [lastUpdated]);

  const dotSizeClasses = {
    sm: 'spinner-grow-sm',
    md: '',
    lg: 'spinner-grow-lg'
  };

  const textSizeClasses = {
    sm: 'small',
    md: '',
    lg: 'fs-5'
  };

  return (
    <span className={`d-inline-flex align-items-center ${textSizeClasses[size]}`}>
      {isLive ? (
        <>
          <span
            className={`spinner-grow ${dotSizeClasses[size]} text-success me-1`}
            role="status"
            style={{ width: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px', height: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px' }}
          >
            <span className="visually-hidden">Live</span>
          </span>
          {showLabel && (
            <span className="text-success fw-semibold">
              Live
              {interval && (
                <span className="text-muted fw-normal ms-1">
                  (every {interval / 1000}s)
                </span>
              )}
            </span>
          )}
        </>
      ) : (
        <>
          <span
            className={`rounded-circle bg-secondary me-1`}
            style={{ width: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px', height: size === 'sm' ? '8px' : size === 'md' ? '12px' : '16px', display: 'inline-block' }}
          ></span>
          {showLabel && <span className="text-secondary">Paused</span>}
        </>
      )}
      {lastUpdated && (
        <span className="text-muted ms-2" title={lastUpdated.toLocaleString()}>
          {timeAgo}
        </span>
      )}
    </span>
  );
};

/**
 * Compact version for inline use
 */
export const LiveDot: React.FC<{ isLive?: boolean }> = ({ isLive = true }) => (
  <span
    className={`d-inline-block rounded-circle ${isLive ? 'bg-success' : 'bg-secondary'}`}
    style={{
      width: '8px',
      height: '8px',
      animation: isLive ? 'pulse 2s infinite' : 'none'
    }}
    title={isLive ? 'Live updates enabled' : 'Live updates paused'}
  >
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </span>
);

export default LiveStatusIndicator;
