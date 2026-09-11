import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/*
 * Flat config de ESLint 10. eslint-config-next 16 ya exporta arrays de flat
 * config, así que no hace falta el puente FlatCompat de las versiones viejas.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js"],
  },
];

export default eslintConfig;
