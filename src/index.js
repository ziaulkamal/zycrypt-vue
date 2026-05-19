import { requestToken, invalidate } from './validator.js';
import { setupInterceptor }        from './interceptor.js';
import { loadPlan, isInGrace }     from './storage.js';

const ZyCrypt = {
    /**
     * app.use(ZyCrypt, { licenseKey, serverUrl, axios, graceHours, onInvalid })
     */
    install(app, options = {}) {
        const {
            serverUrl   = '/zycrypt/token',   // Laravel proxy URL
            axios       = window.axios,
            graceHours  = 24,
            onInvalid   = null,
        } = options;

        // State reaktif yang bisa diakses via inject('zycrypt')
        const state = app.config.globalProperties.$zycrypt = {
            valid:      false,
            grace:      false,
            loading:    true,
            reason:     null,
            plan:       loadPlan(),
            invalidate,
            revalidate: () => validate(),
        };

        // Setup Axios interceptor jika axios tersedia
        if (axios) {
            setupInterceptor(axios, {
                proxyUrl:   serverUrl,
                graceHours,
                onInvalid:  onInvalid || defaultOnInvalid,
            });
        }

        // Provide ke seluruh komponen via inject('zycrypt')
        app.provide('zycrypt', state);

        // Validasi saat mount
        validate();

        // Re-validate setiap (graceHours / 4) jam sekali, minimal tiap 10 menit
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
            // Default: reload halaman — Laravel ServiceProvider akan redirect ke error page
            console.warn('[ZyCrypt] License invalid:', reason);
            window.location.reload();
        }
    },
};

export default ZyCrypt;

// Composable untuk digunakan di dalam komponen Vue
export function useZyCrypt() {
    const { inject } = window.__VUE_INJECT__ || {};
    // Gunakan via inject('zycrypt') di dalam setup()
}
