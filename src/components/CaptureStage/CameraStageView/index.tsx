'use client';

import classNames from 'classnames';
import React from 'react';
import { Leaf } from 'lucide-react';

// Styles
import styles from './styles.module.css';

export interface Props extends React.ComponentProps<'div'> {
    photoUrl?: string;
    isStreaming: boolean;
    videoRef: React.RefObject<HTMLVideoElement | null>;
}

const CameraStageView: React.FunctionComponent<Props> = ({ photoUrl, isStreaming, videoRef, className, ...props }) => {
    const classes = classNames(styles.root, className);

    const renderPlantImage = () => {
        return <img src={photoUrl} alt="Preview of the photo you just captured" />;
    };

    const renderVideo = () => {
        return <video ref={videoRef} playsInline muted aria-label="Camera preview" />;
    };

    const renderPlaceholder = () => {
        return (
            <div className={styles.placeholder}>
                <Leaf className={styles.leaf} aria-hidden />
                Use the camera or upload a photo of the plant you want to identify.
            </div>
        );
    };

    const renderContent = () => {
        if (photoUrl) {
            return renderPlantImage();
        }

        return isStreaming ? renderVideo() : renderPlaceholder();
    };

    return (
        <div className={classes} {...props}>
            {renderContent()}
        </div>
    );
};

export default CameraStageView;
