import {
    appRouterStyle,
    generateNextRoutes,
    pageRouterStyle,
    type Options
} from "../common/next-routes-common";
import {type RouteConfigEntry, getAppDirectory, route, layout, index} from "@react-router/dev/routes";

/**
 * @deprecated The method should not be used anymore. please use {@link nextRoutes} instead.
 */
export function generateRouteConfig(options: Options = appRouterStyle): RouteConfigEntry[] {
    return nextRoutes(options);
}

/**
 * Generates route configuration from a Next.js-style pages directory for React Router
 */
export function nextRoutes(options: Options = appRouterStyle): RouteConfigEntry[] {
    return generateNextRoutes(
        options,
        getAppDirectory,
        index,
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