'use client';

import Script from 'next/script';
import React, { useEffect } from 'react';

// Constants
import { UMAMI_BEFORE_SEND_GLOBAL, UMAMI_SCRIPT_URL, UMAMI_WEBSITE_ID } from './constants';

// Helpers
import { beforeSend } from './helpers';

const Analytics: React.FunctionComponent = () => {
    useEffect(() => {
        // Umami's data-before-send hook is resolved by name off `window`, which is why
        // it is a global rather than a closure. If it is ever missing when the tracker
        // sends, pageviews still send — just UNNORMALISED, with the raw /plants/<uuid>
        // path; a silent failure worth knowing about.
        window[UMAMI_BEFORE_SEND_GLOBAL] = beforeSend;
    }, []);

    if (!UMAMI_SCRIPT_URL || !UMAMI_WEBSITE_ID) {
        return;
    }

    return <Script src={UMAMI_SCRIPT_URL} data-website-id={UMAMI_WEBSITE_ID} data-before-send={UMAMI_BEFORE_SEND_GLOBAL} strategy="afterInteractive" />;
};

export default Analytics;
