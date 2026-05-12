'use strict'

const path = require('path')
const JSZip = require('jszip')
const { XMLParser } = require('fast-xml-parser')

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  trimValues: true,
})

function asArray(value) {
  if (!value) {
    return []
  }

  return Array.isArray(value) ? value : [value]
}

function normalizeZipPath(basePath, target) {
  return path.posix.normalize(path.posix.join(path.posix.dirname(basePath), target))
}

function normalizeSectionKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function parseXml(text) {
  return xmlParser.parse(text)
}

function collectTextRuns(node, collector = []) {
  if (!node || typeof node !== 'object') {
    return collector
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === 'a:t') {
      asArray(value).forEach((entry) => {
        const text = String(entry || '').trim()
        if (text) {
          collector.push(text)
        }
      })
      continue
    }

    if (typeof value === 'object') {
      collectTextRuns(value, collector)
    }
  }

  return collector
}

function collectFontNames(node, collector = new Set()) {
  if (!node || typeof node !== 'object') {
    return collector
  }

  for (const [key, value] of Object.entries(node)) {
    if ((key === 'a:latin' || key === 'a:ea' || key === 'a:cs') && value?.typeface) {
      const typeface = String(value.typeface).trim()
      if (typeface && !typeface.startsWith('+')) {
        collector.add(typeface)
      }
    }

    if (typeof value === 'object') {
      collectFontNames(value, collector)
    }
  }

  return collector
}

function countNodes(node, nodeName) {
  if (!node || typeof node !== 'object') {
    return 0
  }

  return Object.entries(node).reduce((count, [key, value]) => {
    const localCount = key === nodeName ? asArray(value).length : 0
    if (typeof value === 'object') {
      return count + localCount + countNodes(value, nodeName)
    }
    return count + localCount
  }, 0)
}

function buildSlideHeading(slideNumber, title) {
  const normalizedTitle = String(title || `Slide ${slideNumber}`)
    .replace(/[:;]+/g, ' ')
    .replace(/[^A-Za-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  return normalizedTitle ? `Slide ${slideNumber} ${normalizedTitle}` : `Slide ${slideNumber}`
}

function buildSlideSectionKey(slideNumber, title) {
  return normalizeSectionKey(buildSlideHeading(slideNumber, title))
}

function buildFlattenedText(slides) {
  return slides
    .map((slide) => {
      const parts = [buildSlideHeading(slide.slideNumber, slide.title)]

      if (slide.text) {
        parts.push(slide.text)
      }

      if (slide.notesText) {
        parts.push(`Speaker Notes ${slide.notesText}`)
      }

      return parts.join('\n')
    })
    .join('\n\n')
}

async function loadSlideOrder(zip) {
  const presentationXml = zip.file('ppt/presentation.xml')
  const presentationRelsXml = zip.file('ppt/_rels/presentation.xml.rels')

  if (!presentationXml || !presentationRelsXml) {
    throw new Error('The PPTX file is missing presentation metadata.')
  }

  const presentation = parseXml(await presentationXml.async('text'))
  const presentationRels = parseXml(await presentationRelsXml.async('text'))

  const relMap = new Map(
    asArray(presentationRels.Relationships?.Relationship).map((relationship) => [
      relationship.Id,
      normalizeZipPath('ppt/presentation.xml', relationship.Target),
    ])
  )

  return asArray(presentation['p:presentation']?.['p:sldIdLst']?.['p:sldId'])
    .map((slideRef) => relMap.get(slideRef['r:id']))
    .filter(Boolean)
}

async function loadRelationshipMap(zip, sourcePath) {
  const relFilePath = path.posix.join(path.posix.dirname(sourcePath), '_rels', `${path.posix.basename(sourcePath)}.rels`)
  const relFile = zip.file(relFilePath)

  if (!relFile) {
    return new Map()
  }

  const rels = parseXml(await relFile.async('text'))
  return new Map(
    asArray(rels.Relationships?.Relationship).map((relationship) => [
      relationship.Id,
      {
        target: normalizeZipPath(relFilePath, relationship.Target),
        type: relationship.Type,
      },
    ])
  )
}

async function loadNotesPath(zip, slidePath) {
  const relationships = await loadRelationshipMap(zip, slidePath)
  const notesRelationship = Array.from(relationships.values()).find((relationship) =>
    String(relationship.type || '').includes('/notesSlide')
  )

  if (!notesRelationship?.target) {
    return null
  }

  return notesRelationship.target
}

function getShapeInfos(slideXml) {
  const shapes = asArray(slideXml['p:sld']?.['p:cSld']?.['p:spTree']?.['p:sp'])
  return shapes.map((shape) => {
    const placeholder = shape?.['p:nvSpPr']?.['p:nvPr']?.['p:ph'] || null
    const text = collectTextRuns(shape).join(' ').replace(/\s+/g, ' ').trim()
    const fontNames = Array.from(collectFontNames(shape))

    return {
      name: shape?.['p:nvSpPr']?.['p:cNvPr']?.name || null,
      placeholderType: placeholder?.type || (placeholder ? 'body' : null),
      text,
      fontNames,
    }
  })
}

function extractThemeFonts(themeXml) {
  const fontScheme = themeXml?.['a:theme']?.['a:themeElements']?.['a:fontScheme']
  return {
    majorLatin: fontScheme?.['a:majorFont']?.['a:latin']?.typeface || null,
    minorLatin: fontScheme?.['a:minorFont']?.['a:latin']?.typeface || null,
  }
}

async function parsePptxBuffer(buffer) {
  const zip = await JSZip.loadAsync(buffer)
  const slidePaths = await loadSlideOrder(zip)
  const themeCache = new Map()

  const slides = []
  for (const [index, slidePath] of slidePaths.entries()) {
    const slideFile = zip.file(slidePath)
    if (!slideFile) {
      continue
    }

    const slideXml = parseXml(await slideFile.async('text'))
    const textRuns = collectTextRuns(slideXml)
    const shapeInfos = getShapeInfos(slideXml)
    const relationships = await loadRelationshipMap(zip, slidePath)
    const layoutRelationship = Array.from(relationships.values()).find((relationship) =>
      String(relationship.type || '').includes('/slideLayout')
    )
    const layoutPath = layoutRelationship?.target || null
    const layoutXml = layoutPath && zip.file(layoutPath) ? parseXml(await zip.file(layoutPath).async('text')) : null
    const layoutRelationships = layoutPath ? await loadRelationshipMap(zip, layoutPath) : new Map()
    const masterRelationship = Array.from(layoutRelationships.values()).find((relationship) =>
      String(relationship.type || '').includes('/slideMaster')
    )
    const masterPath = masterRelationship?.target || null
    const masterRelationships = masterPath ? await loadRelationshipMap(zip, masterPath) : new Map()
    const themeRelationship = Array.from(masterRelationships.values()).find((relationship) =>
      String(relationship.type || '').includes('/theme')
    )
    const themePath = themeRelationship?.target || null

    let themeFonts = null
    if (themePath && zip.file(themePath)) {
      if (!themeCache.has(themePath)) {
        themeCache.set(themePath, extractThemeFonts(parseXml(await zip.file(themePath).async('text'))))
      }
      themeFonts = themeCache.get(themePath)
    }

    const notesPath = await loadNotesPath(zip, slidePath)
    const notesXml = notesPath && zip.file(notesPath) ? parseXml(await zip.file(notesPath).async('text')) : null
    const notesTextRuns = notesXml ? collectTextRuns(notesXml) : []
    const slideText = textRuns.join(' ').replace(/\s+/g, ' ').trim()
    const titleShapes = shapeInfos.filter((shape) => shape.placeholderType === 'title' || shape.placeholderType === 'ctrTitle')
    const titleText = titleShapes.find((shape) => shape.text)?.text || ''
    const slideTitle = titleText || textRuns.find((entry) => entry.length > 2) || `Slide ${index + 1}`
    const explicitFonts = Array.from(new Set(shapeInfos.flatMap((shape) => shape.fontNames)))
    const sectionKey = buildSlideSectionKey(index + 1, slideTitle)

    slides.push({
      slideNumber: index + 1,
      title: slideTitle,
      sectionKey,
      text: slideText,
      notesText: notesTextRuns.join(' ').replace(/\s+/g, ' ').trim(),
      shapeCount: countNodes(slideXml, 'p:sp'),
      imageCount: countNodes(slideXml, 'p:pic'),
      wordCount: slideText ? slideText.split(/\s+/).filter(Boolean).length : 0,
      notesWordCount: notesTextRuns.length > 0 ? notesTextRuns.join(' ').split(/\s+/).filter(Boolean).length : 0,
      hasTitlePlaceholder: titleShapes.length > 0,
      hasTitleText: Boolean(titleText),
      placeholderTypes: Array.from(new Set(shapeInfos.map((shape) => shape.placeholderType).filter(Boolean))),
      explicitFonts,
      layoutName: layoutXml?.['p:sldLayout']?.matchingName || layoutXml?.['p:sldLayout']?.name || null,
      layoutPath,
      masterPath,
      themePath,
      themeFonts,
      textBoxCount: shapeInfos.filter((shape) => shape.text).length,
    })
  }

  const flattenedText = buildFlattenedText(slides)
  const uniqueThemes = Array.from(new Set(slides.map((slide) => slide.themePath).filter(Boolean)))
  const uniqueMasters = Array.from(new Set(slides.map((slide) => slide.masterPath).filter(Boolean)))
  const uniqueLayouts = Array.from(new Set(slides.map((slide) => slide.layoutName || slide.layoutPath).filter(Boolean)))
  const uniqueFonts = Array.from(new Set(slides.flatMap((slide) => slide.explicitFonts)))

  return {
    fileType: 'pptx',
    slideCount: slides.length,
    slides,
    text: flattenedText,
    presentation: {
      uniqueThemes,
      uniqueMasters,
      uniqueLayouts,
      explicitFonts: uniqueFonts,
      slidesMissingTitlePlaceholder: slides.filter((slide) => !slide.hasTitlePlaceholder).map((slide) => slide.slideNumber),
      slidesMissingTitleText: slides.filter((slide) => !slide.hasTitleText).map((slide) => slide.slideNumber),
    },
    annotations: slides.map((slide) => ({
      id: `slide-${slide.slideNumber}`,
      slide_number: slide.slideNumber,
      title: slide.title,
      section_key: slide.sectionKey,
      word_count: slide.wordCount,
      notes_word_count: slide.notesWordCount,
      shape_count: slide.shapeCount,
      image_count: slide.imageCount,
      has_title_placeholder: slide.hasTitlePlaceholder,
      has_title_text: slide.hasTitleText,
      layout_name: slide.layoutName,
      fonts: slide.explicitFonts,
    })),
    heatmap: {
      total_slides: slides.length,
      slides: slides.map((slide) => ({
        slide_number: slide.slideNumber,
        title: slide.title,
        section_key: slide.sectionKey,
        word_count: slide.wordCount,
        shape_count: slide.shapeCount,
        dense: slide.wordCount > 120 || slide.shapeCount > 18,
        missing_title: !slide.hasTitleText,
      })),
    },
  }
}

module.exports = {
  parsePptxBuffer,
}