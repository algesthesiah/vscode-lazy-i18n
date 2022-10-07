import typescript from 'rollup-plugin-typescript2'
import commonjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import babel from '@rollup/plugin-babel'
import json from '@rollup/plugin-json'

const config = [
  {
    input: './src/index.ts',
    output: [
      {
        format: 'cjs',
        dir: 'dist',
        // preserveModules: true,
        exports: 'auto',
      },
    ],
    // external: [id => id.includes('@babel/runtime')],
    plugins: [
      nodeResolve(),
      commonjs(),
      json(),
      typescript({ tsconfig: './tsconfig.json' }),
      babel({
        babelHelpers: 'runtime',
        exclude: ['node_modules/**'],
        plugins: ['@babel/plugin-transform-runtime'],
      }),
      terser(),
    ],
  },
];

export default config
