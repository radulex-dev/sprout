export enum StepIllustration {
    Share = 'share',
    AddToHomeScreen = 'add-to-home-screen',
    WebAppSheet = 'web-app-sheet',
    HomeIcon = 'home-icon'
}

export interface InstallGuideStep {
    title: string;
    hint?: string;
    illustration?: StepIllustration;
}

export interface InstallGuideContent {
    title: string;
    description: string;
    note?: string;
    steps: InstallGuideStep[];
}
