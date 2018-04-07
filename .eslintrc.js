module.exports = {
	env: {
		es6: true,
		node: true,
	},
	extends: [
		'eslint:recommended',
	],
	rules: {
		'array-bracket-spacing': ['error', 'never'],
		'brace-style': ['error', 'stroustrup', { 'allowSingleLine': true }],
		'comma-dangle': ['error', 'always-multiline', { 'functions': 'never' }],
		'comma-spacing': ['error', {
			'before': false,
			'after': true,
		}],
		'computed-property-spacing': ['error', 'never'],
		'eqeqeq': ['error', 'always'],
		'indent': ['error', 'tab', {
			'SwitchCase': 1,
			'FunctionDeclaration': { 'parameters': 2 },
		}],
		'key-spacing': ['error', {
			'beforeColon': false,
			'afterColon': true,
			'mode': 'strict',
		}],
		'no-console': 'off',
		'no-shadow': ['error'],
		'no-var': ['error'],
		'object-curly-spacing': ['error', 'always'],
		'quotes': ['error', 'single', { 'avoidEscape': true }],
		'semi': ['error', 'always'],
		'space-before-function-paren': ['error', {
			'anonymous': 'always',
			'named': 'never',
			'asyncArrow': 'always',
		}],
	},
};
