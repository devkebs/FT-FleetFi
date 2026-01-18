import { apiClient } from './api';

// Generate a unique session ID
const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Get or create session ID
let sessionId = sessionStorage.getItem('analytics_session_id');
if (!sessionId) {
  sessionId = generateSessionId();
  sessionStorage.setItem('analytics_session_id', sessionId);
}

// Detect device information
const getDeviceInfo = () => {
  const ua = navigator.userAgent;
  let deviceType = 'desktop';
  
  if (/mobile/i.test(ua)) deviceType = 'mobile';
  else if (/tablet|ipad/i.test(ua)) deviceType = 'tablet';
  
  let browser = 'Unknown';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';
  
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'MacOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';
  
  return { deviceType, browser, os };
};

// Track page views
let pageViewCount = 0;
let interactionCount = 0;
const _sessionStartTime = Date.now();
void _sessionStartTime; // Session start time tracked for analytics

/**
 * Analytics Service
 */
class AnalyticsService {
  private sessionId: string;
  private isTracking: boolean = false;

  constructor() {
    this.sessionId = sessionId!;
    // Initialize session asynchronously to avoid blocking app startup
    this.initSession().catch(err => console.warn('Analytics init failed:', err));
    this.setupPageTracking();
    this.setupInteractionTracking();
    this.setupBeforeUnload();
  }

  /**
   * Initialize user session
   */
  private async initSession() {
    try {
      const deviceInfo = getDeviceInfo();
      await apiClient.post('/analytics/session/start', {
        session_id: this.sessionId,
        ...deviceInfo,
      });
      this.isTracking = true;
    } catch (error) {
      console.warn('Analytics session init failed:', error);
    }
  }

  /**
   * End user session
   */
  async endSession() {
    if (!this.isTracking) return;
    
    try {
      await apiClient.post('/analytics/session/end', {
        session_id: this.sessionId,
        page_views: pageViewCount,
        interactions: interactionCount,
      });
    } catch (error) {
      console.warn('Analytics session end failed:', error);
    }
  }

  /**
   * Track a custom event
   */
  async trackEvent(eventName: string, eventData?: Record<string, any>, category?: string) {
    if (!this.isTracking) return;

    try {
      await apiClient.post('/analytics/event', {
        session_id: this.sessionId,
        event_type: 'user_action',
        event_category: category || 'engagement',
        event_name: eventName,
        event_data: eventData,
        page_url: window.location.href,
        referrer: document.referrer,
      });
    } catch (error) {
      console.warn('Analytics event tracking failed:', error);
    }
  }

  /**
   * Track page view
   */
  trackPageView(pageName: string) {
    pageViewCount++;
    this.trackEvent('page_view', { page: pageName }, 'navigation');
  }

  /**
   * Track user interaction
   */
  trackInteraction(action: string, target?: string) {
    interactionCount++;
    this.trackEvent('interaction', { action, target }, 'engagement');
  }

  /**
   * Submit user feedback
   */
  async submitFeedback(data: {
    feedbackType: 'nps' | 'satisfaction' | 'feature_request' | 'bug_report';
    triggerPoint: string;
    rating?: number;
    comment?: string;
    metadata?: Record<string, any>;
  }) {
    try {
      const response = await apiClient.post<any>('/analytics/feedback', {
        session_id: this.sessionId,
        feedback_type: data.feedbackType,
        trigger_point: data.triggerPoint,
        rating: data.rating,
        comment: data.comment,
        metadata: data.metadata,
      });
      return response.data;
    } catch (error) {
      console.error('Feedback submission failed:', error);
      throw error;
    }
  }

  /**
   * Track sentiment
   */
  async trackSentiment(
    sentimentType: 'positive' | 'neutral' | 'negative' | 'frustrated',
    context: string,
    reason?: string,
    indicators?: Record<string, any>
  ) {
    try {
      await apiClient.post('/analytics/sentiment', {
        session_id: this.sessionId,
        sentiment_type: sentimentType,
        context,
        reason,
        indicators,
      });
    } catch (error) {
      console.warn('Sentiment tracking failed:', error);
    }
  }

  /**
   * Track milestone achievement
   */
  trackMilestone(milestoneName: string, data?: Record<string, any>) {
    this.trackEvent(milestoneName, data, 'milestone');
  }

  /**
   * Setup automatic page tracking
   */
  private setupPageTracking() {
    // Track initial page load
    this.trackPageView(window.location.pathname);

    // Track SPA navigation (for React Router, etc.)
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = (...args) => {
      originalPushState.apply(history, args);
      this.trackPageView(window.location.pathname);
    };

    history.replaceState = (...args) => {
      originalReplaceState.apply(history, args);
      this.trackPageView(window.location.pathname);
    };

    // Track popstate (back/forward)
    window.addEventListener('popstate', () => {
      this.trackPageView(window.location.pathname);
    });
  }

  /**
   * Setup automatic interaction tracking
   */
  private setupInteractionTracking() {
    // Track clicks
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.tagName === 'A') {
        this.trackInteraction('click', target.textContent || target.id || 'unknown');
      }
    });

    // Track form submissions
    document.addEventListener('submit', (e) => {
      const form = e.target as HTMLFormElement;
      this.trackInteraction('form_submit', form.id || form.action);
    });

    // Track rage clicks (user frustration indicator)
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    document.addEventListener('click', () => {
      clickCount++;
      clearTimeout(clickTimer);
      
      clickTimer = setTimeout(() => {
        if (clickCount >= 5) {
          this.trackSentiment('frustrated', 'rage_clicks', 'Multiple rapid clicks detected', {
            click_count: clickCount,
          });
        }
        clickCount = 0;
      }, 1000);
    });
  }

  /**
   * Setup session end on page unload
   */
  private setupBeforeUnload() {
    window.addEventListener('beforeunload', () => {
      // Use sendBeacon for reliable tracking on page unload
      const data = {
        session_id: this.sessionId,
        page_views: pageViewCount,
        interactions: interactionCount,
      };
      
      const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
      navigator.sendBeacon(
        `${API_BASE_URL}/api/analytics/session/end`,
        JSON.stringify(data)
      );
    });
  }

  /**
   * Track conversion events (key business events)
   */
  trackConversion(conversionType: string, value?: number, metadata?: Record<string, any>) {
    this.trackEvent(`conversion_${conversionType}`, {
      value,
      ...metadata,
    }, 'conversion');
  }

  /**
   * Track errors
   */
  trackError(errorType: string, errorMessage: string, errorStack?: string) {
    this.trackEvent('error_occurred', {
      error_type: errorType,
      message: errorMessage,
      stack: errorStack,
    }, 'error');
  }
}

// Create singleton instance
let analytics: AnalyticsService;
try {
  analytics = new AnalyticsService();
  
  // Setup global error tracking
  window.addEventListener('error', (event) => {
    analytics.trackError('javascript_error', event.message, event.error?.stack);
  });

  window.addEventListener('unhandledrejection', (event) => {
    analytics.trackError('promise_rejection', event.reason?.message || 'Unhandled promise rejection');
  });
} catch (error) {
  console.warn('Analytics service initialization failed:', error);
  // Create a dummy analytics object to prevent app crashes
  analytics = {
    trackEvent: () => Promise.resolve(),
    trackPageView: () => {},
    trackInteraction: () => {},
    trackMilestone: () => {},
    trackConversion: () => {},
    submitFeedback: () => Promise.resolve(),
    trackSentiment: () => Promise.resolve(),
    endSession: () => Promise.resolve(),
    trackError: () => {},
  } as any;
}

export default analytics;

// Export convenience methods
export const trackEvent = (name: string, data?: Record<string, any>, category?: string) => 
  analytics.trackEvent(name, data, category);

export const trackPageView = (pageName: string) => 
  analytics.trackPageView(pageName);

export const trackInteraction = (action: string, target?: string) => 
  analytics.trackInteraction(action, target);

export const submitFeedback = (data: Parameters<typeof analytics.submitFeedback>[0]) => 
  analytics.submitFeedback(data);

export const trackSentiment = (
  type: 'positive' | 'neutral' | 'negative' | 'frustrated',
  context: string,
  reason?: string
) => analytics.trackSentiment(type, context, reason);

export const trackMilestone = (name: string, data?: Record<string, any>) => 
  analytics.trackMilestone(name, data);

export const trackConversion = (type: string, value?: number, metadata?: Record<string, any>) => 
  analytics.trackConversion(type, value, metadata);
