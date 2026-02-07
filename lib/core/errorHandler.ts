/**
 * Global Error Handler
 * 모든 에러를 표준화된 AppError 객체로 변환하여 처리합니다.
 */

export class AppError extends Error {
    public readonly code: string;
    public readonly statusCode: number;
    public readonly isOperational: boolean; // 예측 가능한 에러인지 여부

    constructor(message: string, code: string, statusCode = 500, isOperational = true) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        Error.captureStackTrace(this, this.constructor);
    }
}

/**
 * 임의의 에러를 AppError로 변환합니다.
 */
export function handleError(error: unknown): AppError {
    if (error instanceof AppError) {
        return error;
    }

    if (error instanceof Error) {
        return new AppError(error.message, 'UNKNOWN_ERROR', 500, false);
    }

    return new AppError('An unexpected error occurred', 'UNKNOWN_ERROR', 500, false);
}

/**
 * 에러 발생 시 사용자 친화적인 메시지를 반환합니다.
 */
export function getErrorMessage(error: unknown): string {
    const appError = handleError(error);
    if (appError.isOperational) {
        return appError.message;
    }
    console.error('Critical Error:', error); // Log original error
    return '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}
