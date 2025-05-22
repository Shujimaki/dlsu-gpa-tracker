import { logEvent } from 'firebase/analytics';
import { analytics } from './firebase';

// Custom event logging functions
export const logPageView = (pageName: string) => {
  logEvent(analytics, 'page_view', {
    page_title: pageName,
    page_location: window.location.href,
  });
};

export const logGpaCalculation = (gpa: number, term: number) => {
  logEvent(analytics, 'gpa_calculation', {
    gpa,
    term,
  });
};

export const logDeansListEligibility = (isEligible: boolean, isFirstHonors: boolean) => {
  logEvent(analytics, 'deans_list_check', {
    is_eligible: isEligible,
    is_first_honors: isFirstHonors,
  });
};

export const logUserAction = (action: string, details?: Record<string, unknown>) => {
  logEvent(analytics, 'user_action', {
    action,
    ...details,
  });
};

export default analytics; 