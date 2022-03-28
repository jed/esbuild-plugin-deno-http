let proc = Deno.run({cmd: ['deno', 'info', '--json'], stdout: 'piped'})
let json = new TextDecoder().decode(await proc.output())
let baseUrl = JSON.parse(json).modulesCache

async function resolve(url) {
  let {href, host, origin, protocol} = url
  let pathname = href.slice(origin.length)
  let buffer = new TextEncoder().encode(pathname)
  let digest = await crypto.subtle.digest('SHA-256', buffer)
  let arr = [...new Uint8Array(digest)]
  let hash = arr.map(i => i.toString(16).padStart(2, '0')).join('')
  let filepath = [baseUrl, protocol.slice(0, -1), host, hash].join('/')
  let json = await Deno.readTextFile(`${filepath}.metadata.json`)
  let location = JSON.parse(json).headers.location
  return location
    ? resolve(new URL(location, url))
    : Deno.readTextFile(filepath)
}

export default {
  name: 'deno-http',

  setup: async ({onResolve, onLoad}) => {
    onResolve({filter: /^https?:\/\//}, ({path}) => {
      return {path, namespace: 'deno-http'}
    })

    onResolve({filter: /.*/, namespace: 'deno-http'}, ({path, importer}) => {
      path = new URL(path, importer).href
      return {path, namespace: 'deno-http'}
    })

    onLoad({filter: /.*/, namespace: 'deno-http'}, async ({path}) => {
      let url = new URL(path)
      await Deno.emit(url, {bundle: 'module'})
      let contents = await resolve(url)
      return {loader: 'js', contents}
    })
  }
}
