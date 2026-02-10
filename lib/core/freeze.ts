/**
 * System Freeze (Observation Mode)
 * 
 * 이 모듈은 프로젝트가 [MISSION ACCOMPLISHED] 상태에 도달했음을 선언하고,
 * 시스템을 '관찰 모드(Observation Mode)'로 전환하여 
 * 더 이상의 데이터 변형(Mutation)이나 비용이 발생하는 API 호출을 제어합니다.
 */

export const PLAN_STATUS = 'MISSION_ACCOMPLISHED';

// 시스템 동결 설정
export const FREEZE_CONFIG = {
    // 모든 쓰기 작업(DB 생성/수정/삭제) 제한
    READ_ONLY_MODE: true,

    // 비용이 발생하는 AI API 호출 차단 (캐시된 데이터만 허용)
    BLOCK_PAID_API_CALLS: true,

    // 신규 회원 가입 제한
    ALLOW_NEW_SIGNUPS: false,
};

/**
 * 시스템 상태 확인 함
 * @returns {boolean} 현재 시스템이 동결 상태인지 여부
 */
export function isSystemFrozen(): boolean {
    // 환경 변수로 오버라이드 가능 (긴급 유지보수 시)
    if (process.env.NEXT_PUBLIC_FORCE_UNFREEZE === 'true') {
        return false;
    }
    return true;
}

/**
 * 작업 허용 여부 확인
 * @param actionType 작업을 수행하려는 액션 타입 ('write' | 'paid_api' | 'signup')
 * @returns {boolean} 작업 허용 여부
 */
export function canPerformAction(actionType: 'write' | 'paid_api' | 'signup'): boolean {
    if (!isSystemFrozen()) return true;

    switch (actionType) {
        case 'write':
            return !FREEZE_CONFIG.READ_ONLY_MODE;
        case 'paid_api':
            return !FREEZE_CONFIG.BLOCK_PAID_API_CALLS;
        case 'signup':
            return !FREEZE_CONFIG.ALLOW_NEW_SIGNUPS;
        default:
            return true;
    }
}

/**
 * 동결 상태에 따른 메시지 반환
 */
export function getFreezeMessage(): string {
    return "⛔ Project LooPyck is currently in [ARCHIVED] state. System is read-only.";
}
