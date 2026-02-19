/**
 * Devuelve el color dinámico basado en un nivel y un tema (oscuro/claro).
 *
 * @param {number} level - Nivel de la señal (0-100).
 * @param {boolean} isDark - Indicador de tema oscuro.
 * @returns {string} - Color hexadecimal.
 */
export const getDynamicColor = (level, isDark) => {
    if (level < 30) return isDark ? '#06b6d4' : '#0891b2'; // Cyan
    if (level < 60) return isDark ? '#f59e0b' : '#d97706'; // Amber
    return '#ef4444'; // Red
};

/**
 * Genera datos simulados para el historial de señales.
 *
 * @param {number} length - Longitud del historial.
 * @returns {number[]} - Array de valores de historial.
 */
export const generateHistory = (length) => {
    return new Array(length).fill(0);
};

/**
 * Formatea la fecha y hora para el log.
 *
 * @returns {string} - Hora formateada.
 */
export const formatTime = () => {
    return new Date().toLocaleTimeString('es-ES', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

/**
 * Determina el address space de una URL para la opción targetAddressSpace
 * de fetch() (Chrome Private Network Access — PNA compliance).
 * - 'loopback' → localhost, 127.x.x.x, ::1
 * - 'private'  → RFC-1918 (10.x, 192.168.x, 172.16-31.x)
 * - null       → URL pública (ej. tunel cloudflare HTTPS)
 *
 * @param {string} url
 * @returns {'loopback'|'private'|null}
 */
export const getAddressSpace = (url) => {
    try {
        const { hostname } = new URL(url);
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return 'loopback';
        if (
            /^10\./.test(hostname) ||
            /^192\.168\./.test(hostname) ||
            /^172\.(1[6-9]|2[0-9]|3[01])\./.test(hostname)
        ) return 'private';
    } catch { /* URL inválida */ }
    return null;
};
