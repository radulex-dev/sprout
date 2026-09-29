export const subscribeToPush = (pushManager: PushManager, applicationServerKey: Uint8Array<ArrayBuffer>): Promise<PushSubscription> => {
    return pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
    });
};
