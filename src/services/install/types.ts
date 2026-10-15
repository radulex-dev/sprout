export enum InstallPlatform {
    Ios = 'ios',
    Chromium = 'chromium',
    Other = 'other'
}

export enum InstallBrowser {
    Safari = 'safari',
    Chrome = 'chrome',
    Firefox = 'firefox',
    Other = 'other'
}

export interface InstallNavigator extends Navigator {
    standalone?: boolean;
}
