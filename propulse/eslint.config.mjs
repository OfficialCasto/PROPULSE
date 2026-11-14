import tseslint from "typescript-eslint";

export default [
  { ignores: ["**/.next/**", "**/.expo/**", "**/dist/**", "**/next-env.d.ts"] },
  ...tseslint.configs.recommended,
];
