/**
 * Global Error Handler
 * Centralized errorhandling with retry logic, user-friendly messages, and logging
 */

import { toast } from 'sonner';

export class AppError extends Error {
    constructor(message, type = 'error', statusCode = null, originalError = null) {
        super(message);
        this.type = type; // 'network', 'auth', 'validation', 'server', 'unknown'
        this.statusCode = statusCode;
        this.originalError = originalError;
        this.timestamp = new Date();
    }
}

/**
 * Categorize error based on response/error object
 */
export const categorizeError = (error) => {
    if (!error.response) {
        // Network error
        return new AppError(
            'Tidak dapat terhubung ke server. Periksa koneksi internet Anda.',
            'network',
            null,
            error
        );
    }

    const status = error.response?.status;
    const message = error.response?.data?.detail || error.message;

    if (status === 401 || status === 403) {
        return new AppError(
            'Sesi Anda telah berakhir. Silakan login kembali.',
            'auth',
            status,
            error
        );
    }

    if (status === 400 || status === 422) {
        return new AppError(
            message || 'Data tidak valid. Periksa kembali inputan Anda.',
            'validation',
            status,
            error
        );
    }

    if (status === 404) {
        return new AppError(
            'Data tidak ditemukan.',
            'server',
            status,
            error
        );
    }

    if (status >= 500) {
        return new AppError(
            'Terjadi kesalahan pada server. Tim kami akan segera memperbaikinya.',
            'server',
            status,
            error
        );
    }

    return new AppError(
        message || 'Terjadi kesalahan. Silakan coba lagi.',
        'unknown',
        status,
        error
    );
};

/**
 * Handle error with user notification
 */
export const handleError = (error, options = {}) => {
    const {
        silent = false,
        customMessage = null,
        onRetry = null,
        showRetryButton = false
    } = options;

    const appError = error instanceof AppError ? error : categorizeError(error);

    // Log error (in production, send to logging service)
    console.error('[Error Handler]', {
        type: appError.type,
        message: appError.message,
        statusCode: appError.statusCode,
        timestamp: appError.timestamp,
        stack: appError.originalError?.stack
    });

    // Show toast notification
    if (!silent) {
        const displayMessage = customMessage || appError.message;

        if (appError.type === 'auth') {
            toast.error(displayMessage, {
                duration: 5000,
                action: {
                    label: 'Login',
                    onClick: () => {
                        window.location.href = '/login';
                    }
                }
            });
        } else if (showRetryButton && onRetry) {
            toast.error(displayMessage, {
                duration: 5000,
                action: {
                    label: 'Coba Lagi',
                    onClick: onRetry
                }
            });
        } else {
            toast.error(displayMessage);
        }
    }

    return appError;
};

/**
 * Retry wrapper for async operations
 */
export const withRetry = async (fn, options = {}) => {
    const {
        maxRetries = 3,
        delay = 1000,
        backoff = true,
        onRetry = null
    } = options;

    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            const appError = categorizeError(error);

            // Don't retry on auth or validation errors
            if (appError.type === 'auth' || appError.type === 'validation') {
                throw appError;
            }

            if (attempt < maxRetries) {
                const waitTime = backoff ? delay * attempt : delay;

                if (onRetry) {
                    onRetry(attempt, maxRetries, waitTime);
                }

                console.log(`[Retry] Attempt ${attempt}/${maxRetries}, waiting ${waitTime}ms...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }
        }
    }

    throw categorizeError(lastError);
};

/**
 * API call wrapper with automatic error handling and retry
 */
export const safeApiCall = async (apiFunction, options = {}) => {
    const {
        silent = false,
        customErrorMessage = null,
        enableRetry = false,
        retryOptions = {},
        onSuccess = null,
        onError = null
    } = options;

    try {
        const result = enableRetry
            ? await withRetry(apiFunction, retryOptions)
            : await apiFunction();

        if (onSuccess) {
            onSuccess(result);
        }

        return { success: true, data: result };
    } catch (error) {
        const appError = handleError(error, { silent, customMessage: customErrorMessage });

        if (onError) {
            onError(appError);
        }

        return { success: false, error: appError };
    }
};

/**
 * Global error boundary error logger
 */
export const logComponentError = (error, errorInfo) => {
    console.error('[Component Error]', {
        error: error.toString(),
        componentStack: errorInfo.componentStack,
        timestamp: new Date()
    });

    // In production, send to error tracking service (e.g., Sentry)
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
};

export default {
    AppError,
    categorizeError,
    handleError,
    withRetry,
    safeApiCall,
    logComponentError
};
