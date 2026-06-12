/**
 * Prettier configuration — MundoLimpio React Native.
 *
 * WHAT: Formateo consistente de código TypeScript/TSX.
 * WHY: Un estilo uniforme reduce fricción en code review y evita
 *      diffs inflados por diferencias de formato.
 * BENEFITS: CI rechaza PRs con formato inconsistente vía `prettier --check`.
 */
module.exports = {
  semi: true,
  singleQuote: true,
  trailingComma: 'all',
  bracketSpacing: false,
  arrowParens: 'always',
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
};
