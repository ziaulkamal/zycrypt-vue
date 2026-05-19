const KEY_TOKEN     = 'zycrypt_token';
const KEY_VALIDATED = 'zycrypt_validated_at';
const KEY_PLAN      = 'zycrypt_plan';

export function saveToken(token, plan) {
    try {
        localStorage.setItem(KEY_TOKEN,     token);
        localStorage.setItem(KEY_VALIDATED, Date.now().toString());
        if (plan) localStorage.setItem(KEY_PLAN, JSON.stringify(plan));
    } catch (_) {}
}

export function loadToken() {
    try {
        return localStorage.getItem(KEY_TOKEN) || null;
    } catch (_) {
        return null;
    }
}

export function loadValidatedAt() {
    try {
        const ts = localStorage.getItem(KEY_VALIDATED);
        return ts ? parseInt(ts, 10) : null;
    } catch (_) {
        return null;
    }
}

export function loadPlan() {
    try {
        const raw = localStorage.getItem(KEY_PLAN);
        return raw ? JSON.parse(raw) : null;
    } catch (_) {
        return null;
    }
}

export function clearAll() {
    try {
        localStorage.removeItem(KEY_TOKEN);
        localStorage.removeItem(KEY_VALIDATED);
        localStorage.removeItem(KEY_PLAN);
    } catch (_) {}
}

export function isInGrace(graceHours = 24) {
    const validatedAt = loadValidatedAt();
    if (! validatedAt) return false;

    const ageMs   = Date.now() - validatedAt;
    const graceMs = graceHours * 60 * 60 * 1000;
    return ageMs < graceMs;
}
