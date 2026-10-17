// Constants
import { PASSWORD_LETTER_NUMBER_ERROR, PASSWORD_MIN_LENGTH_ERROR, PASSWORD_SPECIAL_CHARACTER_ERROR } from './constants';

// Helpers
import { hasPasswordLetterAndNumber, hasPasswordMinLength, hasPasswordSpecialCharacter } from '@/helpers/password';

export const getPasswordPolicyErrors = (password: string): string[] => {
    const errors: string[] = [];

    if (!hasPasswordMinLength(password)) {
        errors.push(PASSWORD_MIN_LENGTH_ERROR);
    }

    if (!hasPasswordLetterAndNumber(password)) {
        errors.push(PASSWORD_LETTER_NUMBER_ERROR);
    }

    if (!hasPasswordSpecialCharacter(password)) {
        errors.push(PASSWORD_SPECIAL_CHARACTER_ERROR);
    }

    return errors;
};
