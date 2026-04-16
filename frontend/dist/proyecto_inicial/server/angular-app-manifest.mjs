
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 2,
    "route": "/"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 3626, hash: '5907ff9c573b5fc77862b45c0512118bdfe508126bd5a9b9ebadf672653404ee', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 3424, hash: '079c5e0f83cf114c9e92d57eb123de29d45301545d506dfb6d86206be734ee71', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'index.html': {size: 14597, hash: '2ed3814a1710dd8ade129f1012ff587954c5a30f157da30207007d7d483bba3a', text: () => import('./assets-chunks/index_html.mjs').then(m => m.default)},
    'styles-BR7ZXNQX.css': {size: 642, hash: 'O1jijASd/Mg', text: () => import('./assets-chunks/styles-BR7ZXNQX_css.mjs').then(m => m.default)}
  },
};
