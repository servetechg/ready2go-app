// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ["dist/*"],
  },
  {
    // eslint-config-expo 57 enables the React Compiler hook rules. They flag
    // pre-existing patterns rather than upgrade regressions, so they are
    // reported as warnings pending a dedicated cleanup pass.
    rules: {
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
    },
  },
  {
    // Config and tooling scripts run in Node, not in the app bundle.
    files: ["app.config.js", "scripts/**"],
    languageOptions: {
      globals: {
        __dirname: "readonly",
        module: "writable",
        process: "readonly",
        require: "readonly",
      },
    },
    rules: {
      "import/no-unresolved": "off",
    },
  },
]);
