## Dokuforte

#### Technologies used

- Eleventy - Static site generator (https://11ty.dev)
- Liquid as the templating language
- Sass for writing CSS
- PostCSS + Autoprefixer for vendor prefixing CSS
- Webpack for compiling Sass and JavaScript assets
- Prettier, Stylelint, ESLint and Airbnb's base js linting configuration for basic code hyigene
- Stimulus - a very efficinent HTML-first frontend javascript framework by Basecamp (https://stimulus.hotwire.dev/)
- Vanilla Js

The website is hosted on Netlify, the admin team is using Forestry CMS for content management.

### Getting started

#### Install all dependencies using npm:

```
$ nvm use &
$ npm install
```

#### Running and serving a dev build

1. Generate a local SSL/TLS certificate for your development domain by running the following command in your terminal:
```
npx devcert-cli generate dev.dokuforte.co.il
```

This will generate a certificate and key file for the dev.dokuforte.co.il domain in the project root.

2. Edit your hosts file to redirect 127.0.0.1 to dev.dokuforte.co.il

3. Start the development server

```
$ npm run dev
```

Browse to https://dev.dokuforte.co.il

#### Running a prod build

```
npm run build
```

#### Project structure

```
src/
  api/
    All Drupal auth and ElasticSearch related APIs
  components/
    All UI partials
  data/
    Eleventy data files
  js/
    App specific js helpers and utils
  layouts/
    Base page layouts and layout (stimulus) components
  pages/
    Localized page content in markdown format
  scss/
    All fortend theme related css files (scopes, tyopgraphy, layout, helpers, color vars)
  static/
    All static content used (images, files generated during build time, etc.)
```

Eleventy’s output will be generated to a `_dist` directory at the root level.
