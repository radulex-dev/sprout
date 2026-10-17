// Constants
import { PASSWORD_MIN_LENGTH } from './constants';

export const hasPasswordMinLength = (password: string): boolean => {
    return password.length >= PASSWORD_MIN_LENGTH;
};

export const hasPasswordLetterAndNumber = (password: string): boolean => {
    return /[a-z]/i.test(password) && /\d/.test(password);
};

export const hasPasswordSpecialCharacter = (password: string): boolean => {
    return /[^a-z\d]/i.test(password);
};

export const isPasswordCompliant = (password: string): boolean => {
    return hasPasswordMinLength(password) && hasPasswordLetterAndNumber(password) && hasPasswordSpecialCharacter(password);
};
