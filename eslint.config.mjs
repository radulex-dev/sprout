import css from '@eslint/css';
import eslintPluginBetterTailwindcss from 'eslint-plugin-better-tailwindcss';
import reactPlugin from 'eslint-plugin-react';
import configure, { configs } from '@onefinity/eslint-config';
import { tailwind4 } from 'tailwind-csstree';

import propsInline from './eslint-rules/jsx-props-inline/index.js'; // eslint-disable-line @onefinity/eslint-config/import-grouping
import componentPropsString from './eslint-rules/use-component-props-string/index.js';
import noLiteralClassname from './eslint-rules/no-literal-classname/index.js';
import noInlineObjectLiteral from './eslint-rules/no-inline-object-literal/index.js';
import noInlineHandlers from './eslint-rules/no-inline-handlers/index.js';
import noClassnameTernary from './eslint-rules/no-classname-ternary/index.js';

const JS_TS_FILE_PATTERNS = ['**/*.{js,jsx,cjs,mjs,ts,tsx}'];

const isTailwindConfig = (entry) => {
    const hasTailwindPlugin = Boolean(entry.plugins?.['better-tailwindcss']);
    const hasTailwindRule = Object.keys(entry.rules ?? {}).some((rule) => {
        return rule.startsWith('better-tailwindcss/');
    });

    return hasTailwindPlugin || hasTailwindRule;
};

const config = configure([{
    ignores: [
        '**/*.d.ts',
        '**/*.js',
        'eslint-rules/**',
        '.next/**',
        'src/lib/db/auth-schema.ts'
    ]
}, configs.react, {
    plugins: {
        react: reactPlugin,
        sprout: {
            rules: {
                'jsx-props-inline': propsInline,
                'use-component-props-string': componentPropsString,
                'no-literal-classname': noLiteralClassname,
                'no-inline-object-literal': noInlineObjectLiteral,
                'no-inline-handlers': noInlineHandlers,
                'no-classname-ternary': noClassnameTernary
            }
        }
    },
    settings: {
        react: {
            version: '19.2.7'
        }
    },
    rules: {
        'react/react-in-jsx-scope': 'off',
        'react/no-unescaped-entities': 'off',
        'react/jsx-fragments': ['error', 'element'],
        '@stylistic/object-curly-spacing': ['error', 'always', {
            emptyObjects: 'never'
        }],
        '@stylistic/object-curly-newline': ['error', {
            ImportDeclaration: 'never'
        }],
        'curly': ['error', 'all'],
        'react/function-component-definition': ['error', {
            namedComponents: 'arrow-function',
            unnamedComponents: 'arrow-function'
        }],
        '@stylistic/jsx-max-props-per-line': 'off',
        '@stylistic/jsx-first-prop-new-line': 'off',
        '@stylistic/jsx-closing-bracket-location': 'off',
        '@/func-style': ['error', 'expression'],
        'object-property-newline': 'off',
        'sprout/jsx-props-inline': 'error',
        'sprout/use-component-props-string': 'error',
        'sprout/no-literal-classname': 'error',
        'sprout/no-inline-object-literal': 'error',
        'sprout/no-inline-handlers': 'error',
        'sprout/no-classname-ternary': 'error',
        '@typescript-eslint/naming-convention': ['error', {
            selector: 'variable',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
            custom: {
                regex: '^.{2,}$',
                match: true
            }
        }, {
            selector: 'parameter',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
            custom: {
                regex: '^.{2,}$',
                match: true
            }
        }, {
            selector: 'parameter',
            modifiers: ['unused'],
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'require',
            trailingUnderscore: 'forbid'
        }, {
            selector: 'function',
            format: ['camelCase', 'PascalCase', 'UPPER_CASE'],
            leadingUnderscore: 'forbid',
            trailingUnderscore: 'forbid',
            custom: {
                regex: '^.{2,}$',
                match: true
            }
        }],
        '@stylistic/padding-line-between-statements': ['error', {
            blankLine: 'always',
            prev: '*',
            next: 'return'
        }],
        'unicorn/catch-error-name': 'off',
        'unicorn/prefer-minimal-ternary': 'off',
        'unicorn/filename-case': ['error', {
            cases: {
                camelCase: true,
                pascalCase: true,
                kebabCase: true
            }
        }],
        '@onefinity/eslint-config/import-grouping': ['error', {
            groups: [{
                matches: /^(?:\w|@\w).*$/.source
            }, {
                label: 'Schema',
                matches: /\/auth-schema/.source
            }, {
                label: 'Constants',
                matches: /\/constants/.source
            }, {
                label: 'Components',
                matches: /\/(components|containers|design-system)/.source
            }, {
                label: 'Helpers',
                matches: /\/helpers/.source
            }, {
                label: 'Hooks',
                matches: /\/hooks/.source
            }, {
                label: 'Services',
                matches: /\/services/.source
            }, {
                label: 'Database',
                matches: /(?:\/lib\/db|\/db\/|\.\/index|\.\/schema)/.source
            }, {
                label: 'Auth',
                matches: /(?:\/lib\/auth|\/auth\/|\.\.\/auth)/.source
            }, {
                label: 'Styles',
                matches: /\.(css|scss)$/.source
            }, {
                label: 'Types',
                matches: /\/types/.source
            }]
        }]
    }
}, {
    // Turbopack requires the proxy matcher to be a static string constant; the
    // rule would force a String.raw template literal (a runtime call) which
    // breaks `next build`.
    files: ['src/proxy.ts'],
    rules: {
        'unicorn/prefer-string-raw': 'off'
    }
}, {
    files: ['src/**/test.unit.{ts,tsx}', 'test/**/*.{ts,tsx}'],
    rules: {
        'no-restricted-imports': ['error', {
            paths: [{
                name: '@testing-library/react',
                importNames: ['fireEvent'],
                message: 'Use userEvent: `const user = userEvent.setup()` then `await user.click(...)` / `await user.type(...)` / `await user.keyboard(...)`. If userEvent genuinely cannot drive it, disable this rule and state the reason.'
            }]
        }]
    }
}, eslintPluginBetterTailwindcss.configs.recommended, {
    settings: {
        'better-tailwindcss': {
            entryPoint: 'src/app/globals.css'
        }
    }
}, {
    files: ['**/*.css'],
    language: 'css/css',
    languageOptions: {
        customSyntax: tailwind4,
        tolerant: true
    },
    plugins: {
        css
    },
    rules: {
        'better-tailwindcss/enforce-consistent-line-wrapping': ['warn', {
            indent: 4,
            printWidth: 104
        }]
    }
}]);

// The shared base config enables JavaScript-only rules (e.g. `unicorn/*`) at the
// top level, which ESLint 10 rejects when the `css/css` language from the block
// above is active. Scope every un-scoped JS/TS rule set to JS/TS files so the
// Tailwind/CSS block is the only thing that applies to `*.css`.
export default config.map((entry) => {
    if (Array.isArray(entry) || entry.files || entry.ignores || isTailwindConfig(entry)) {
        return entry;
    }

    if (entry.rules || entry.languageOptions) {
        return {
            ...entry,
            files: JS_TS_FILE_PATTERNS
        };
    }

    return entry;
});
