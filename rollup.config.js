import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import pkg from './package.json';

export default [
  {
    input: 'src/index.js',
    external: ['react'],
    output: [
      { file: pkg.module, format: 'es' },
      { file: pkg.main, format: 'cjs', exports: 'named' },
    ],
    plugins: [
      resolve({
        mainFields: ['module', 'main', 'browser'],
        dedupe: ['react'],
      }),
      commonjs(),
      babel({
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env', '@babel/preset-react'],
      }),
    ],
  },
  // browser-friendly UMD build
  {
    input: 'src/index.js',
    output: {
      name: 'SimpleStore',
      file: 'dist/umd/simple-store.js',
      format: 'umd',
      globals: {
        react: 'React',
        rxjs: 'rxjs',
        'rxjs/operators': 'rxjs.operators',
      },
      exports: 'named',
    },
    plugins: [
      resolve({
        mainFields: ['module', 'main', 'browser'],
        dedupe: ['react'],
      }),
      babel({
        exclude: 'node_modules/**',
        presets: ['@babel/preset-env', '@babel/preset-react'],
      }),
      commonjs(),
    ],
    external: ['react', 'rxjs', 'rxjs/operators'],
  },
];
