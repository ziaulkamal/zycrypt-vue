import { loadToken } from './storage.js';
import { requestToken } from './validator.js';

let _axios      = null;
let _proxyUrl   = '/zycrypt/token';
let _graceHours = 24;
let _onInvalid  = null;
let _refreshing = false;

export function setupInterceptor(axios, { proxyUrl, graceHours, onInvalid } = {}) {
    _axios      = axios;
    _proxyUrl   = proxyUrl   || '/zycrypt/token';
    _graceHours = graceHours || 24;
    _onInvalid  = onInvalid  || null;

    axios.interceptors.request.use((config) => {
        const token = loadToken();
        if (token) {
            config.headers['X-ZyCrypt-Token']   = token;
            config.headers['X-ZyCrypt-Version'] = '1.0.0';
        }
        return config;
    });

    axios.interceptors.response.use(
        (response) => response,
        async (error) => {
            const res = error.response;

            if (! res || res.status !== 403 || res.data?.reason !== 'token_expired') {
                return Promise.reject(error);
            }

            if (_refreshing) {
                return Promise.reject(error);
            }

            _refreshing = true;
            const result = await requestToken(_proxyUrl, _graceHours);
            _refreshing  = false;

            if (result.valid) {
                error.config.headers['X-ZyCrypt-Token'] = result.token;
                return axios.request(error.config);
            }

            if (typeof _onInvalid === 'function') {
                _onInvalid(result.reason);
            }

            return Promise.reject(error);
        }
    );
}
