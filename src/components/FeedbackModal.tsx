import React, { useState } from 'react';
import { submitFeedback } from '../services/analytics';

interface FeedbackModalProps {
  show: boolean;
  onClose: () => void;
  triggerPoint: string;
  feedbackType?: 'nps' | 'satisfaction' | 'feature_request' | 'bug_report';
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  show,
  onClose,
  triggerPoint,
  feedbackType = 'satisfaction',
}) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await submitFeedback({
        feedbackType,
        triggerPoint,
        rating: feedbackType === 'nps' || feedbackType === 'satisfaction' ? rating : undefined,
        comment,
        metadata: {
          page: window.location.pathname,
          timestamp: new Date().toISOString(),
        },
      });

      setSubmitted(true);
      setTimeout(() => {
        onClose();
        // Reset state after close
        setTimeout(() => {
          setSubmitted(false);
          setRating(0);
          setComment('');
        }, 300);
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (!show) return null;

  const getTitle = () => {
    switch (feedbackType) {
      case 'nps':
        return 'How likely are you to recommend FleetFi?';
      case 'satisfaction':
        return 'How satisfied are you with this experience?';
      case 'feature_request':
        return 'Share your feature ideas';
      case 'bug_report':
        return 'Report an issue';
      default:
        return 'Your Feedback';
    }
  };

  const getRatingLabel = () => {
    if (feedbackType === 'nps') {
      if (rating <= 6) return 'Not Likely';
      if (rating <= 8) return 'Neutral';
      return 'Very Likely';
    }
    if (rating <= 2) return 'Poor';
    if (rating <= 3) return 'Fair';
    if (rating <= 4) return 'Good';
    return 'Excellent';
  };

  return (
    <>
      <div
        className="modal fade show d-block"
        style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
      >
        <div
          className="modal-dialog modal-dialog-centered"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="modal-content">
            <div className="modal-header border-0">
              <h5 className="modal-title fw-bold">{getTitle()}</h5>
              <button
                type="button"
                className="btn-close"
                onClick={onClose}
                disabled={submitting}
              ></button>
            </div>

            {submitted ? (
              <div className="modal-body text-center py-5">
                <i className="bi bi-check-circle-fill text-success" style={{ fontSize: '64px' }}></i>
                <h4 className="mt-3 mb-2">Thank you!</h4>
                <p className="text-muted">Your feedback helps us improve FleetFi.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {(feedbackType === 'nps' || feedbackType === 'satisfaction') && (
                    <div className="mb-4">
                      <label className="form-label fw-semibold">
                        {feedbackType === 'nps' ? 'Rating (0-10)' : 'Rating (1-5)'}
                      </label>
                      <div className="d-flex gap-2 justify-content-center flex-wrap">
                        {Array.from(
                          { length: feedbackType === 'nps' ? 11 : 5 },
                          (_, i) => i + (feedbackType === 'nps' ? 0 : 1)
                        ).map((num) => (
                          <button
                            key={num}
                            type="button"
                            className={`btn ${
                              rating === num
                                ? 'btn-primary'
                                : 'btn-outline-secondary'
                            }`}
                            style={{ width: '45px' }}
                            onClick={() => setRating(num)}
                          >
                            {num}
                          </button>
                        ))}
                      </div>
                      {rating > 0 && (
                        <div className="text-center mt-2">
                          <small className="text-muted">{getRatingLabel()}</small>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      {feedbackType === 'feature_request'
                        ? 'What feature would you like to see?'
                        : feedbackType === 'bug_report'
                        ? 'Describe the issue'
                        : 'Additional comments (optional)'}
                    </label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder={
                        feedbackType === 'feature_request'
                          ? 'Tell us about the feature...'
                          : feedbackType === 'bug_report'
                          ? 'What happened? What did you expect?'
                          : 'Share your thoughts...'
                      }
                      required={feedbackType === 'feature_request' || feedbackType === 'bug_report'}
                    />
                  </div>
                </div>

                <div className="modal-footer border-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      submitting ||
                      ((feedbackType === 'nps' || feedbackType === 'satisfaction') && rating === 0)
                    }
                  >
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        Submitting...
                      </>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
