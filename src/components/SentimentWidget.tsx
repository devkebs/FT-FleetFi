import React, { useState } from 'react';
import { trackSentiment } from '../services/analytics';

interface SentimentWidgetProps {
  context: string;
  position?: 'bottom-right' | 'bottom-left';
}

export const SentimentWidget: React.FC<SentimentWidgetProps> = ({
  context,
  position = 'bottom-right',
}) => {
  const [expanded, setExpanded] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSentiment = async (
    type: 'positive' | 'neutral' | 'negative' | 'frustrated'
  ) => {
    await trackSentiment(type, context);
    setSubmitted(true);
    setTimeout(() => {
      setExpanded(false);
      setTimeout(() => setSubmitted(false), 300);
    }, 1500);
  };

  const positionStyles = {
    'bottom-right': { bottom: '20px', right: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        ...positionStyles[position],
        zIndex: 1050,
      }}
    >
      {!expanded ? (
        <button
          className="btn btn-primary rounded-circle shadow-lg"
          style={{ width: '56px', height: '56px' }}
          onClick={() => setExpanded(true)}
          title="How are you feeling?"
        >
          <i className="bi bi-emoji-smile" style={{ fontSize: '24px' }}></i>
        </button>
      ) : (
        <div className="card shadow-lg" style={{ width: '280px' }}>
          <div className="card-body">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h6 className="mb-0 fw-bold">How's your experience?</h6>
              <button
                className="btn-close btn-sm"
                onClick={() => setExpanded(false)}
              ></button>
            </div>

            {submitted ? (
              <div className="text-center py-3">
                <i
                  className="bi bi-check-circle-fill text-success"
                  style={{ fontSize: '48px' }}
                ></i>
                <p className="mt-2 mb-0 small text-muted">Thanks for sharing!</p>
              </div>
            ) : (
              <div className="d-flex justify-content-around">
                <button
                  className="btn btn-outline-success border-0"
                  onClick={() => handleSentiment('positive')}
                  title="Great!"
                >
                  <i className="bi bi-emoji-laughing" style={{ fontSize: '32px' }}></i>
                  <div className="small mt-1">Great</div>
                </button>
                <button
                  className="btn btn-outline-primary border-0"
                  onClick={() => handleSentiment('neutral')}
                  title="Okay"
                >
                  <i className="bi bi-emoji-neutral" style={{ fontSize: '32px' }}></i>
                  <div className="small mt-1">Okay</div>
                </button>
                <button
                  className="btn btn-outline-warning border-0"
                  onClick={() => handleSentiment('negative')}
                  title="Not great"
                >
                  <i className="bi bi-emoji-frown" style={{ fontSize: '32px' }}></i>
                  <div className="small mt-1">Meh</div>
                </button>
                <button
                  className="btn btn-outline-danger border-0"
                  onClick={() => handleSentiment('frustrated')}
                  title="Frustrated"
                >
                  <i className="bi bi-emoji-angry" style={{ fontSize: '32px' }}></i>
                  <div className="small mt-1">Bad</div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
