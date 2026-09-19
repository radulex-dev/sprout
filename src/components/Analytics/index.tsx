'use client';

import React from 'react';
import { Analytics as VercelAnalytics } from '@vercel/analytics/next';

// Helpers
import { beforeSend } from './helpers';

const Analytics: React.FunctionComponent = () => {
    return <VercelAnalytics beforeSend={beforeSend} />;
};

export default Analytics;
