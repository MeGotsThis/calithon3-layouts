module.exports = {
  "extends": ["eslint:recommended", "google"],
  "plugins": [
    "html"
  ],
  "settings": {
      "html/indent": "+4"
  },
  "rules": {
    "require-jsdoc": 0,
    "no-unused-vars": 0,
    "new-cap": [2, {
      "capIsNewExceptions": [
        "Polymer",
        "Polymer.GestureEventListeners",
        "Polymer.MutableData",
        "nodecg.Replicant",
        "SteppedGradientMixin"
      ]
    }],
    "operator-linebreak": ["error", "after", {
      "overrides": {
        "+": "before",
        "-": "before",
        "*": "before",
        "/": "before",
        "%": "before",
        "**": "before",
        "||": "before",
        "&&": "before",
        "==": "ignore",
        "===": "ignore",
        "!=": "ignore",
        "!==": "ignore",
        ">": "before",
        "<": "before",
        ">=": "before",
        "<=": "before",
        "&": "before",
        "|": "before",
        "^": "before",
        ">>": "none",
        "<<": "none",
        "!": "none",
        "~": "none",
      }
    }]
  },
};
