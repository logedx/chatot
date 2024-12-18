import eslint from '@eslint/js'
import typescript_eslint from 'typescript-eslint'

export default typescript_eslint.config(
	eslint.configs.recommended,

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

		rules: {
			'@typescript-eslint/array-type': [
				'warn',
				{
					'default': 'generic',
				},
			],
			'@typescript-eslint/await-thenable': 'off',
			'@typescript-eslint/consistent-generic-constructors': 'error',
			'@typescript-eslint/consistent-indexed-object-style': 'error',
			'@typescript-eslint/consistent-type-assertions': [
				'error',
				{
					'assertionStyle': 'as',
					'objectLiteralTypeAssertions': 'allow',
				},
			],
			'@typescript-eslint/consistent-type-definitions': [
				'error',
				'type',
			],
			'@typescript-eslint/consistent-type-exports': 'error',
			'@typescript-eslint/dot-notation': 'warn',
			'@typescript-eslint/explicit-function-return-type': [
				'error',
				{
					'allowExpressions': true,
				},
			],
			'@typescript-eslint/explicit-module-boundary-types': 'error',
			'@typescript-eslint/naming-convention': [
				'error',
				{
					'format': [
						'snake_case',
					],
					'leadingUnderscore': 'allow',
					'selector': 'default',
					'trailingUnderscore': 'allow',
				},
				{
					'format': [
						'snake_case',
						'UPPER_CASE',
					],
					'leadingUnderscore': 'allowSingleOrDouble',
					'selector': 'variable',
					'trailingUnderscore': 'allow',
				},
				{
					'format': [
						'PascalCase',
					],
					'selector': 'typeLike',
				},
			],
			'@typescript-eslint/no-confusing-non-null-assertion': 'error',
			'@typescript-eslint/no-dynamic-delete': 'off',
			"@typescript-eslint/no-duplicate-type-constituents": "warn",
			'@typescript-eslint/no-extraneous-class': 'off',
			'@typescript-eslint/no-import-type-side-effects': 'error',
			'@typescript-eslint/no-inferrable-types': 'error',
			'@typescript-eslint/no-misused-promises': 'off',
			'@typescript-eslint/no-non-null-assertion': 'off',
			'@typescript-eslint/no-require-imports': 'error',
			'@typescript-eslint/no-shadow': 'error',
			'@typescript-eslint/no-unnecessary-boolean-literal-compare': 'off',
			'@typescript-eslint/no-unnecessary-condition': 'off',
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-useless-constructor': 'off',
			'@typescript-eslint/prefer-optional-chain': 'error',
			'@typescript-eslint/prefer-reduce-type-parameter': 'off',
			'@typescript-eslint/require-await': 'warn',
			'@typescript-eslint/restrict-template-expressions': [
				'warn',
				{
					'allowBoolean': true,
					'allowNullish': true,
					'allowNumber': true,
					'allowRegExp': true,
				},
			],
			'@typescript-eslint/strict-boolean-expressions': 'error',
			'array-bracket-newline': [
				'error',
				'consistent',
			],
			'array-bracket-spacing': [
				'error',
				'never',
			],
			'array-callback-return': 'error',
			'arrow-spacing': 'error',
			'block-spacing': 'error',
			'brace-style': [
				'error',
				'stroustrup',
				{
					'allowSingleLine': false,
				},
			],
			'comma-dangle': [
				'warn',
				'always-multiline',
			],
			'comma-spacing': 'error',
			'complexity': 'error',
			'computed-property-spacing': 'warn',
			'consistent-return': 'error',
			'consistent-this': [
				'error',
				'self',
			],
			'curly': 'error',
			'dot-location': [
				'error',
				'property',
			],
			'eqeqeq': 'error',
			'func-call-spacing': 'error',
			'function-paren-newline': [
				'warn',
				'consistent',
			],
			'generator-star-spacing': [
				'error',
				{
					'after': true,
					'before': true,
				},
			],
			'id-blacklist': [
				'error',
				'list',
			],
			'id-match': [
				'error',
				'^(\\w|\\$)+([A-Z]+[a-z]*)*_*$',
				{
					'ignoreDestructuring': true,
					'onlyDeclarations': false,
					'properties': true,
				},
			],
			'implicit-arrow-linebreak': 'error',
			'indent': [
				'error',
				'tab',
				{
					'SwitchCase': 1,
					'VariableDeclarator': 'first',
				},
			],
			'init-declarations': 'error',
			'key-spacing': 'error',
			'keyword-spacing': 'error',
			'line-comment-position': 'error',
			'lines-around-comment': [
				'error',
				{
					'allowArrayStart': true,
					'allowBlockStart': true,
					'allowClassStart': true,
					'allowObjectStart': true,
					'beforeBlockComment': false,
					'beforeLineComment': true,
				},
			],
			'lines-between-class-members': 'error',
			'max-depth': 'error',
			'max-nested-callbacks': [
				'error',
				{
					'max': 3,
				},
			],
			'max-params': [
				'error',
				{
					'max': 4,
				},
			],
			'max-statements-per-line': 'error',
			'multiline-ternary': [
				'error',
				'always-multiline',
			],
			'new-cap': [
				'error',
				{
					'capIsNew': false,
					'properties': false,
				},
			],
			'new-parens': 'error',
			'newline-per-chained-call': 'error',
			'no-array-constructor': 'error',
			'no-caller': 'error',
			'no-continue': 'off',
			'no-div-regex': 'error',
			'no-duplicate-imports': 'error',
			'no-eq-null': 'error',
			'no-eval': 'error',
			'no-extend-native': 'error',
			'no-floating-decimal': 'error',
			'no-implicit-coercion': 'error',
			'no-implicit-globals': 'error',
			'no-implied-eval': 'error',
			'no-inline-comments': 'error',
			'no-labels': 'error',
			'no-lone-blocks': 'error',
			'no-lonely-if': 'error',
			'no-mixed-operators': 'error',
			'no-multi-assign': 'error',
			'no-multi-spaces': 'warn',
			'no-negated-condition': 'error',
			'no-nested-ternary': 'error',
			'no-new-func': 'error',
			'no-new-object': 'error',
			'no-new-wrappers': 'error',
			'no-octal-escape': 'error',
			'no-plusplus': [
				'error',
				{
					'allowForLoopAfterthoughts': true,
				},
			],
			'no-proto': 'error',
			'no-return-assign': 'error',
			'no-script-url': 'error',
			'no-self-compare': 'error',
			'no-shadow': 'off',
			'no-throw-literal': 'error',
			'no-trailing-spaces': [
				'warn',
				{
					'ignoreComments': true,
				},
			],
			'no-unmodified-loop-condition': 'error',
			'no-unneeded-ternary': 'error',
			'no-unused-expressions': [
				'error',
				{
					'allowShortCircuit': true,
					'allowTaggedTemplates': true,
					'allowTernary': true,
				},
			],
			'no-unused-private-class-members': 'off',
			'no-unused-vars': 'off',
			'no-use-before-define': [
				'error',
				{
					'classes': false,
					'functions': false,
				},
			],
			'no-useless-call': 'error',
			'no-useless-computed-key': 'error',
			'no-useless-concat': 'error',
			'no-useless-constructor': 'off',
			'no-useless-rename': 'error',
			'no-useless-return': 'error',
			'no-var': 'error',
			'no-void': 'error',
			'no-whitespace-before-property': 'error',
			'object-curly-newline': [
				'error',
				{
					'ExportDeclaration': 'never',
					'ImportDeclaration': 'never',
					'ObjectPattern': {
						'multiline': true,
					},
				},
			],
			'object-curly-spacing': [
				'warn',
				'always',
			],
			'object-shorthand': 'error',
			'one-var': [
				'error',
				'never',
			],
			'operator-assignment': [
				'error',
				'never',
			],
			'operator-linebreak': [
				'error',
				'before',
			],
			'padding-line-between-statements': [
				'error',
				{
					'blankLine': 'always',
					'next': '*',
					'prev': [
						'var',
						'let',
						'const',
						'function',
						'import',
						'iife',
						'block',
						'block-like',
					],
				},
				{
					'blankLine': 'always',
					'next': [
						'if',
						'try',
						'throw',
						'switch',
						'break',
						'for',
						'do',
						'while',
						'continue',
						'with',
						'export',
						'return',
						'function',
						'iife',
					],
					'prev': '*',
				},
				{
					'blankLine': 'any',
					'next': 'import',
					'prev': 'import',
				},
				{
					'blankLine': 'any',
					'next': [
						'var',
						'let',
						'const',
					],
					'prev': [
						'var',
						'let',
						'const',
					],
				},
			],
			'prefer-const': 'off',
			'prefer-object-spread': 'warn',
			'prefer-promise-reject-errors': 'error',
			'prefer-rest-params': 'error',
			'prefer-template': 'error',
			'quotes': [
				'error',
				'single',
				{
					'allowTemplateLiterals': true,
				},
			],
			'rest-spread-spacing': 'error',
			'semi': [
				'error',
				'never',
			],
			'semi-spacing': 'warn',
			'space-before-blocks': 'warn',
			'space-before-function-paren': [
				'warn',
				{
					'anonymous': 'always',
					'asyncArrow': 'always',
					'named': 'never',
				},
			],
			'space-in-parens': 'warn',
			'space-infix-ops': 'error',
			'spaced-comment': 'warn',
			'switch-colon-spacing': 'warn',
			'template-curly-spacing': 'warn',
			'template-tag-spacing': [
				'warn',
				'always',
			],
			'unicode-bom': 'error',
			'wrap-iife': [
				'error',
				'inside',
			],
			'wrap-regex': 'error',
			'yield-star-spacing': [
				'error',
				'both',
			],
			'yoda': [
				'warn',
				'never',
				{
					'onlyEquality': true,
				},
			],

		},


	},

)