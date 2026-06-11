function getAuthErrorCode(error: unknown): string {
    if (!error || typeof error !== 'object') return '';
    const code = (error as { code?: unknown }).code;
    return typeof code === 'string' ? code : '';
}

function getCurrentHost() {
    if (typeof window === 'undefined') return null;
    return window.location.hostname || null;
}

export function getReadableAuthMessage(error: unknown, options?: { host?: string | null }) {
    const code = getAuthErrorCode(error);
    const host = options?.host ?? getCurrentHost();

    switch (code) {
        case 'auth/unauthorized-domain':
            return host
                ? `Firebase Authentication Authorized domains에 현재 도메인 (${host}) 을 추가해야 합니다.`
                : 'Firebase Authentication Authorized domains에 현재 도메인을 추가해야 합니다.';
        case 'auth/popup-blocked':
            return '브라우저가 로그인 팝업을 차단했습니다. 팝업 차단을 해제하고 다시 시도하세요.';
        case 'auth/popup-closed-by-user':
            return '로그인 팝업이 닫혔습니다. 다시 시도하세요.';
        case 'auth/operation-not-allowed':
            return 'Firebase Authentication에서 Google 로그인이 활성화되지 않았습니다.';
        case 'auth/network-request-failed':
            return '네트워크 문제로 로그인에 실패했습니다.';
        default:
            return error instanceof Error ? error.message : '로그인에 실패했습니다.';
    }
}
