import { readdirSync, statSync } from 'fs';
import { join, parse, relative } from 'path';
import { type RouteConfigEntry, route, layout } from "@react-router/dev/routes";
import { deepSortByPath, parseParameter, printRoutesAsTable, printRoutesAsTree, transformRoutePath } from "./utils";

type PrintOption = "no" | "info" | "table" | "tree";

type Options = {
    folderName?: string;
    print?: PrintOption;
};

const defaultOptions: Options = {
    folderName: "pages",
    print: "info",
};

/**
 * Creates a route configuration for a file or directory
 * @param name - Name of the file or directory
 * @param parentPath - Current path in the route hierarchy
 * @param relativePath - Relative path to the file from pages directory
 * @param folderName - Name of the current folder (needed for dynamic routes)
 * @returns Route configuration entry
 */
function createRouteConfig(
    name: string,
    parentPath: string,
    relativePath: string,
    folderName: string
): RouteConfigEntry {
    // Handle index routes in dynamic folders
    if (name === 'index' && folderName.startsWith('[') && folderName.endsWith(']')) {
        const { routeName } = parseParameter(folderName);
        const routePath = parentPath === '' ? routeName : `${parentPath.replace(folderName, '')}${routeName}`;
        return route(transformRoutePath(routePath), relativePath);
    }

    // Handle regular index routes
    if (name === 'index') {
        const routePath = parentPath === '' ? '/' : parentPath;
        return route(transformRoutePath(routePath), relativePath);
    }

    // Handle dynamic and regular routes
    const { routeName } = parseParameter(name);
    const routePath = parentPath === '' ? `/${routeName}` : `${parentPath}/${routeName}`;
    return route(transformRoutePath(routePath), relativePath);
}

/**
 * Generates route configuration from a Next.js-style pages directory for Remix
 * @param options - Configuration options for route generation
 * @returns Array of route configurations
 */
export function generateRouteConfig(options: Options = defaultOptions): RouteConfigEntry[] {
    const baseFolder = options.folderName || defaultOptions.folderName!;
    const printOption = options.print || defaultOptions.print!;
    const pagesDir = "./app/" + baseFolder;

    /**
     * Scans a directory and returns its contents
     * @param dirPath - Path to the directory to scan
     */
    function scanDir(dirPath: string) {
        return {
            folderName: parse(dirPath).name,
            files: readdirSync(dirPath).sort((a, b) => (a === 'index.tsx' ? -1 : 1))
        };
    }

    /**
     * Recursively scans directory and generates route configurations
     * @param dir - Current directory path
     * @param parentPath - Current path in route hierarchy
     */
    function scanDirectory(dir: string, parentPath: string = ''): RouteConfigEntry[] {
        const routes: RouteConfigEntry[] = [];
        const { files, folderName } = scanDir(dir);
        const layoutFile = files.find(item => item === '_layout.tsx');
        const currentLevelRoutes: RouteConfigEntry[] = [];

        // Process each file in the directory
        files.forEach(item => {
            if (item.startsWith('_')) return;

            const fullPath = join(dir, item);
            const stats = statSync(fullPath);
            const { name, ext } = parse(item);
            const relativePath = `${baseFolder}/${relative(pagesDir, fullPath)}`;

            if (stats.isDirectory()) {
                // Handle nested directories
                const nestedRoutes = scanDirectory(fullPath, `${parentPath}/${name}`);
                (layoutFile ? currentLevelRoutes : routes).push(...nestedRoutes);
            } else if (ext === '.tsx' || ext === '.ts') {
                const routeConfig = createRouteConfig(name, parentPath, relativePath, folderName);
                (layoutFile ? currentLevelRoutes : routes).push(routeConfig);
            }
        });

        // If layout file exists, wrap current level routes in a layout
        if (layoutFile) {
            const layoutPath = `${baseFolder}/${relative(pagesDir, join(dir, layoutFile))}`;
            routes.push(layout(layoutPath, currentLevelRoutes));
        } else {
            routes.push(...currentLevelRoutes);
        }

        return routes;
    }

    const results = scanDirectory(pagesDir);

    // Handle printing options
    switch (printOption) {
        case "tree":
            printRoutesAsTree(results);
            break;
        case "table":
            printRoutesAsTable(results);
            break;
        case "info":
            console.log("✅ Generated Routes");
            break;
        case "no":
            break;
    }

    return deepSortByPath(results);
}