// Constants
import { VERIFY_REQUIRED_MESSAGE } from './constants';

export class UnverifiedEmailError extends Error {
    constructor() {
        super(VERIFY_REQUIRED_MESSAGE);
        this.name = 'UnverifiedEmailError';
    }
}

export const assertVerified = (isVerified: boolean): void => {
    if (!isVerified) {
        throw new UnverifiedEmailError();
    }
};
