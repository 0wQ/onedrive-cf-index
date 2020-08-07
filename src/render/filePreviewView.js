import marked from 'marked'

import { renderHTML } from './htmlWrapper'
import { renderPath } from './pathUtil'

import { preview, extensions } from './fileExtension'

async function renderTextPreview(file) {
  const resp = await fetch(file['@microsoft.graph.downloadUrl'])
  const content = await resp.text()
  const parseText = txt => {
    let finalText = ''
    txt.split('\n').forEach(t => {
      finalText += `<p>${t}</p>`
    })
    return finalText
  }
  return `<div class="markdown-body" style="margin-top: 0;">
            ${parseText(content)}
          </div>`
}

async function renderMarkdownPreview(file) {
  const resp = await fetch(file['@microsoft.graph.downloadUrl'])
  const content = await resp.text()

  const renderedMd = marked(content)
  return `<div class="markdown-body" style="margin-top: 0;">
            ${renderedMd}
          </div>`
}

async function renderCodePreview(file, lang) {
  const resp = await fetch(file['@microsoft.graph.downloadUrl'])
  const content = await resp.text()
  const toMarkdown = `\`\`\`${lang}\n${content}\n\`\`\``
  console.log(toMarkdown)
  const renderedCode = marked(toMarkdown)
  return `<div class="markdown-body" style="margin-top: 0;">
            ${renderedCode}
          </div>`
}

function renderPDFPreview(file) {
  return `<object data="${file['@microsoft.graph.downloadUrl']}" type="application/pdf" width="100%" height="80vh">
            <iframe src="${file['@microsoft.graph.downloadUrl']}" width="100%" height="80vh" style="border: none;" __idm_frm__="124">
              This browser does not support PDFs. Please download the PDF to view it.
            </iframe>
          </object>`
}

function renderImage(file) {
  return `<img src="${file['@microsoft.graph.downloadUrl']}" alt="${file.name}" style="display: block; max-width: 100%; margin: 0 auto;"></img>`
}

async function renderPreview(file, fileExt) {
  switch (extensions[fileExt]) {
    case preview.markdown:
      return await renderMarkdownPreview(file)

    case preview.text:
      return await renderTextPreview(file)

    case preview.image:
      return renderImage(file)

    case preview.code:
      return await renderCodePreview(file, fileExt)

    case preview.pdf:
      return renderPDFPreview(file)

    default:
      return Response.redirect(file['@microsoft.graph.downloadUrl'], 302)
  }
}

export async function renderFilePreview(file, path, fileExt) {
  const nav = '<nav><div class="brand">📁 Spencer\'s OneDrive Index</div></nav>'
  const el = (tag, attrs, content) => `<${tag} ${attrs.join(' ')}>${content}</${tag}>`
  const div = (className, content) => el('div', [`class=${className}`], content)

  console.log(file, path)
  const body =
    nav +
    div(
      'container',
      div('path', renderPath(path) + ` / ${file.name}`) +
        div('items', el('div', ['style="padding: 1rem 1rem;"'], await renderPreview(file, fileExt))) +
        div(
          'download-button-container',
          el(
            'a',
            ['class="download-button"', `href="${file['@microsoft.graph.downloadUrl']}"`],
            '<i class="far fa-arrow-alt-circle-down"></i> DOWNLOAD'
          )
        )
    )
  return renderHTML(body)
}
