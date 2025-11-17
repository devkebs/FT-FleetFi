import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { isUserOnboarded } from '../services/trovotechService';

interface TrovotechOnboardingWidgetProps {
  onNavigate?: () => void;
}

export const TrovotechOnboardingWidget: React.FC<TrovotechOnboardingWidgetProps> = ({ 
  onNavigate 
}) => {
  const [isOnboarded, setIsOnboarded] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const onboarded = await isUserOnboarded();
      setIsOnboarded(onboarded);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      setIsOnboarded(false);
    } finally {
      setLoading(false);
    }
  };

  const handleNavigate = () => {
    if (onNavigate) {
      onNavigate();
    } else {
      window.dispatchEvent(new CustomEvent('app:navigate', { 
        detail: { page: 'TrovotechOnboarding' } 
      }));
    }
  };

  if (loading) {
    return (
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <div className="spinner-border spinner-border-sm text-primary me-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <span className="text-muted">Checking wallet status...</span>
          </div>
        </div>
      </div>
    );
  }

  if (isOnboarded) {
    return (
      <div className="card mb-4 border-success">
        <div className="card-body">
          <div className="d-flex align-items-center">
            <CheckCircle className="text-success me-3" size={24} />
            <div className="flex-grow-1">
              <h6 className="mb-1">Blockchain Wallet Active</h6>
              <small className="text-muted">Your wallet is ready for investments</small>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card mb-4 border-warning bg-warning bg-opacity-10">
      <div className="card-body">
        <div className="d-flex align-items-start">
          <AlertCircle className="text-warning me-3 mt-1" size={24} />
          <div className="flex-grow-1">
            <h6 className="mb-2">Complete Wallet Setup</h6>
            <p className="text-muted small mb-3">
              Create your blockchain wallet to start investing in tokenized assets. 
              This secure wallet enables you to receive returns and manage your investments.
            </p>
            <button 
              className="btn btn-warning btn-sm"
              onClick={handleNavigate}
            >
              Set Up Wallet <ArrowRight size={16} className="ms-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrovotechOnboardingWidget;
