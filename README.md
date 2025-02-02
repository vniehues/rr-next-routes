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
you can even still use the [manual routing](https://reactrouter.com/start/framework/routing) to add more routes to your liking while **rr-next-routes** takes care of the pages dir:

#### **`routes.ts`**
``` typescript
import {route, type RouteConfig} from "@react-router/dev/routes";
import {generateRouteConfig, appRouterStyle} from "rr-next-routes";

const autoRoutes = generateRouteConfig({
    ...appRouterStyle,
    print: "tree",
});

export default [
    ...autoRoutes,
    route("some/path", "./some/file.tsx"),
] satisfies RouteConfig;
```
</details>

---

## Features
#### Keep using **React Router v7** in framework mode and still get: 
- Generate route configurations from a file-based structure.
- Supports for (nested) layouts
- Handles dynamic routes, optional parameters, and catch-all routes (`[param].tsx`, `[[param]].tsx`, `[...param].tsx`).
- Compatible with **React Router v7** (framework mode) and **Remix** routing systems.
- Predefined configurations to suit both app-router and page-router patterns.
- Flexible configuration system.
- Configurable printing options: `info`, `table`, or `tree` to console log the generation results

---

## Installation
You can install the library using npm:
``` bash
npm install rr-next-routes
```

---

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

---

## Configuration Options

The `generateRouteConfig` function accepts an optional configuration object of type `Options`:

#### `Options` Type
```typescript
type PrintOption = "no" | "info" | "table" | "tree";

type Options = {
    folderName?: string;       // Folder to scan for routes (default: "pages").
    print?: PrintOption;       // Controls printing output (default: "info").
    layoutFileName?: string;   // Name of layout files (default: "_layout").
    routeFileNames?: string[]; // Names for route files (e.g., ["page", "index"]).
    routeFileNameOnly?: boolean; // Restrict routes to matching routeFileNames.
    extensions?: string[];     // File extensions to process (e.g., [".tsx", ".ts"]).
};
```

### Predefined Styles

#### 1. `appRouterStyle (default)`
Best for projects following the Next.js app-router convention:

```typescript
export const appRouterStyle: Options = {
    folderName: "",
    print: "info",
    layoutFileName: "layout",
    routeFileNames: ["page", "route"],
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    routeFileNameOnly: true,
};
```

#### 2. `pageRouterStyle`
Best for projects following the Next.js pages-router convention:

```typescript
export const pageRouterStyle: Options = {
    folderName: "pages",
    print: "info",
    layoutFileName: "_layout",
    routeFileNames: ["index"],
    extensions: [".tsx", ".ts", ".jsx", ".js"],
    routeFileNameOnly: false,
};
```

---

### Example Configurations

#### Default Configuration:
```typescript
const routes = generateRouteConfig(); // Uses default options (appRouterStyle).
```

#### Using Pages Router:
```typescript
const routes = generateRouteConfig(pageRouterStyle);
```
#### Custom App Router:
```typescript
const routes = generateRouteConfig({
    ...appRouterStyle,
    print: "tree",
    layoutFileName: "_customLayout",
});
```

---

### Example File Structure (pageRouterStyle)
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


---
## Testing
This project uses **Vitest** for testing. To run the tests:
``` bash
npm test
```

---

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

---

## License
This project is licensed under the [ISC License](https://opensource.org/license/isc-license-txt).
