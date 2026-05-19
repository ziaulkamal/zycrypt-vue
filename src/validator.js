import { saveToken, loadToken, isInGrace, clearAll } from './storage.js';

export async function requestToken(proxyUrl = '/zycrypt/token', graceHours = 24) {
    try {
        const response = await fetch(proxyUrl, {
            method:  'POST',
            headers: {
                'Content-Type':     'application/json',
                'Accept':           'application/json',
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRF-TOKEN':     getCsrfToken(),
            },
        });

        if (response.ok) {
            const data = await response.json();
            if (data.valid && data.token) {
                saveToken(data.token, {
                    plan:        data.plan,
                    is_lifetime: data.is_lifetime,
                    expires_at:  data.expires_at,
                });
                return { valid: true, token: data.token, plan: data.plan };
            }
        }

        const error = await response.json().catch(() => ({}));
        return {
            valid:  false,
            reason: error.reason || 'server_error',
            detail: error.detail || '',
        };

    } catch (_) {
        if (isInGrace(graceHours)) {
            const cached = loadToken();
            if (cached) {
                return { valid: true, token: cached, grace: true };
            }
        }
        return { valid: false, reason: 'server_unreachable' };
    }
}

export function invalidate() {
    clearAll();
}

function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}
