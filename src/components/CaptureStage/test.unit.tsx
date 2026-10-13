import type React from 'react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Components
import CaptureStage from './index';

const createStream = () => {
    const track = {
        stop: vi.fn()
    };
    const stream = {
        getTracks: () => {
            return [track];
        }
    } as unknown as MediaStream;

    return {
        stream,
        track
    };
};

const openCamera = async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', {
        name: 'Open camera'
    }));
};

const props: React.ComponentProps<typeof CaptureStage> = {
    isIdentifying: false,
    onPhoto: vi.fn(),
    onError: vi.fn(),
    onReset: vi.fn(),
    onIdentify: vi.fn()
};

describe('<CaptureStage />', () => {
    const getUserMedia = vi.fn();
    let playSpy: MockInstance;

    beforeEach(() => {
        Object.defineProperty(navigator, 'mediaDevices', {
            configurable: true,
            value: {
                getUserMedia
            }
        });
        playSpy = vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);
    });

    it('attaches the stream to the mounted video without waiting for another frame', async () => {
        const { stream } = createStream();
        getUserMedia.mockResolvedValue(stream);

        render(<CaptureStage {...props} />);
        await openCamera();

        const video = screen.getByLabelText<HTMLVideoElement>('Camera preview');

        expect(video.srcObject).toBe(stream);
        expect(video.autoplay).toBe(true);
        expect(video.muted).toBe(true);
        expect(playSpy).toHaveBeenCalled();
    });

    it('stops the camera tracks when the capture is cancelled', async () => {
        const { stream, track } = createStream();
        getUserMedia.mockResolvedValue(stream);

        render(<CaptureStage {...props} />);
        await openCamera();

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', {
            name: 'Cancel'
        }));

        expect(track.stop).toHaveBeenCalled();
    });

    it('reports a preview that never starts instead of leaving the screen black', async () => {
        const handleError = vi.fn();
        const { stream } = createStream();
        getUserMedia.mockResolvedValue(stream);
        playSpy.mockRejectedValue(new Error('NotAllowedError'));

        render(<CaptureStage {...props} onError={handleError} />);
        await openCamera();

        await waitFor(() => {
            expect(handleError).toHaveBeenCalledWith('Camera preview could not start — try again, or upload a photo instead.');
        });
    });

    it('reports an error and keeps the idle actions when the camera is unavailable', async () => {
        const handleError = vi.fn();
        getUserMedia.mockRejectedValue(new Error('NotAllowedError'));

        render(<CaptureStage {...props} onError={handleError} />);
        await openCamera();

        expect(handleError).toHaveBeenCalledWith('Camera unavailable — you can upload a photo instead.');
        expect(screen.getByRole('button', {
            name: 'Open camera'
        })).toBeInTheDocument();
    });

    it('hands the captured frame to the parent as a JPEG blob', async () => {
        const handlePhoto = vi.fn();
        const drawImage = vi.fn();
        const blob = new Blob(['leaf'], {
            type: 'image/jpeg'
        });
        const { stream } = createStream();

        getUserMedia.mockResolvedValue(stream);
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage
        } as unknown as CanvasRenderingContext2D);
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            callback(blob);
        });

        render(<CaptureStage {...props} onPhoto={handlePhoto} />);
        await openCamera();

        const video = screen.getByLabelText<HTMLVideoElement>('Camera preview');

        Object.defineProperties(video, {
            videoHeight: {
                configurable: true,
                value: 480
            },
            videoWidth: {
                configurable: true,
                value: 640
            }
        });

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', {
            name: 'Capture'
        }));

        expect(drawImage).toHaveBeenCalledWith(video, 0, 0);
        expect(handlePhoto).toHaveBeenCalledWith(blob);
    });

    it('ignores a capture while the video has no frame yet', async () => {
        const handlePhoto = vi.fn();
        const getContext = vi.spyOn(HTMLCanvasElement.prototype, 'getContext');
        const { stream } = createStream();

        getUserMedia.mockResolvedValue(stream);

        render(<CaptureStage {...props} onPhoto={handlePhoto} />);
        await openCamera();

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', {
            name: 'Capture'
        }));

        expect(handlePhoto).not.toHaveBeenCalled();
        expect(getContext).not.toHaveBeenCalled();
    });

    it('ignores a capture when the canvas has no 2D context', async () => {
        const handlePhoto = vi.fn();
        const { stream } = createStream();

        getUserMedia.mockResolvedValue(stream);
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(undefined as unknown as CanvasRenderingContext2D);

        render(<CaptureStage {...props} onPhoto={handlePhoto} />);
        await openCamera();

        const video = screen.getByLabelText<HTMLVideoElement>('Camera preview');

        Object.defineProperties(video, {
            videoHeight: {
                configurable: true,
                value: 480
            },
            videoWidth: {
                configurable: true,
                value: 640
            }
        });

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', {
            name: 'Capture'
        }));

        expect(handlePhoto).not.toHaveBeenCalled();
    });

    it('ignores a capture the canvas cannot encode', async () => {
        const handlePhoto = vi.fn();
        const { stream } = createStream();

        getUserMedia.mockResolvedValue(stream);
        vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
            drawImage: vi.fn()
        } as unknown as CanvasRenderingContext2D);
        vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((callback) => {
            callback(undefined as unknown as Blob);
        });

        render(<CaptureStage {...props} onPhoto={handlePhoto} />);
        await openCamera();

        const video = screen.getByLabelText<HTMLVideoElement>('Camera preview');

        Object.defineProperties(video, {
            videoHeight: {
                configurable: true,
                value: 480
            },
            videoWidth: {
                configurable: true,
                value: 640
            }
        });

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', {
            name: 'Capture'
        }));

        expect(handlePhoto).not.toHaveBeenCalled();
    });

    it('hands an uploaded photo to the parent and stops the live camera', async () => {
        const handlePhoto = vi.fn();
        const handleError = vi.fn();
        const { stream, track } = createStream();

        getUserMedia.mockResolvedValue(stream);

        render(<CaptureStage {...props} onPhoto={handlePhoto} onError={handleError} />);
        await openCamera();

        const user = userEvent.setup();
        const file = new File(['leaf'], 'leaf.jpg', {
            type: 'image/jpeg'
        });
        const input = screen.getByLabelText<HTMLInputElement>('Upload a photo of your plant');

        handleError.mockClear();

        await user.upload(input, file);

        expect(handlePhoto).toHaveBeenCalledWith(file);
        expect(track.stop).toHaveBeenCalled();
        expect(handleError).toHaveBeenCalledWith('');
        expect(input.files).toHaveLength(0);
        expect(screen.getByRole('button', {
            name: 'Open camera'
        })).toBeInTheDocument();
    });

    it('opens the hidden file input from the upload button', async () => {
        const clickSpy = vi.spyOn(HTMLInputElement.prototype, 'click');

        render(<CaptureStage {...props} />);

        const user = userEvent.setup();

        await user.click(screen.getByRole('button', {
            name: 'Upload'
        }));

        expect(clickSpy).toHaveBeenCalled();
    });
});
