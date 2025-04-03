/**
 * This file serves as the main entry point for the library.
 * It tries to import from both @react-router/dev/routes and @remix-run/route-config
 * and uses whichever one is available.
 */

// Export the common types
import {resolveImplementation} from "./common/implementationResolver";

export type { Options } from './common/next-routes-common';
export { appRouterStyle, pageRouterStyle } from './common/next-routes-common';

// Try to determine which implementation to use

const implementation = resolveImplementation();

export const nextRoutes = implementation.nextRoutes;
export const generateRouteConfig = implementation.generateRouteConfig;
