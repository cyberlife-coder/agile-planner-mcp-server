module.exports = {
  "env": {
    "node": true,
    "es6": true,
    "jest": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 2020
  },
  "rules": {
    "no-console": "off",
    "no-unused-vars": "warn",
    "no-inner-declarations": "warn",
    "no-undef": "warn"
  },
  "globals": {
    "backlogGenerator": "writable"
  }
};
