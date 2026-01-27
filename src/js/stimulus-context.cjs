// CommonJS file for webpack to process require.context
// This file uses .cjs extension so it's treated as CommonJS even with "type": "module"

// eslint-disable-next-line no-undef
const componentsContext = require.context("../components/", true, /[_-]controller\.js$/)
// eslint-disable-next-line no-undef
const layoutsContext = require.context("../layouts/", true, /[_-]controller\.js$/)

module.exports = { componentsContext, layoutsContext }
