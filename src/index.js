import { requestToken, invalidate } from './validator.js';
import { setupInterceptor }        from './interceptor.js';
import { loadPlan, isInGrace }     from './storage.js';

const ZyCrypt = {
    install(app, options = {}) {
        const {
            serverUrl  = '/zycrypt/token',
            axios      = window.axios,
            graceHours = 24,
            onInvalid  = null,
        } = options;

        const state = app.config.globalProperties.$zycrypt = {
            valid:      false,
            grace:      false,
            loading:    true,
            reason:     null,
            plan:       loadPlan(),
            invalidate,
            revalidate: () => validate(),
        };

        if (axios) {
            setupInterceptor(axios, {
                proxyUrl:  serverUrl,
                graceHours,
                onInvalid: onInvalid || defaultOnInvalid,
            });
        }

        app.provide('zycrypt', state);

        validate();

        const intervalMs = Math.max(10 * 60 * 1000, (graceHours / 4) * 60 * 60 * 1000);
        setInterval(validate, intervalMs);

        async function validate() {
            state.loading = true;
            const result  = await requestToken(serverUrl, graceHours);
            state.loading = false;
            state.valid   = result.valid;
            state.grace   = result.grace || false;
            state.reason  = result.reason || null;
            state.plan    = loadPlan();

            if (! result.valid && typeof onInvalid === 'function') {
                onInvalid(result.reason);
            }
        }

        function defaultOnInvalid(reason) {
            console.warn('[ZyCrypt] License invalid:', reason);
            window.location.reload();
        }
    },
};

export default ZyCrypt;

export function useZyCrypt() {
    const { inject } = window.__VUE_INJECT__ || {};
}
