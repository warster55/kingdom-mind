export interface User {
  id: number;
  name: string | null;
  email: string;
  role: string;
  currentDomain: string;
  onboardingStage: number;
  hasCompletedOnboarding: boolean;
  preferences: Record<string, any> | null;
  timezone: string;
  resonanceIdentity: number;
  resonancePurpose: number;
  resonanceMindset: number;
  resonanceRelationships: number;
  resonanceVision: number;
  resonanceAction: number;
  resonanceLegacy: number;
  createdAt: string; // Serialized date
  updatedAt: string; // Serialized date
}

export interface Insight {
  id: number;
  userId: number;
  domain: string;
  content: string;
  importance: number;
  createdAt: string;
}

export interface Habit {
  id: number;
  userId: number;
  domain: string;
  title: string;
  description: string | null;
  frequency: string;
  streak: number;
  isActive: boolean;
  createdAt: string;
}
