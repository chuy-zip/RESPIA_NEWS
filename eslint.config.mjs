import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

/*
 * Flat config de ESLint. eslint-config-next 16 ya exporta arrays de flat config,
 * así que no hace falta el puente FlatCompat de las versiones viejas.
 *
 * ESLint está fijado en la línea 9.x a propósito: la 10 rompe con el
 * eslint-plugin-react que trae eslint-config-next 16 (falla al lintear). No
 * subirlo hasta que Next actualice ese plugin.
 */
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypeScript,
  {
    ignores: [".next/**", "node_modules/**", "public/sw.js"],
  },
];

export default eslintConfig;
