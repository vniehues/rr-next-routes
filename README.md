# rr-next-routes
`rr-next-routes` is a utility library for generating **Next.js-style** routes for your **React Router v7** or **Remix** applications.    
It provides a directory-based routing solution for React applications, similar to Next.js, and supports features like layouts, route parameters, and dynamic routing with nested route management.

<details>
<summary><b>Motivation</b></summary>

<br>
I really enjoy using file-based (directory-based) routing when working with next.js
<br>
While there are different solutions like [generouted](https://github.com/oedotme/generouted), most of them require you to modify multiple files and some even bring their own routing.

**rr-next-routes** is a simple drop in solution for project using [remix](https://remix.run) or [react-router v7](https://reactrouter.com/home) in framework mode.
<br>
you can even still use the [manual routing](https://reactrouter.com/start/framework/routing) to add more routes to your liking while **rr-next-routes** takes care of the pages dir:

#### **`routes.ts`**
``` typescript
import {route, type RouteConfig} from "@react-router/dev/routes";
import {generateRouteConfig} from "rr-next-routes";

const autoRoutes = generateRouteConfig({ print: "info" });
export default [
    ...autoRoutes,
    route("some/path", "./some/file.tsx"),

] satisfies RouteConfig;
```
</details>

## Features
- Generate route configurations from a file-based structure.
- Support for layouts using `_layout.tsx` files.
- Handles dynamic routes, optional parameters, and catch-all routes (`[param].tsx`, `[[param]].tsx`, `[...param].tsx`).
- Compatible with **React Router v7** and Remix routing systems.
- Configurable output via print options (e.g., info, table, or tree).
- Sorting and managing nested routes with built-in utilities.

## Installation
You can install the library using npm:
``` bash
npm install rr-next-routes
```
## Usage
### Example
Here’s a sample usage of `rr-next-routes` for generating route configurations:
#### **`routes.ts`**
``` typescript
import { type RouteConfig } from "@react-router/dev/routes";
import { generateRouteConfig } from "rr-next-routes";

const routes = generateRouteConfig({ print: "info" });

export default routes satisfies RouteConfig;
```
## Configuration Options
The `generateRouteConfig` function accepts an optional configuration object of type `Options`:
### `Options` Type
``` typescript
type PrintOption = "no" | "info" | "table" | "tree";

type Options = {
    folderName?: string; // Name of the folder containing route files. Defaults to "pages".
    print?: PrintOption; // Specifies the route output mode: "no", "info", "table", or "tree".
};

const defaultOptions: Options = {
    folderName: "pages", // Default folder name for routes (inside the `/app` directory).
    print: "info",       // Default print option ("info").
};
```
### Config Options Description
- **`folderName (optional)`**
    - The directory to be scanned for route files. Defaults to `"pages"`. This folder needs to be located inside the `/app` directory.
    - Example: If set to `custom-pages`, your route files should be in `/app/custom-pages`.

- **`print (optional)`**
    - Controls the output of route generation.
    - Options:
        - `"no"`: Does not print any output.
        - `"info"`: Prints a success message (default behavior).
        - `"table"`: Prints the generated routes in a table format.
        - `"tree"`: Prints the routes in a nested tree structure.

### Example Configurations
#### Default Configuration
``` typescript
const routes = generateRouteConfig();
```
This will scan the `/app/pages` directory and print `"✅ Generated Routes"` in the console.
#### Tree Print Output Example
``` typescript
const routes = generateRouteConfig({ print: "tree" });
```
This will print a tree representation of the routes in the console, like so:
``` 
✅ Generated Route Tree (open to see generated routes)
├── "/" (pages/index.tsx)
├── (layout) (pages/dashboard/_layout.tsx)
│   ├── "/dashboard" (pages/dashboard/index.tsx)
│   ├── "/dashboard/settings" (pages/dashboard/settings.tsx)
└── "/about" (pages/about.tsx)
```
#### Custom Folder Name
``` typescript
const routes = generateRouteConfig({ folderName: "custom-pages" });
```
This will scan the `/app/custom-pages` directory instead of `/app/pages`.
## Folder and File Structure
The library works within the `/app` directory and generates routes based on the specified folder (`folderName`).    
Below is an example file structure and the resulting routes:
### Example File Structure
``` 
app/
├── pages/
│   ├── index.tsx
│   ├── about.tsx
│   ├── dashboard/
│   │   ├── _layout.tsx
│   │   ├── index.tsx
│   │   ├── settings.tsx
│   ├── profile/
│   │   ├── name.tsx
│   │   ├── email.tsx
│   │   ├── password.tsx
```
### Generated Routes
The above structure will result in the following routes:
- `/` → `pages/index.tsx`
- `/about` → `pages/about.tsx`
- `/dashboard` → `pages/dashboard/index.tsx` (wrapped by `layout`: `pages/dashboard/_layout.tsx`)
- `/dashboard/settings` → `pages/dashboard/settings.tsx` (wrapped by `layout`: `pages/dashboard/_layout.tsx`)
- `/profile/name` → `pages/profile/name.tsx`
- `/profile/email` → `pages/profile/email.tsx`
- `/profile/password` → `pages/profile/password.tsx`

## Dynamic Routes
The library supports Next.js-style dynamic and optional routes:
### Example
#### File Structure
``` 
app/
├── pages/
│   ├── [id].tsx
│   ├── [[optional]].tsx
│   ├── [...all].tsx
```
#### Generated Routes
- `/:id` → `pages/[id].tsx`
- `/:optional?` → `pages/[[optional]].tsx`
- `/*` → `pages/[...all].tsx`

These routes are created using a special character mapping:

| File Name | Route Path |
| --- | --- |
| `[id].tsx` | `/:id` |
| `[[optional]].tsx` | `/:optional?` |
| `[...all].tsx` | `/*` |
## Testing
This project uses **Vitest** for testing. To run the tests:
``` bash
npm test
```
## Development
The project supports ES modules and is built using `tsup`.
### Build
To build the project:
``` bash
npm run build
```
### Watch (Test in Development Mode)
``` bash
npm run dev
```
## License
This project is licensed under the [ISC License](https://opensource.org/license/isc-license-txt).
