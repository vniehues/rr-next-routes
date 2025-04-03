// src/internal/resolveImplementation.ts
export function resolveImplementation(): typeof import('../react-router') | typeof import('../remix') {
    try {
        require('@react-router/dev/routes');
        return require('../react-router');
    } catch (e) {
        try {
            require('@remix-run/route-config');
            return require('../remix');
        } catch (e2) {
            throw new Error(
                "Could not import from either @react-router/dev/routes or @remix-run/route-config. " +
                "Please install one of these packages to use this library."
            );
        }
    }
}