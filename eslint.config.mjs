import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// "next/core-web-vitals" não ignora ".next/" por padrão quando rodado via "eslint ."
// (só o CLI "next lint", legado, fazia isso sozinho) - sem isso, rodar lint depois de
// um build tenta analisar os artefatos gerados (chunks minificados, tipos de rota).
const eslintConfig = [
  { ignores: ['.next/**', 'next-env.d.ts'] },
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
];

export default eslintConfig;
