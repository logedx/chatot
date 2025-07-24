import eslint from '@eslint/js'
import stylistic from '@stylistic/eslint-plugin'

import typescript_eslint from 'typescript-eslint'




export default typescript_eslint.config(
	eslint.configs.recommended,
	stylistic.configs.recommended,

	...typescript_eslint.configs.strictTypeChecked,
	...typescript_eslint.configs.stylisticTypeChecked,

	{
		files: ['**/*.ts'],

		languageOptions: {
			parserOptions: {
				project: true,
				projectService: true,

				sourceType: 'module',
				ecmaVersion: 'latest',

			},

		},

		plugins: {
			'@stylistic': stylistic,

		},

		rules: {
			"@stylistic/array-bracket-newline": [
				"error",
				"consistent"
			],
			"@stylistic/array-bracket-spacing": [
				"error",
				"never"
			],
			"@stylistic/arrow-parens": [
				"warn",
				"as-needed"
			],
			"@stylistic/arrow-spacing": "error",
			"@stylistic/block-spacing": "error",
			"@stylistic/brace-style": [
				"error",
				"allman",
				{
					"allowSingleLine": false
				}
			],
			"@stylistic/comma-dangle": [
				"error",
				"always-multiline"
			],
			"@stylistic/comma-spacing": "error",
			"@stylistic/computed-property-spacing": "warn",
			"@stylistic/dot-location": [
				"error",
				"property"
			],
			"@stylistic/function-call-spacing": [
				"error",
				"never"
			],
			"@stylistic/function-paren-newline": [
				"warn",
				"consistent"
			],
			"@stylistic/generator-star-spacing": [
				"error",
				"both"
			],
			"@stylistic/implicit-arrow-linebreak": "error",
			"@stylistic/indent": [
				"error",
				"tab",
				{
					"ArrayExpression": "first",
					"CallExpression": {
						"arguments": "first"
					},
					"FunctionDeclaration": {
						"parameters": "first"
					},
					"FunctionExpression": {
						"parameters": "first"
					},
					"ignoredNodes": [
						"TSTypeAnnotation",
						"TSTypeParameterInstantiation",
						"JSXOpeningElement"
					],
					"ImportDeclaration": "first",
					"ObjectExpression": "first",
					"offsetTernaryExpressions": true,
					"SwitchCase": 1,
					"VariableDeclarator": "first"
				}
			],
			"@stylistic/indent-binary-ops": [
				"error",
				"tab"
			],
			"@stylistic/key-spacing": [
				"error",
				{
					"align": "colon",
					"beforeColon": false,
					"mode": "minimum"
				}
			],
			"@stylistic/keyword-spacing": "error",
			"@stylistic/line-comment-position": "error",
			"@stylistic/linebreak-style": [
				"error",
				"unix"
			],
			"@stylistic/lines-around-comment": [
				"warn",
				{
					"allowArrayStart": true,
					"allowBlockStart": true,
					"allowClassStart": true,
					"allowObjectStart": true,
					"beforeBlockComment": false,
					"beforeLineComment": true
				}
			],
			"@stylistic/lines-between-class-members": "error",
			"@stylistic/max-statements-per-line": "error",
			"@stylistic/multiline-ternary": [
				"error",
				"always-multiline"
			],
			"@stylistic/new-parens": "error",
			"@stylistic/newline-per-chained-call": "error",
			"@stylistic/no-floating-decimal": "error",
			"@stylistic/no-mixed-operators": "error",
			"@stylistic/no-mixed-spaces-and-tabs": [
				"warn",
				"smart-tabs"
			],
			"@stylistic/no-multi-spaces": [
				"warn",
				{
					"exceptions": {
						"ImportAttribute": true,
						"ImportDeclaration": true,
						"Property": true,
						"TSPropertySignature": true
					}
				}
			],
			"@stylistic/no-multiple-empty-lines": "off",
			"@stylistic/no-tabs": "off",
			"@stylistic/no-trailing-spaces": [
				"warn",
				{
					"ignoreComments": true
				}
			],
			"@stylistic/no-whitespace-before-property": "error",
			"@stylistic/object-curly-newline": [
				"error",
				{
					"ExportDeclaration": "never",
					"ImportDeclaration": "never",
					"ObjectPattern": {
						"multiline": true
					}
				}
			],
			"@stylistic/object-curly-spacing": [
				"warn",
				"always"
			],
			"@stylistic/operator-linebreak": [
				"error",
				"before"
			],
			"@stylistic/padded-blocks": [
				"error",
				"end"
			],
			"@stylistic/padding-line-between-statements": [
				"error",
				{
					"blankLine": "always",
					"next": "*",
					"prev": [
						"var",
						"let",
						"const",
						"function",
						"import",
						"iife",
						"block",
						"block-like"
					]
				},
				{
					"blankLine": "always",
					"next": [
						"if",
						"try",
						"throw",
						"switch",
						"break",
						"for",
						"do",
						"while",
						"continue",
						"with",
						"export",
						"return",
						"function",
						"iife"
					],
					"prev": "*"
				},
				{
					"blankLine": "any",
					"next": "import",
					"prev": "import"
				},
				{
					"blankLine": "any",
					"next": [
						"var",
						"let",
						"const"
					],
					"prev": [
						"var",
						"let",
						"const"
					]
				}
			],
			"@stylistic/quote-props": [
				"error",
				"consistent"
			],
			"@stylistic/quotes": [
				"error",
				"single",
				{
					"allowTemplateLiterals": "always"
				}
			],
			"@stylistic/rest-spread-spacing": "error",
			"@stylistic/semi": [
				"error",
				"never"
			],
			"@stylistic/semi-spacing": "warn",
			"@stylistic/space-before-blocks": "warn",
			"@stylistic/space-before-function-paren": [
				"warn",
				"always"
			],
			"@stylistic/space-in-parens": [
				"warn",
				"never",
				{
					"exceptions": [
						"()"
					]
				}
			],
			"@stylistic/space-infix-ops": "warn",
			"@stylistic/spaced-comment": "warn",
			"@stylistic/switch-colon-spacing": "warn",
			"@stylistic/template-curly-spacing": "warn",
			"@stylistic/template-tag-spacing": [
				"warn",
				"always"
			],
			"@stylistic/type-annotation-spacing": "off",
			"@stylistic/type-generic-spacing": "off",
			"@stylistic/wrap-iife": [
				"error",
				"inside"
			],
			"@stylistic/wrap-regex": "error",
			"@stylistic/yield-star-spacing": [
				"error",
				"both"
			],
			"@typescript-eslint/array-type": [
				"warn",
				{
					"default": "array-simple"
				}
			],
			"@typescript-eslint/await-thenable": "off",
			"@typescript-eslint/consistent-generic-constructors": "error",
			"@typescript-eslint/consistent-indexed-object-style": "error",
			"@typescript-eslint/consistent-type-assertions": [
				"error",
				{
					"assertionStyle": "as",
					"objectLiteralTypeAssertions": "allow"
				}
			],
			"@typescript-eslint/consistent-type-definitions": [
				"error",
				"type"
			],
			"@typescript-eslint/consistent-type-exports": "error",
			"@typescript-eslint/dot-notation": "warn",
			"@typescript-eslint/explicit-function-return-type": [
				"error",
				{
					"allowExpressions": true
				}
			],
			"@typescript-eslint/explicit-module-boundary-types": "error",
			"@typescript-eslint/method-signature-style": [
				"warn",
				"method"
			],
			"@typescript-eslint/naming-convention": [
				"error",
				{
					"format": [
						"snake_case"
					],
					"leadingUnderscore": "allow",
					"selector": "default",
					"trailingUnderscore": "allow"
				},
				{
					"format": [
						"snake_case",
						"UPPER_CASE"
					],
					"leadingUnderscore": "allowSingleOrDouble",
					"selector": "variable",
					"trailingUnderscore": "allow"
				},
				{
					"format": [
						"PascalCase"
					],
					"selector": "typeLike"
				}
			],
			"@typescript-eslint/no-confusing-non-null-assertion": "error",
			"@typescript-eslint/no-duplicate-type-constituents": "warn",
			"@typescript-eslint/no-dynamic-delete": "off",
			"@typescript-eslint/no-extraneous-class": "off",
			"@typescript-eslint/no-import-type-side-effects": "error",
			"@typescript-eslint/no-inferrable-types": "error",
			"@typescript-eslint/no-misused-promises": "off",
			"@typescript-eslint/no-non-null-assertion": "off",
			"@typescript-eslint/no-require-imports": "error",
			"@typescript-eslint/no-shadow": "error",
			"@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
			"@typescript-eslint/no-unnecessary-condition": "off",
			"@typescript-eslint/no-unnecessary-type-parameters": "off",
			"@typescript-eslint/no-unused-vars": "warn",
			"@typescript-eslint/no-useless-constructor": "off",
			"@typescript-eslint/prefer-function-type": "error",
			"@typescript-eslint/prefer-optional-chain": "error",
			"@typescript-eslint/prefer-reduce-type-parameter": "off",
			"@typescript-eslint/require-await": "warn",
			"@typescript-eslint/restrict-template-expressions": [
				"warn",
				{
					"allowBoolean": true,
					"allowNullish": true,
					"allowNumber": true,
					"allowRegExp": true
				}
			],
			"@typescript-eslint/strict-boolean-expressions": "error",
			"@typescript-eslint/triple-slash-reference": "error",
			"array-callback-return": "error",
			"complexity": "error",
			"consistent-return": "error",
			"consistent-this": [
				"error",
				"self"
			],
			"curly": "error",
			"eqeqeq": "error",
			"id-denylist": [
				"error",
				"error",
				"list"
			],
			"id-match": [
				"error",
				"^(\\w|\\$)+([A-Z]+[a-z]*)*_*$",
				{
					"ignoreDestructuring": true,
					"onlyDeclarations": false,
					"properties": true
				}
			],
			"init-declarations": "error",
			"max-depth": "error",
			"max-nested-callbacks": [
				"error",
				{
					"max": 3
				}
			],
			"max-params": [
				"error",
				{
					"max": 4
				}
			],
			"new-cap": [
				"error",
				{
					"capIsNew": false,
					"properties": false
				}
			],
			"no-array-constructor": "error",
			"no-caller": "error",
			"no-continue": "off",
			"no-div-regex": "error",
			"no-duplicate-imports": "error",
			"no-eq-null": "error",
			"no-eval": "error",
			"no-ex-assign": "off",
			"no-extend-native": "error",
			"no-implicit-coercion": "error",
			"no-implicit-globals": "error",
			"no-implied-eval": "error",
			"no-inline-comments": "error",
			"no-labels": "error",
			"no-lone-blocks": "error",
			"no-lonely-if": "error",
			"no-multi-assign": "error",
			"no-negated-condition": "error",
			"no-nested-ternary": "error",
			"no-new-func": "error",
			"no-new-wrappers": "error",
			"no-object-constructor": "error",
			"no-octal-escape": "error",
			"no-plusplus": [
				"error",
				{
					"allowForLoopAfterthoughts": true
				}
			],
			"no-proto": "error",
			"no-return-assign": "error",
			"no-script-url": "error",
			"no-self-compare": "error",
			"no-shadow": "off",
			"no-throw-literal": "error",
			"no-unexpected-multiline": "off",
			"no-unmodified-loop-condition": "error",
			"no-unneeded-ternary": "error",
			"no-unused-expressions": [
				"error",
				{
					"allowShortCircuit": true,
					"allowTaggedTemplates": true,
					"allowTernary": true
				}
			],
			"no-unused-private-class-members": "off",
			"no-unused-vars": "off",
			"no-use-before-define": [
				"error",
				{
					"classes": false,
					"functions": false
				}
			],
			"no-useless-call": "error",
			"no-useless-computed-key": "error",
			"no-useless-concat": "error",
			"no-useless-constructor": "off",
			"no-useless-rename": "error",
			"no-useless-return": "error",
			"no-var": "error",
			"no-void": "error",
			"object-shorthand": "error",
			"one-var": [
				"error",
				"never"
			],
			"operator-assignment": [
				"error",
				"never"
			],
			"prefer-const": "off",
			"prefer-object-spread": "warn",
			"prefer-promise-reject-errors": "error",
			"prefer-rest-params": "error",
			"prefer-template": "error",
			"unicode-bom": "error",
			"yoda": [
				"warn",
				"never",
				{
					"onlyEquality": true
				}
			]
		}


	},

)