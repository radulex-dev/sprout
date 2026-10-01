// Constants
import { type ResetPasswordActionType, type ResetPasswordStatus } from './constants';

interface ChangeNewAction {
    type: ResetPasswordActionType.ChangeNew;
    value: string;
}

interface ChangeConfirmAction {
    type: ResetPasswordActionType.ChangeConfirm;
    value: string;
}

interface ValidateAction {
    type: ResetPasswordActionType.Validate;
}

interface BeginSubmitAction {
    type: ResetPasswordActionType.BeginSubmit;
}

interface FieldErrorAction {
    type: ResetPasswordActionType.FieldError;
    fieldError: string;
}

interface TokenErrorAction {
    type: ResetPasswordActionType.TokenError;
}

interface GenericErrorAction {
    type: ResetPasswordActionType.GenericError;
}

export type ResetPasswordAction = ChangeNewAction | ChangeConfirmAction | ValidateAction | BeginSubmitAction | FieldErrorAction | TokenErrorAction | GenericErrorAction;

export interface ResetPasswordState {
    confirmPassword: string;
    fieldError: string;
    isSubmitting: boolean;
    newPassword: string;
    status: ResetPasswordStatus;
}
