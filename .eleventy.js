const liquidFilters = require("./plugins/liquid-filters")
const inlineSVG = require("./plugins/inlineSVG")
const htmlmin = require("html-minifier")
const markdownIt = require("markdown-it")
const markdownItAttrs = require("markdown-it-attrs")
const markdownItAnchor = require("markdown-it-anchor")

module.exports = eleventyConfig => {
  // Disable .gitignore and use eleventy's own ignore file instead
  eleventyConfig.setUseGitIgnore(false)

  // Copy assets
  eleventyConfig.addPassthroughCopy({ "src/static/images": "/images/" })
  eleventyConfig.addPassthroughCopy({ "src/static/uploads": "/uploads/" })
  eleventyConfig.addPassthroughCopy({ "src/static/": "/" })

  // Define custom liquid tags and shortcodes
  eleventyConfig.addLiquidTag("inlineSVG", inlineSVG)
  eleventyConfig.addLiquidShortcode("now", () => {
    return Date.now()
  })
  eleventyConfig.addLiquidShortcode("date", liquidFilters.date)
  eleventyConfig.addLiquidFilter("imgix_url", liquidFilters.imgixUrl)
  eleventyConfig.addLiquidFilter("find", liquidFilters.findItem)
  eleventyConfig.addLiquidFilter("trim", liquidFilters.trim)
  eleventyConfig.addLiquidFilter("size", liquidFilters.size)
  eleventyConfig.addLiquidFilter("split", liquidFilters.split)
  eleventyConfig.addLiquidFilter("join", liquidFilters.join)
  eleventyConfig.addLiquidFilter("push", liquidFilters.push)
  eleventyConfig.addLiquidFilter("sort", liquidFilters.sort)
  eleventyConfig.addLiquidFilter("markdownify", liquidFilters.markdownify)
  eleventyConfig.addLiquidFilter("slugify", liquidFilters.slugify)
  eleventyConfig.addLiquidFilter("format_price", liquidFilters.formatPrice)
  eleventyConfig.addLiquidFilter("to_timestamp", liquidFilters.toTimestamp)
  eleventyConfig.addLiquidFilter("lowcase", liquidFilters.lowcase)

  // https local dev environment settings
  eleventyConfig.setServerOptions({
    port: 443,
    https: {
      key: './dev.dokuforte.co.il.key',
      cert: './dev.dokuforte.co.il.cert',
    },
  });

  // Markdown custom config
  let markdownOptions = {
    html: true,
  }
  let markdownLibrary = markdownIt(markdownOptions)
    .use(markdownItAttrs)
    .use(markdownItAnchor)
  eleventyConfig.setLibrary("md", markdownLibrary)

  // Minify html in production
  if (process.env.ENV === "production") {
    eleventyConfig.addTransform("htmlmin", (content, outputPath) => {
      if (outputPath.endsWith(".html")) {
        const minified = htmlmin.minify(content, {
          collapseInlineTagWhitespace: false,
          collapseWhitespace: true,
          removeComments: true,
          sortClassName: true,
          useShortDoctype: true,
        })
        return minified
      }
      return content
    })
  }

  return {
    dir: {
      input: "src",
      output: "_dist",
      data: "data",
      layouts: "layouts",
      includes: "components",
    },
    passthroughFileCopy: true,
    htmlTemplateEngine: "liquid",
    templateFormats: ["liquid", "md", "html", "yml"],
  }
}
