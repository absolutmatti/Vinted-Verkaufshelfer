import js from '@eslint/js';
import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**', 'dev-dist/**', 'node_modules/**', '.playwright-cli/**', '**/*.ts', '**/*.tsx'],
  },
  js.configs.recommended,
  firebaseRulesPlugin.configs['flat/recommended'],
];
