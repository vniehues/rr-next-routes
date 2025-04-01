import {assert, beforeEach, describe, expect, test, vi} from 'vitest'
import {vol} from 'memfs'
import {appRouterStyle, generateRouteConfig, nextRoutes, pageRouterStyle} from "./next-routes";
import {deepSortByPath, parseParameter, transformRoutePath} from "./utils";
import * as fs from "node:fs";
import {index, layout, prefix, route} from "@react-router/dev/routes";

vi.mock("node:fs", async () => {
    const memfs = await vi.importActual("memfs");
    return memfs.fs;
});

vi.mock('node:fs/promises', async () => {
    const memfs: { fs: typeof fs } = await vi.importActual('memfs')
    return memfs.fs.promises
})

vi.mock(import('@react-router/dev/routes'), async (importOriginal) => {
    const mod = await importOriginal() // type is inferred
    return {
        ...mod,
        getAppDirectory: vi.fn(() => './app')
    }
})

describe('direct route transform tests', () => {
    test("catchall", () => {
        const parsed = parseParameter("[...all]")
        expect(parsed).toEqual({paramName: "all", routeName: "*"})

        const transformed = transformRoutePath("[...all]")
        expect(transformed).toBe("*")
    })

    test("dynamic", () => {
        const parsed = parseParameter("[all]")
        expect(parsed).toEqual({paramName: "all", routeName: ":all"})

        const transformed = transformRoutePath("[all]")
        expect(transformed).toBe(":all")
    })

    test("dynamic-optional", () => {
        const parsed = parseParameter("[[all]]")
        expect(parsed).toEqual({paramName: "all", routeName: ":all?"})

        const transformed = transformRoutePath("[[all]]")
        expect(transformed).toBe(":all?")

        const transformed2 = transformRoutePath("/test/[[all]]/test")
        expect(transformed2).toBe("/test/:all?/test")
    })

    test("excluded-folder", () => {
        const transformed = transformRoutePath("/testA/testB/[[all]]/testC")
        expect(transformed).toEqual("/testA/testB/:all?/testC")

        const transformed2 = transformRoutePath("/testA/(testB)/[[all]]/testC")
        expect(transformed2).toEqual("/testA/:all?/testC")
    })
})

describe('compare with actual routes', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app/pages/index.tsx': 'console.log("Hello")',
            './app/pages/about.tsx': 'console.log("Hello")',
            './app/pages/dashboard/_layout.tsx': 'console.log("Hello")',
            './app/pages/dashboard/index.tsx': 'export const helper = () => {}',
            './app/pages/dashboard/settings.tsx': 'export const helper = () => {}',
            './app/pages/profile/name.tsx': 'export const helper = () => {}',
            './app/pages/profile/password.tsx': 'export const helper = () => {}',
            './app/pages/profile/email.tsx': 'export const helper = () => {}',

            './app/pages/patha/_layout.tsx': 'console.log("Hello")',
            './app/pages/patha/about.tsx': 'export const helper = () => {}',
            './app/pages/patha/settings.tsx': 'export const helper = () => {}',

            './app/pages/patha/(excludedPath)/_layout.tsx': 'export const helper = () => {}',
            './app/pages/patha/(excludedPath)/routeb.tsx': 'export const helper = () => {}',
        })
    })

    test('creates index routes correctly', () => {
        const contents = nextRoutes(pageRouterStyle);
        const expected = [
            layout("pages/dashboard/_layout.tsx", [
                route("/dashboard", "pages/dashboard/index.tsx"),
                route("/dashboard/settings", "pages/dashboard/settings.tsx"),
            ]),
            layout("pages/patha/_layout.tsx", [
                route("/patha/about", "pages/patha/about.tsx"),
                route("/patha/settings", "pages/patha/settings.tsx"),

                layout("pages/patha/(excludedPath)/_layout.tsx", [
                    route("/patha/routeb", "pages/patha/(excludedPath)/routeb.tsx"),
                ])
            ]),
            route("/", "pages/index.tsx"),
            route("/about", "pages/about.tsx"),
            ...prefix("/profile", [
                route("name", "pages/profile/name.tsx"),
                route("email", "pages/profile/email.tsx"),
                route("password", "pages/profile/password.tsx"),
            ]),
        ]

        assert.sameDeepMembers(contents, deepSortByPath(expected), 'same members')
    })
})

describe('route generation same regardless of print', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Setup test file structure
        vol.fromJSON({
            './app': null,
            './app/pages': null,
            './app/pages/[...catchall].tsx': 'export default () => {}',
            './app/pages/index.tsx': 'export default () => {}',
            './app/pages/remix.tsx': 'export default () => {}',
            './app/pages/testpage.tsx': 'export default () => {}',

            // API directory structure
            './app/pages/api': null,
            './app/pages/api/auth': null,
            './app/pages/api/auth/[...all].ts': 'export default () => {}',
            './app/pages/api/theme': null,
            './app/pages/api/theme/set.ts': 'export default () => {}',

            // Login directory
            './app/pages/login': null,
            './app/pages/login/index.tsx': 'export default () => {}',

            // Signup directory
            './app/pages/signup': null,
            './app/pages/signup/index.tsx': 'export default () => {}',

            // Test directory complex structure
            './app/pages/testdir': null,
            './app/pages/testdir/_layout.tsx': 'export default () => {}',
            './app/pages/testdir/testpage.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]': null,
            './app/pages/testdir/[testing]/_layout.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]/index.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]/[[nested]]': null,
            './app/pages/testdir/[testing]/[[nested]]/index.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]/[[nested]]/test': null,
            './app/pages/testdir/[testing]/[[nested]]/test/index.tsx': 'export default () => {}',

            // Test excluded dir
            './app/pages/testdir/(testexclude)': null,
            './app/pages/testdir/(testexclude)/movedUp.tsx': 'export default () => {}',
        })
    })

    test('generates route config correctly', () => {
        const contentsNoPrint = nextRoutes({...pageRouterStyle, print: "no"});
        const contentsInfoPrint = nextRoutes({...pageRouterStyle, print: "info"});
        const contentsTreePrint = nextRoutes({...pageRouterStyle, print: "tree"});
        const contentsTablePrint = nextRoutes({...pageRouterStyle, print: "table"});

        assert.sameDeepMembers(contentsNoPrint, contentsInfoPrint, 'same members')
        assert.sameDeepMembers(contentsNoPrint, contentsTreePrint, 'same members')
        assert.sameDeepMembers(contentsNoPrint, contentsTablePrint, 'same members')

        const expected = deepSortByPath([
            {
                file: 'pages/[...catchall].tsx',
                children: undefined,
                path: '/*'
            },
            {
                file: 'pages/api/auth/[...all].ts',
                children: undefined,
                path: '/api/auth/*'
            },
            {
                file: 'pages/api/theme/set.ts',
                children: undefined,
                path: '/api/theme/set'
            },
            {
                file: 'pages/login/index.tsx',
                children: undefined,
                path: '/login'
            },
            {
                file: 'pages/remix.tsx',
                children: undefined,
                path: '/remix'
            },
            {
                file: 'pages/signup/index.tsx',
                children: undefined,
                path: '/signup'
            },
            {
                file: 'pages/testpage.tsx',
                children: undefined,
                path: '/testpage'
            },
            {
                file: 'pages/testdir/_layout.tsx',
                children: [
                    {
                        "file": "pages/testdir/[testing]/_layout.tsx",
                        "children": [
                            {
                                "file": "pages/testdir/[testing]/index.tsx",
                                "path": "/testdir/:testing",
                                "children": undefined
                            },
                            {
                                "file": "pages/testdir/[testing]/[[nested]]/index.tsx",
                                "path": "/testdir/:testing/:nested?",
                                "children": undefined
                            },
                            {
                                "file": "pages/testdir/[testing]/[[nested]]/test/index.tsx",
                                "path": "/testdir/:testing/:nested?/test",
                                "children": undefined
                            }
                        ]
                    },
                    {
                        "file": "pages/testdir/(testexclude)/movedUp.tsx",
                        "path": "/testdir/movedUp",
                        "children": undefined
                    },
                    {
                        "file": "pages/testdir/testpage.tsx",
                        "path": "/testdir/testpage",
                        "children": undefined
                    }
                ]
            },
            {
                file: 'pages/index.tsx',
                children: undefined,
                path: '/'
            },
        ]);

        assert.sameDeepMembers(contentsNoPrint, expected, 'same members')
        assert.sameDeepMembers(contentsInfoPrint, expected, 'same members')
        assert.sameDeepMembers(contentsTreePrint, expected, 'same members')
        assert.sameDeepMembers(contentsTablePrint, expected, 'same members')
    })
})

describe('route generation tests', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app': null,
            './app/pages': null,
            './app/pages/index.tsx': 'console.log("Hello")',
            './app/pages/utils': null,
            './app/pages/utils/index.tsx': 'export const helper = () => {}',
        })
    })


    test('creates index routes correctly', () => {
        const contents = nextRoutes(pageRouterStyle)
        const expected = [
            {file: 'pages/index.tsx', children: undefined, path: '/'},
            {
                file: 'pages/utils/index.tsx',
                children: undefined,
                path: '/utils'
            },
        ]

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe("creates index route from excluded folder", () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app': null,
            './app/pages': null,
            './app/pages/(marketing)/index.tsx': 'console.log("Hello")',
            './app/pages/(marketing)/remix.tsx': 'console.log("Hello")',
            './app/pages/(marketing)/_layout.tsx': 'console.log("Hello")',
        })
    })


    test('creates index routes correctly', () => {
        const contents = nextRoutes(pageRouterStyle)
        const expected = [
            layout("pages/(marketing)/_layout.tsx", [
                route("/", "pages/(marketing)/index.tsx"),
                route("/remix", "pages/(marketing)/remix.tsx"),
            ])
        ]

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe('same level exclusion tests', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app/pages/index.tsx': "{}",
            './app/pages/(excluded)/about.tsx': "{}",
            './app/pages/(alsoExluded)/legal.tsx': "{}",
        })
    })


    test('creates index routes correctly', () => {
        const contents = nextRoutes(pageRouterStyle)
        const expected = [
            {
                file: 'pages/index.tsx',
                children: undefined,
                path: '/'
            },
            {
                file: 'pages/(excluded)/about.tsx',
                children: undefined,
                path: '/about'
            },
            {
                file: 'pages/(alsoExluded)/legal.tsx',
                children: undefined,
                path: '/legal'
            },

        ]

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe('approuter route generation tests', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app/page.tsx': 'console.log("Hello")',
            './app/folder/page.tsx': 'export const helper = () => {}',
            './app/folder/notARoute.tsx': 'export const helper = () => {}',
            './app/folder/test/(excluded)/route.ts': 'export const helper = () => {}',
            './app/folder/test/_discarded/route.ts': 'export const helper = () => {}',
            './app/folder/test/_discarded/page.tsx': 'export const helper = () => {}',
            './app/[...all]/route.tsx': 'console.log("Hello")',
            './app/nested/[...all]/route.tsx': 'console.log("Hello")',
        })
    })

    test('creates index routes correctly', () => {
        const contents = nextRoutes(appRouterStyle)
        const expected = [
            {file: 'page.tsx', children: undefined, path: '/'},
            {file: 'folder/page.tsx', children: undefined, path: '/folder'},
            {file: 'folder/test/(excluded)/route.ts', children: undefined, path: '/folder/test'},
            {file: '[...all]/route.tsx', children: undefined, path: "/*"},
            {file: 'nested/[...all]/route.tsx', children: undefined, path: "/nested/*"}
        ]

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe('pagerouter route generation tests', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app/pages/index.tsx': 'console.log("Hello")',
            './app/pages/folder/index.tsx': 'export const helper = () => {}',
            './app/pages/folder/stillARoute.tsx': 'export const helper = () => {}',
            './app/pages/folder/test/(excluded)/route.ts': 'export const helper = () => {}',
            './app/pages/folder/test/(excluded)/index.tsx': 'export const helper = () => {}',
            './app/pages/folder/test/_discarded/route.ts': 'export const helper = () => {}',
            './app/pages/folder/test/_discarded/page.tsx': 'export const helper = () => {}',
        })
    })

    test('creates index routes correctly', () => {
        const contents = nextRoutes(pageRouterStyle)
        const expected = [
            {file: 'pages/index.tsx', children: undefined, path: '/'},
            {file: 'pages/folder/index.tsx', children: undefined, path: '/folder'},
            {file: 'pages/folder/stillARoute.tsx', children: undefined, path: '/folder/stillARoute'},
            {file: 'pages/folder/test/(excluded)/index.tsx', children: undefined, path: '/folder/test'},
            {file: 'pages/folder/test/(excluded)/route.ts', children: undefined, path: '/folder/test/route'},
        ]

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe('complex Route generation tests', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Setup test file structure
        vol.fromJSON({
            './app': null,
            './app/pages': null,
            './app/pages/[...catchall].tsx': 'export default () => {}',
            './app/pages/index.tsx': 'export default () => {}',
            './app/pages/remix.tsx': 'export default () => {}',
            './app/pages/testpage.tsx': 'export default () => {}',

            // API directory structure
            './app/pages/api': null,
            './app/pages/api/auth': null,
            './app/pages/api/auth/[...all].ts': 'export default () => {}',
            './app/pages/api/theme': null,
            './app/pages/api/theme/set.ts': 'export default () => {}',

            // Login directory
            './app/pages/login': null,
            './app/pages/login/index.tsx': 'export default () => {}',

            // Signup directory
            './app/pages/signup': null,
            './app/pages/signup/index.tsx': 'export default () => {}',

            // Test directory complex structure
            './app/pages/testdir': null,
            './app/pages/testdir/_layout.tsx': 'export default () => {}',
            './app/pages/testdir/testpage.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]': null,
            './app/pages/testdir/[testing]/_layout.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]/index.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]/[[nested]]': null,
            './app/pages/testdir/[testing]/[[nested]]/index.tsx': 'export default () => {}',
            './app/pages/testdir/[testing]/[[nested]]/test': null,
            './app/pages/testdir/[testing]/[[nested]]/test/index.tsx': 'export default () => {}',

            // Test excluded dir
            './app/pages/testdir/(testexclude)': null,
            './app/pages/testdir/(testexclude)/movedUp.tsx': 'export default () => {}',
        })
    })

    test('generates route config correctly', () => {
        const contents = nextRoutes({...pageRouterStyle, print: "info"});
        const contents2 = nextRoutes({...pageRouterStyle, print: "tree"});

        assert.sameDeepMembers(contents, contents2, 'same members')

        const expected = [
            {
                file: 'pages/[...catchall].tsx',
                children: undefined,
                path: '/*'
            },
            {
                file: 'pages/api/auth/[...all].ts',
                children: undefined,
                path: '/api/auth/*'
            },
            {
                file: 'pages/api/theme/set.ts',
                children: undefined,
                path: '/api/theme/set'
            },
            {
                file: 'pages/login/index.tsx',
                children: undefined,
                path: '/login'
            },
            {
                file: 'pages/remix.tsx',
                children: undefined,
                path: '/remix'
            },
            {
                file: 'pages/signup/index.tsx',
                children: undefined,
                path: '/signup'
            },
            {
                file: 'pages/testpage.tsx',
                children: undefined,
                path: '/testpage'
            },
            {
                file: 'pages/testdir/_layout.tsx',
                children: [
                    {
                        "file": "pages/testdir/[testing]/_layout.tsx",
                        "children": [
                            {
                                "file": "pages/testdir/[testing]/index.tsx",
                                "path": "/testdir/:testing",
                                "children": undefined
                            },
                            {
                                "file": "pages/testdir/[testing]/[[nested]]/index.tsx",
                                "path": "/testdir/:testing/:nested?",
                                "children": undefined
                            },
                            {
                                "file": "pages/testdir/[testing]/[[nested]]/test/index.tsx",
                                "path": "/testdir/:testing/:nested?/test",
                                "children": undefined
                            }
                        ]
                    },
                    {
                        "file": "pages/testdir/(testexclude)/movedUp.tsx",
                        "path": "/testdir/movedUp",
                        "children": undefined
                    },
                    {
                        "file": "pages/testdir/testpage.tsx",
                        "path": "/testdir/testpage",
                        "children": undefined
                    }
                ]
            },
            {
                file: 'pages/index.tsx',
                children: undefined,
                path: '/'
            },
        ].sort((a, b) => {
            const pathA = a.path ?? ''; // Default to empty string if `path` is undefined
            const pathB = b.path ?? '';
            return pathA.localeCompare(pathB);
        });

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe('different baseDir route generation tests', () => {
    // let vol = new Volume();

    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app': null,
            './app/diff': null,
            './app/diff/index.tsx': 'console.log("Hello")',
            './app/diff/utils': null,
            './app/diff/utils/index.tsx': 'export const helper = () => {}',
        })
    })


    test('creates index routes correctly', () => {
        const contents = nextRoutes({...pageRouterStyle, folderName: 'diff'})
        const expected = [
            {
                file: 'diff/index.tsx',
                children: undefined,
                path: '/'
            },
            {
                file: 'diff/utils/index.tsx',
                children: undefined,
                path: '/utils'
            }
        ];

        assert.sameDeepMembers(contents, expected, 'same members')
    })
})

describe('AUTOGENERATED BY RIDER nextRoutes', () => {
    beforeEach(() => {
        vol.reset();
    });

    test('generates simple index route', () => {
        vol.fromJSON({
            './app/pages/index.tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {file: 'pages/index.tsx', children: undefined, path: '/'},
        ];

        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('generates simple index route from different folder', () => {
        vol.fromJSON({
            './app/pages/index.tsx': 'export default () => {}',
            './app/different/index.tsx': 'export default () => {}',
        });

        const routes = nextRoutes({...pageRouterStyle, folderName: 'different'});
        const expected = [
            {file: 'different/index.tsx', children: undefined, path: '/'},
        ];

        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('handles nested routes with layout files', () => {
        vol.fromJSON({
            './app/pages/_layout.tsx': 'export default () => {}',
            './app/pages/nested/index.tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {
                file: 'pages/_layout.tsx',
                children: [
                    {
                        file: 'pages/nested/index.tsx',
                        path: '/nested',
                        children: undefined
                    },
                ],
            },
        ];
        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('excludes files starting with underscores except _layout', () => {
        vol.fromJSON({
            './app/pages/_hidden.tsx': 'export default () => {}',
            './app/pages/_layout.tsx': 'export default () => {}',
            './app/pages/index.tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {
                file: 'pages/_layout.tsx',
                children: [
                    {
                        file: 'pages/index.tsx',
                        path: '/',
                        children: undefined
                    }
                ],
            },
        ];

        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('parses dynamic routes correctly', () => {
        vol.fromJSON({
            './app/pages/[dynamic].tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {file: 'pages/[dynamic].tsx', children: undefined, path: '/:dynamic'},
        ];

        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('parses dynamic optional routes correctly', () => {
        vol.fromJSON({
            './app/pages/[[optional]].tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {file: 'pages/[[optional]].tsx', children: undefined, path: '/:optional?'},
        ];

        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('handles catch-all routes', () => {
        vol.fromJSON({
            './app/pages/[...all].tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {file: 'pages/[...all].tsx', children: undefined, path: '/*'},
        ];

        assert.sameDeepMembers(routes, expected, 'same members')
    });

    test('ignores excluded folders or files', () => {
        vol.fromJSON({
            './app/pages/(excluded)/file.tsx': 'export default () => {}',
            './app/pages/index.tsx': 'export default () => {}',
        });

        const routes = nextRoutes(pageRouterStyle);
        const expected = [
            {file: 'pages/index.tsx', children: undefined, path: '/'},
            {file: 'pages/(excluded)/file.tsx', children: undefined, path: '/file'},
        ];
        assert.sameDeepMembers(routes, expected, 'same members')
    });
});




describe('concert routes structure', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app/routes/concerts/(groupA)/layout.tsx': 'console.log("Hello")',
            './app/routes/concerts/(groupA)/trending.tsx': 'export const helper = () => {}',
            './app/routes/concerts/(groupA)/index.tsx': 'export const helper = () => {}',
            './app/routes/concerts/(groupB)/mine/layout.tsx': 'console.log("Hello")',
            './app/routes/concerts/(groupB)/mine/index.tsx': 'export const helper = () => {}',
            './app/root.tsx': 'console.log("Hello")'
        })
    })

    test('creates concert routes correctly', () => {
        const contents = nextRoutes({
            ...pageRouterStyle,
            folderName: "routes",
            layoutFileName: "layout",
            print: "tree",
        });
        const expected = [
            layout("routes/concerts/(groupA)/layout.tsx", [
                route("/concerts", "routes/concerts/(groupA)/index.tsx"),
                route("/concerts/trending", "routes/concerts/(groupA)/trending.tsx"),
            ]),
            layout("routes/concerts/(groupB)/mine/layout.tsx", [
                route("/concerts/mine", "routes/concerts/(groupB)/mine/index.tsx"),
            ])
        ]

        expect(deepSortByPath(contents)).toEqual(deepSortByPath(expected))
    })
})

describe('concert routes structure without grouping', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure
        vol.fromJSON({
            './app/routes/concerts/layout.tsx': 'console.log("Hello")',
            './app/routes/concerts/trending.tsx': 'export const helper = () => {}',
            './app/routes/concerts/index.tsx': 'export const helper = () => {}',
            './app/routes/concerts/{mine}/layout.tsx': 'console.log("Hello")',
            './app/routes/concerts/{mine}/index.tsx': 'export const helper = () => {}',
            './app/root.tsx': 'console.log("Hello")'
        })
    })

    test('creates concert routes correctly', () => {
        const contents = nextRoutes({
            ...pageRouterStyle,
            folderName: "routes",
            layoutFileName: "layout",
            print: "tree",
        });
        const expected = [
            layout("routes/concerts/layout.tsx", [
                route("/concerts", "routes/concerts/index.tsx"),
                route("/concerts/trending", "routes/concerts/trending.tsx"),
            ]),
            layout("routes/concerts/{mine}/layout.tsx", [
                route("/concerts/mine", "routes/concerts/{mine}/index.tsx"),
            ])
        ]

        expect(deepSortByPath(contents)).toEqual(deepSortByPath(expected))
    })
})

describe('comprehensive route combinations', () => {
    beforeEach(() => {
        // Reset volume before each test
        vol.reset();

        // Create a mock file structure with all route conventions
        vol.fromJSON({
            // Catch-all routes within dynamic routes
            './app/pages/[category]/[...products].tsx': 'export default () => {}',

            // Multiple dynamic parameters in the same path segment
            './app/pages/[category]/[productId].tsx': 'export default () => {}',

            // Optional parameters followed by regular parameters
            './app/pages/[[optional]]/required.tsx': 'export default () => {}',

            // Hoisted folders with dynamic parameters
            './app/pages/{section}/[id].tsx': 'export default () => {}',

            // Comprehensive test with all conventions
            './app/pages/{section}/_layout.tsx': 'export default () => {}',
            './app/pages/{section}/index.tsx': 'export default () => {}',
            './app/pages/{section}/[category]/_layout.tsx': 'export default () => {}',
            './app/pages/{section}/[category]/index.tsx': 'export default () => {}',
            './app/pages/{section}/[category]/[[optional]]/index.tsx': 'export default () => {}',
            './app/pages/{section}/[category]/[[optional]]/[...rest].tsx': 'export default () => {}',
            './app/pages/{section}/(group)/nested.tsx': 'export default () => {}',
        })
    })

    test('handles catch-all routes within dynamic routes', () => {
        const routes = nextRoutes(pageRouterStyle);
        const categoryProductsRoute = routes.find(r => r.path === '/:category/*');

        expect(categoryProductsRoute).toBeDefined();
        expect(categoryProductsRoute?.file).toBe('pages/[category]/[...products].tsx');
    });

    test('handles multiple dynamic parameters in the same path segment', () => {
        const routes = nextRoutes(pageRouterStyle);
        const categoryProductRoute = routes.find(r => r.path === '/:category/:productId');

        expect(categoryProductRoute).toBeDefined();
        expect(categoryProductRoute?.file).toBe('pages/[category]/[productId].tsx');
    });

    test('handles optional parameters followed by regular parameters', () => {
        const routes = nextRoutes(pageRouterStyle);
        const optionalRequiredRoute = routes.find(r => r.path === '/:optional?/required');

        expect(optionalRequiredRoute).toBeDefined();
        expect(optionalRequiredRoute?.file).toBe('pages/[[optional]]/required.tsx');
    });

    test('handles hoisted folders with dynamic parameters', () => {
        const routes = nextRoutes(pageRouterStyle);

        // Find the layout for the hoisted section
        const sectionLayout = routes.find(r => r.file === 'pages/{section}/_layout.tsx');
        expect(sectionLayout).toBeDefined();
        expect(sectionLayout?.children).toBeDefined();

        if (sectionLayout?.children) {
            // Find the dynamic route within the layout's children
            const hoistedDynamicRoute = sectionLayout.children.find(r => r.file === 'pages/{section}/[id].tsx');

            expect(hoistedDynamicRoute).toBeDefined();
            if (hoistedDynamicRoute) {
                // Check the path
                expect(hoistedDynamicRoute.path).toBeTruthy();
                expect(hoistedDynamicRoute.path).toContain(':id');
                expect(hoistedDynamicRoute.file).toBe('pages/{section}/[id].tsx');
            }
        }
    });

    test('handles comprehensive combination of all route conventions', () => {
        const routes = nextRoutes(pageRouterStyle);

        // Find the layout for the hoisted section
        const sectionLayout = routes.find(r => r.file === 'pages/{section}/_layout.tsx');
        expect(sectionLayout).toBeDefined();
        expect(sectionLayout?.children).toBeDefined();

        if (sectionLayout?.children) {
            // Check for index route
            const indexRoute = sectionLayout.children.find(r => r.path === '/section');
            expect(indexRoute).toBeDefined();
            expect(indexRoute?.file).toBe('pages/{section}/index.tsx');

            // Check for category layout
            const categoryLayout = sectionLayout.children.find(r => r.file === 'pages/{section}/[category]/_layout.tsx');
            expect(categoryLayout).toBeDefined();
            expect(categoryLayout?.children).toBeDefined();

            if (categoryLayout?.children) {
                // Check for category index route
                const categoryIndex = categoryLayout.children.find(r => r.path === '/section/:category');
                expect(categoryIndex).toBeDefined();
                expect(categoryIndex?.file).toBe('pages/{section}/[category]/index.tsx');

                // Check for optional parameter route
                const optionalRoute = categoryLayout.children.find(r => r.path === '/section/:category/:optional?');
                expect(optionalRoute).toBeDefined();
                expect(optionalRoute?.file).toBe('pages/{section}/[category]/[[optional]]/index.tsx');

                // Check for catch-all route within optional parameter
                const catchAllRoute = categoryLayout.children.find(r => r.path === '/section/:category/:optional?/*');
                expect(catchAllRoute).toBeDefined();
                expect(catchAllRoute?.file).toBe('pages/{section}/[category]/[[optional]]/[...rest].tsx');
            }

            // Check for grouped route
            const groupedRoute = sectionLayout.children.find(r => r.path === '/section/nested');
            expect(groupedRoute).toBeDefined();
            expect(groupedRoute?.file).toBe('pages/{section}/(group)/nested.tsx');
        }
    });

    test('compares nextRoutes output with actual react-router-v7 routes', () => {
        // Generate routes using nextRoutes
        const generatedRoutes = nextRoutes(pageRouterStyle);

        // Construct actual react-router-v7 routes
        const actualRoutes = [
            // Catch-all routes within dynamic routes
            route('/:category/*', 'pages/[category]/[...products].tsx'),

            // Multiple dynamic parameters in the same path segment
            route('/:category/:productId', 'pages/[category]/[productId].tsx'),

            // Optional parameters followed by regular parameters
            route('/:optional?/required', 'pages/[[optional]]/required.tsx'),

            // Comprehensive test with all conventions
            layout('pages/{section}/_layout.tsx', [
                route('/section', 'pages/{section}/index.tsx'),
                route('/section/:id', 'pages/{section}/[id].tsx'),
                layout('pages/{section}/[category]/_layout.tsx', [
                    route('/section/:category', 'pages/{section}/[category]/index.tsx'),
                    route('/section/:category/:optional?', 'pages/{section}/[category]/[[optional]]/index.tsx'),
                    route('/section/:category/:optional?/*', 'pages/{section}/[category]/[[optional]]/[...rest].tsx'),
                ]),
                route('/section/nested', 'pages/{section}/(group)/nested.tsx'),
            ]),
        ];

        // Compare the routes
        // We need to sort both arrays to ensure consistent comparison
        const sortedGeneratedRoutes = deepSortByPath([...generatedRoutes]);
        const sortedActualRoutes = deepSortByPath([...actualRoutes]);

        // Check if all actual routes are present in generated routes
        // This test might fail if the implementation changes, which is okay according to the issue description
        expect(sortedGeneratedRoutes).toEqual(sortedActualRoutes);
    });
})
