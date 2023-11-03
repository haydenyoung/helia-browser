import path from 'path';
import { fileURLToPath } from 'url'
import webpack from 'webpack'
import { createRequire } from 'module'

export default (env, argv) => {
  const require = createRequire(import.meta.url)
  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)
        
  return {
    target: 'web',
    entry: './src/index.js',
    // entry: './test/index.test.js',
    mode: 'development',
    output: {
      filename: 'main.js',
      path: path.resolve(__dirname, 'dist'),
    },
    externals: {
         'node:path': {}
    },
    resolve: {
      fallback: {
        os: require.resolve("os-browserify/browser"),
        path: require.resolve("path-browserify"),
        assert: require.resolve("assert/")
        // process: require.resolve('process/browser') // this does nothing. ProvidePlugin is needed to globally include it. If npm i process, the browser version of process is installed and usable; no other config is required.
      }
    },
    plugins: [
      /*new webpack.ProvidePlugin({
        process: "process/browser" // plugins inject it as a global. This is useful for other modules that require process (or some other built-in node feature; fs, etc).
      })*/
      new webpack.DefinePlugin({
        // or, override, explicitly, particular globally referenced vars. This saves having to install another module just to appease a module's requirements.
        'process.env.NODE_DEBUG': JSON.stringify(false) // In this particular case, util.js is looking for the env var NODE_DEBUG.
      })
    ]
  }
};