import {readdirSync, statSync} from 'node:fs';
import {join, parse, relative, resolve} from 'node:path';
import {
    deepSortByPath,
    isHoistedFolder,
    parseParameter,
    printRoutesAsTable,
    printRoutesAsTree,
    transformRoutePath
} from "./utils";
import {RouteConfigEntry} from "./types";

type PrintOption = "no" | "info" | "table" | "tree";

export const appRouterStyle: Options = {
    folderName: "",
    print: "info",
    layoutFileName: "layout",
    routeFileNames: ["page", "route"], // in nextjs this is the difference between a page (with components) and an api route (without components). in react-router an api route (resource route) just does not export a default component. 
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    routeFileNameOnly: true, // all files with names different from routeFileNames get no routes
    enableHoistedFolders: false,
};

export const pageRouterStyle: Options = {
    folderName: "pages",
    print: "info",
    layoutFileName: "_layout", //layouts do no exist like that in nextjs pages router so we use a special file.
    routeFileNames: ["index"],
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    routeFileNameOnly: false, // all files without a leading underscore get routes as long as the extension matches
    enableHoistedFolders: false,
};

export type Options = {
    folderName?: string;
    layoutFileName?: string;
    routeFileNames?: string[];
    routeFileNameOnly?: boolean;
    extensions?: string[];
    print?: PrintOption;
    enableHoistedFolders?: boolean;
};

const defaultOptions: Options = appRouterStyle;

/**
 * Creates a route configuration for a file or directory
 * @param name - Name of the file or directory
 * @param parentPath - Current path in the route hierarchy
 * @param relativePath - Relative path to the file from pages directory
 * @param folderName - Name of the current folder (needed for dynamic routes)
 * @param routeFileNames - name of the index routes
 * @param routeCreator - Function to create a route entry
 * @returns Route configuration entry
 */
export function createRouteConfig(
    name: string,
    parentPath: string,
    relativePath: string,
    folderName: string,
    routeFileNames: string[],
    routeCreator: (path: string, file: string) => RouteConfigEntry
): RouteConfigEntry {
    // Handle index routes in dynamic folders
    if (routeFileNames.includes(name) && folderName.startsWith('[') && folderName.endsWith(']')) {
        const {routeName} = parseParameter(folderName);
        const routePath = parentPath === '' ? routeName : `${parentPath.replace(folderName, '')}${routeName}`;
        return routeCreator(transformRoutePath(routePath), relativePath);
    }

    // Handle regular index routes
    if (routeFileNames.includes(name)) {
        const routePath = parentPath === '' ? '/' : parentPath;
        return routeCreator(transformRoutePath(routePath), relativePath);
    }

    // Handle dynamic and regular routes
    const {routeName} = parseParameter(name);
    const routePath = parentPath === '' ? `/${routeName}` : `${parentPath}/${routeName}`;
    return routeCreator(transformRoutePath(routePath), relativePath);
}

/**
 * Generates route configuration from a Next.js-style pages directory
 * @param options - Configuration options for route generation
 * @param getAppDir - Function to get the app directory
 * @param routeCreator - Function to create a route entry
 * @param layoutCreator - Function to create a layout entry
 * @returns Array of route configurations
 */
export function generateNextRoutes(
    options: Options = defaultOptions,
    getAppDir: () => string,
    routeCreator: (path: string, file: string) => RouteConfigEntry,
    layoutCreator: (file: string, children: RouteConfigEntry[]) => RouteConfigEntry
): RouteConfigEntry[] {
    const {
        folderName: baseFolder = defaultOptions.folderName!,
        print: printOption = defaultOptions.print!,
        extensions = defaultOptions.extensions!,
        layoutFileName = defaultOptions.layoutFileName!,
        routeFileNames = defaultOptions.routeFileNames!,
        routeFileNameOnly = defaultOptions.routeFileNameOnly!,
        enableHoistedFolders = defaultOptions.enableHoistedFolders!,
    } = options;

    let appDirectory = getAppDir();

    const pagesDir = resolve(appDirectory, baseFolder);

    /**
     * Scans a directory and returns its contents
     * @param dirPath - Path to the directory to scan
     */
    function scanDir(dirPath: string) {
        return {
            folderName: parse(dirPath).base,
            files: readdirSync(dirPath).sort((a, b) => {
                const {ext: aExt, name: aName} = parse(a);
                return ((routeFileNames.includes(aName) && extensions.includes(aExt)) ? -1 : 1)
            })
        };
    }

    /**
     * Recursively scans directory and generates route configurations
     * @param dir - Current directory path
     * @param parentPath - Current path in route hierarchy
     */
    function scanDirectory(dir: string, parentPath: string = ''): RouteConfigEntry[] {
        const routes: RouteConfigEntry[] = [];
        const {files, folderName} = scanDir(dir);
        const layoutFile = files.find(item => {
            const {ext, name} = parse(item);
            return (name === layoutFileName && extensions.includes(ext));
        });
        const currentLevelRoutes: RouteConfigEntry[] = [];

        // Process each file in the directory
        files.forEach(item => {
            // Early return for excluded items
            if (item.startsWith('_')) return;

            const fullPath = join(dir, item);
            const stats = statSync(fullPath);
            const {name, ext, base} = parse(item);
            const relativePath = join(baseFolder, relative(pagesDir, fullPath));

            // Don't create accessible routes for layout files.
            if (layoutFileName && name === layoutFileName) return;

            if (stats.isDirectory()) {
                // Handle nested directories
                const nestedRoutes = scanDirectory(fullPath, `${parentPath}/${base}`);
                (layoutFile && !(enableHoistedFolders && isHoistedFolder(name)) ? currentLevelRoutes : routes).push(...nestedRoutes);
            } else if (extensions.includes(ext)) {
                // Early return if strict file names are enabled and the current item is not in the list.
                if (routeFileNameOnly && !routeFileNames.includes(name)) return;
                const routeConfig = createRouteConfig(name, parentPath, relativePath, folderName, routeFileNames, routeCreator);
                (layoutFile ? currentLevelRoutes : routes).push(routeConfig);
            }
        });
        if (layoutFile) {
            const layoutPath = join(baseFolder, relative(pagesDir, join(dir, layoutFile)));
            routes.push(layoutCreator(layoutPath, currentLevelRoutes));
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