// Constants
import { ResetPasswordActionType, ResetPasswordStatus } from './constants';

// Types
import { type ResetPasswordAction, type ResetPasswordState } from './types';

export const initialState: ResetPasswordState = {
    confirmPassword: '',
    fieldError: '',
    isSubmitting: false,
    newPassword: '',
    status: ResetPasswordStatus.Idle
};

export const resetPasswordReducer = (state: ResetPasswordState, action: ResetPasswordAction): ResetPasswordState => {
    switch (action.type) {
        case ResetPasswordActionType.ChangeNew: {
            return {
                ...state,
                newPassword: action.value
            };
        }

        case ResetPasswordActionType.ChangeConfirm: {
            return {
                ...state,
                confirmPassword: action.value
            };
        }

        case ResetPasswordActionType.Validate: {
            return {
                ...state,
                fieldError: '',
                status: ResetPasswordStatus.Idle
            };
        }

        case ResetPasswordActionType.BeginSubmit: {
            return {
                ...state,
                isSubmitting: true
            };
        }

        case ResetPasswordActionType.FieldError: {
            return {
                ...state,
                fieldError: action.fieldError,
                isSubmitting: false,
                status: ResetPasswordStatus.Idle
            };
        }

        case ResetPasswordActionType.TokenError: {
            return {
                ...state,
                fieldError: '',
                isSubmitting: false,
                status: ResetPasswordStatus.TokenError
            };
        }

        case ResetPasswordActionType.GenericError: {
            return {
                ...state,
                fieldError: '',
                isSubmitting: false,
                status: ResetPasswordStatus.GenericError
            };
        }
        default: {
            return state;
        }
    }
};
