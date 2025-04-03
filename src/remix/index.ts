import {
    appRouterStyle,
    createRouteConfig,
    generateNextRoutes,
    pageRouterStyle,
    type Options
} from "../common/next-routes-common";
import {type RouteConfigEntry, getAppDirectory, route, layout } from "@remix-run/route-config";
/**
 * @deprecated The method should not be used anymore. please use {@link nextRoutes} instead.
 */
export function generateRouteConfig(options: Options = appRouterStyle): RouteConfigEntry[] {
    return nextRoutes(options);
}

/**
 * Generates route configuration from a Next.js-style pages directory for Remix
 */
export function nextRoutes(options: Options = appRouterStyle): RouteConfigEntry[] {
    return generateNextRoutes(
        options,
        getAppDirectory,
        route,
        layout
    );
}

export {
    appRouterStyle,
    pageRouterStyle,
    type Options,
    type RouteConfigEntry
};
