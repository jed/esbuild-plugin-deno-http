import {build, stop} from 'https://deno.land/x/esbuild@v0.14.0/mod.js'
import {assertEquals} from 'https://deno.land/std/testing/asserts.ts'
import esbuild_plugin_deno_http from './mod.js'

let result = await build({
  entryPoints: ['./example.jsx'],
  plugins: [esbuild_plugin_deno_http],
  write: false,
  format: 'esm',
  bundle: true,
  jsxFactory: 'h'
})

let dataurl = await new Promise(cb => {
  let reader = new FileReader()
  let blob = new Blob([result.outputFiles[0]])
  reader.readAsDataURL(blob)
  reader.onload = () => cb(reader.result)
})

let {default: html} = await import(dataurl)
assertEquals(html, '<h1>Hello, world!</h1>')

stop()