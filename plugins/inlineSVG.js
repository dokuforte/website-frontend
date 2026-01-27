import fs from "fs"
import path from "path"

export default () => {
  return {
    parse(tagToken) {
      this.args = tagToken.args
    },
    async render(ctx) {
      const argsArray = this.args.split(" ")
      const entries = await Promise.all(
        argsArray.map(async (arg) => {
          const [key, value] = arg.split(":")
          const resolvedValue = await this.liquid.evalValue(value, ctx)
          return [key, resolvedValue]
        })
      )
      const args = Object.fromEntries(entries)

      if (path.extname(args.src) !== ".svg") {
        throw new Error("inlineSVG requires a filetype of svg")
      }

      // Resolve file path relative to project root
      const filePath = path.resolve(process.cwd(), args.src)

      // read svg file content (using promises for async)
      const data = await fs.promises.readFile(filePath, "utf8")

      // inject extra attributes
      let attributes = ""
      Object.keys(args).forEach((arg) => {
        if (arg !== "src") attributes += `${arg}="${args[arg]}" `
      })

      return data.replace("<svg", `<svg ${attributes}`)
    },
  }
}
