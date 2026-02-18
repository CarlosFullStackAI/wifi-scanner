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
