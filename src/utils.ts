import type {RouteConfigEntry} from "@react-router/dev/routes";

export function transformRoutePath(path: string): string {
    return path
        .replace(/\[\[\s*([^\]]+)\s*]]/g, ':$1?') // Handle optional parameters [[param]]
        .replace(/\[\.\.\.\s*([^\]]+)\s*]/g, '*')  // Handle catch-all parameters [...param]
        .replace(/\[([^\]]+)]/g, ':$1')           // Handle regular parameters [param]
        .replace(/\/\([^)]*\)\//g, '/')          // Handle regular parameters [param]
        .replace(/\/\([^)]*\)/g, '');           // Remove parentheses and contents only if surrounded by slashes
}

function parseDynamicRoute(name: string): { paramName?: string; routeName: string } {
    const paramMatch = name.match(/\[(.+?)]/);
    if (!paramMatch) return {routeName: name};

    const paramName = paramMatch[1];
    return {
        paramName,
        routeName: `:${paramName}`
    };
}

function parseCatchAllParam(name: string): { paramName?: string; routeName: string } {
    const paramMatch = name.match(/\[\.\.\.(.+?)]/);
    if (!paramMatch) return {routeName: name};

    const paramName = paramMatch[1];
    return {
        paramName,
        routeName: "*" // Placeholder to indicate "catch-all" route for now
    };
}

function parseOptionalDynamicRoute(name: string): { paramName?: string; routeName: string } {
    const paramMatch = name.match(/\[\[(.+?)]]/);
    if (!paramMatch) return {routeName: name};

    const paramName = paramMatch[1];
    return {
        paramName,
        routeName: `:${paramName}?`
    };
}

export function parseParameter(name: string): { paramName?: string; routeName: string } {
    if (name.startsWith('[[') && name.endsWith(']]')) {
        // Optional parameter format: [[param]]
        return parseOptionalDynamicRoute(name);
    } else if (name.startsWith('[...') && name.endsWith(']')) {
        // Catch-all parameter format: [...param]
        return parseCatchAllParam(name);
    } else if (name.startsWith('[') && name.endsWith(']')) {
        // Regular parameter format: [param]
        return parseDynamicRoute(name);
    } else {
        // Not a dynamic parameter
        return {routeName: name};
    }
}

export function deepSortByPath(value: any): any {
    if (Array.isArray(value)) {
        // Recursively sort arrays based on 'path'
        return value
            .map(deepSortByPath) // Sort children first
            .sort((a: any, b: any) => compareByPath(a, b));
    }

    if (typeof value === 'object' && value !== null) {
        if ('path' in value) {
            // If the object has a 'path' property, sort its children if any
            return {
                ...value,
                children: value.children ? deepSortByPath(value.children) : undefined,
            };
        }

        // Sort object keys for non-'path' objects
        return Object.keys(value)
            .sort()
            .reduce((acc, key) => {
                acc[key] = deepSortByPath(value[key]);
                return acc;
            }, {} as Record<string, any>);
    }

    return value; // Primitive values
}

function compareByPath(a: any, b: any): number {
    const pathA = a.path || '';
    const pathB = b.path || '';
    return pathA.localeCompare(pathB); // Compare paths alphabetically
}


export function printRoutesAsTable(routes: RouteConfigEntry[]): void {
    function extractRoutesForTable(routes: RouteConfigEntry[], parentLayout: string | null = null): {
        routePath: string;
        routeFile: string;
        parentLayout?: string
    }[] {
        const result: { routePath: string; routeFile: string; parentLayout?: string }[] = [];

        // Sort routes alphabetically based on `path`. Use `file` for sorting if `path` is undefined.
        const sortedRoutes = routes.sort((a, b) => {
            const pathA = a.path ?? ''; // Default to empty string if `path` is undefined
            const pathB = b.path ?? '';
            return pathA.localeCompare(pathB);
        });

        // Separate routes into paths and layouts
        const pathsFirst = sortedRoutes.filter(route => route.path); // Routes with a `path`
        const layoutsLast = sortedRoutes.filter(route => !route.path && route.children); // Layouts only

        // Add all routes with `path` first
        pathsFirst.forEach(route => {
            result.push({
                routePath: route.path!,
                routeFile: route.file,
                parentLayout: parentLayout ?? undefined
            });
        });

        // Add all layouts and recurse into their children
        layoutsLast.forEach(layout => {
            result.push({
                routePath: "(layout)",
                routeFile: layout.file,
                parentLayout: parentLayout ?? undefined
            });

            if (layout.children) {
                const layoutChildren = extractRoutesForTable(layout.children, layout.file); // Recurse with layout's file as parent
                result.push(...layoutChildren);
            }
        });

        return result;
    }

    console.groupCollapsed("✅ Generated Routes Table (open to see generated routes)");
    console.table(extractRoutesForTable(routes));
    console.groupEnd();
}

export function printRoutesAsTree(routes: RouteConfigEntry[], indent = 0): void {
    function printRouteTree(routes: RouteConfigEntry[], indent = 0): void {
        const indentation = '  '.repeat(indent); // Indentation for the tree

        // Sort routes alphabetically:
        const sortedRoutes = routes.sort((a, b) => {
            const pathA = a.path ?? ''; // Use empty string if `path` is undefined
            const pathB = b.path ?? '';
            return pathA.localeCompare(pathB); // Compare paths alphabetically
        });

        // Separate routes from layouts
        const pathsFirst = sortedRoutes.filter(route => route.path); // Routes with "path"
        const layoutsLast = sortedRoutes.filter(route => !route.path && route.children); // Layouts only

        // Print the routes
        pathsFirst.forEach(route => {
            const routePath = `"${route.path}"`;
            console.log(`${indentation}├── ${routePath} (${route.file})`);
        });

        // Print the layouts and recursively handle children
        layoutsLast.forEach(route => {
            console.log(`${indentation}├── (layout) (${route.file})`);
            if (route.children) {
                printRouteTree(route.children, indent + 1); // Recursive call for children
            }
        });
    }

    console.groupCollapsed("✅ Generated Route Tree (open to see generated routes)");
    printRouteTree(routes, indent);
    console.groupEnd();
}