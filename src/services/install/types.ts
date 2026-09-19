export enum InstallPlatform {
    Ios = 'ios',
    Chromium = 'chromium',
    Other = 'other'
}

export interface InstallNavigator extends Navigator {
    standalone?: boolean;
}
