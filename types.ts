// Enum for active view
export enum AppView {
  JOURNEY_MAP = 'JOURNEY_MAP',
  INFO_ARCH = 'INFO_ARCH',
  DESIGN_SYSTEM = 'DESIGN_SYSTEM'
}

// --- User Journey Map Types ---
export interface JourneyStage {
  stageName: string;
  userGoal: string;
  actions: string[];
  painPoints: string[];
  emotionScore: number; // 1 to 5
  opportunities: string[];
}

export interface JourneyMapData {
  persona: string;
  scenario: string;
  stages: JourneyStage[];
}

// --- Information Architecture Types ---
export interface IANode {
  name: string;
  type: 'page' | 'category' | 'feature';
  children?: IANode[];
}

// --- Design System Types ---
export interface ColorPalette {
  name: string;
  hex: string;
  usage: string;
}

export interface TypographyRule {
  role: string; // e.g., H1, Body
  size: string;
  weight: string;
  usage: string;
}

export interface DesignSystemData {
  themeName: string;
  primaryColors: ColorPalette[];
  secondaryColors: ColorPalette[];
  neutralColors: ColorPalette[];
  typography: TypographyRule[];
}
