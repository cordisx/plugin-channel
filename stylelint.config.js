export default {
  extends: ["stylelint-config-standard"],
  plugins: ["@projectwallace/stylelint-plugin"],
  rules: {
    // State selectors intentionally follow their base rules in cascade order.
    "no-descending-specificity": null,
    "projectwallace/max-lines-of-code": 1000,
    "selector-max-compound-selectors": 5,
    "selector-max-specificity": "0,5,0",
  },
};
