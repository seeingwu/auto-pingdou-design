const DRM_KEY = '_pingdou_design_v2_rt_cache';
const SALT = 'pingdou_pro_drm_auth_2026_x89a';

// Simple signed token validation
function getSignature(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

export function getRemainingUses(): number {
    if (typeof window === 'undefined') return 1000;

    const raw = localStorage.getItem(DRM_KEY);
    if (!raw) {
        // Initialize with 1000 uses
        setRemainingUses(1000);
        return 1000;
    }

    try {
        const parts = raw.split('.');
        if (parts.length !== 2) return 0;

        const countStr = parts[0];
        const signature = parts[1];

        const expectedSig = getSignature(countStr + SALT);
        if (signature !== expectedSig) {
            // Tamper detected! Lock to 0
            setRemainingUses(0);
            return 0;
        }

        const count = parseInt(countStr, 10);
        if (isNaN(count)) return 0;

        return count;
    } catch {
        return 0;
    }
}

export function decrementUse(): boolean {
    const remaining = getRemainingUses();
    if (remaining <= 0) {
        return false;
    }

    setRemainingUses(remaining - 1);
    return true;
}

function setRemainingUses(count: number) {
    if (typeof window === 'undefined') return;
    const countStr = count.toString();
    const signature = getSignature(countStr + SALT);
    localStorage.setItem(DRM_KEY, `${countStr}.${signature}`);
}
