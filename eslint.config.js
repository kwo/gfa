import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

// https://eslint.org/docs/latest/use/configure/configuration-files#configuration-objects
// https://github.com/typescript-eslint/typescript-eslint/tree/main/packages/eslint-plugin/src/configs

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
        ecmaFeatures: {
          impliedStrict: true,
          jsx: false
        }
      },
    },
  },
  {
    ignores: ['build/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['**/*.js', '**/*.config.{js,ts,mjs,mts}'],
    ...tseslint.configs.disableTypeChecked,
  },
  {
    rules: {
      "camelcase": ["warn"],
      "class-methods-use-this": ["warn"],
      "consistent-return": ["error"],
      "consistent-this": ["error", "self"],
      "curly": ["error"],
      "dot-notation": ["warn"],
      "no-duplicate-imports": ["warn"],
      "no-irregular-whitespace": ["error"],
      "no-shadow": ["error"],
      "no-use-before-define": ["warn"],
      "no-var": ["error"],
      "block-scoped-var": ["error"],
      "yoda": ["warn", "never"],
      "@typescript-eslint/no-unused-vars": ["error"]
    },
  },
);
