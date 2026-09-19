import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest';
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

const renderStage = () => {
    return render(<CaptureStage isIdentifying={false} onPhoto={vi.fn()} onError={vi.fn()} onReset={vi.fn()} onIdentify={vi.fn()} />);
};

const openCamera = async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', {
        name: 'Open camera'
    }));
};

describe('CaptureStage', () => {
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

    afterEach(() => {
        vi.restoreAllMocks();
        getUserMedia.mockReset();
    });

    it('attaches the stream to the mounted video without waiting for another frame', async () => {
        const { stream } = createStream();
        getUserMedia.mockResolvedValue(stream);

        renderStage();
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

        renderStage();
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

        render(<CaptureStage isIdentifying={false} onPhoto={vi.fn()} onError={handleError} onReset={vi.fn()} onIdentify={vi.fn()} />);
        await openCamera();

        await waitFor(() => {
            expect(handleError).toHaveBeenCalledWith('Camera preview could not start — try again, or upload a photo instead.');
        });
    });

    it('reports an error and keeps the idle actions when the camera is unavailable', async () => {
        const handleError = vi.fn();
        getUserMedia.mockRejectedValue(new Error('NotAllowedError'));

        render(<CaptureStage isIdentifying={false} onPhoto={vi.fn()} onError={handleError} onReset={vi.fn()} onIdentify={vi.fn()} />);
        await openCamera();

        expect(handleError).toHaveBeenCalledWith('Camera unavailable — you can upload a photo instead.');
        expect(screen.getByRole('button', {
            name: 'Open camera'
        })).toBeInTheDocument();
    });
});
