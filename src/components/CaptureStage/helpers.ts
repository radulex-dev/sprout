export const playVideo = async (video: HTMLVideoElement): Promise<boolean> => {
    try {
        await video.play();

        return true;
    } catch {
        return false;
    }
};
