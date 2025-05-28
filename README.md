# beek-log

A personal blog and art showcase built with [Eleventy](https://www.11ty.dev/).

## Overview

This site serves as a collection of artwork, illustrations, and occasional blog posts.

Find me on [Twitter](https://twitter.com/bjsmithxyz), [Instagram](https://www.instagram.com/bjsmith.xyz/), or [GitHub](https://github.com/bjsmithxyz/).

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) version 18 or higher
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/bjsmithxyz/beek-log.git
   cd beek-log
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Run the development server:

   ```bash
   npm start
   ```

   This will start a local server at [http://localhost:8080](http://localhost:8080)

### Building for Production

```bash
npm run build
```

This will generate the site in the `_site` directory.

## Project Structure

- `_data` - Global data files
- `_includes` - Layout templates and components
- `content` - All blog posts and pages
- `public` - Static assets like CSS and images
- `eleventy.config.*.js` - Eleventy configuration files

## Adding Content

### Creating a Blog Post

1. Create a new Markdown file in the `content/blog` directory
2. Add frontmatter:

   ```markdown
   ---
   title: Your Post Title
   description: Brief description
   date: YYYY-MM-DD
   tags:
     - tag1
     - tag2
   ---
   ```

3. Add your content in Markdown format

### Adding Images

1. Place image files in the `public/img` directory
2. Reference them in your posts with:

   ```html
   <a href="/img/image-name.png" target="_blank">
     <img src="/img/image-name.png" style="width: 100%; height: auto;">
   </a>
   ```

## Deployment

This site is configured for deployment with Netlify. Changes pushed to the main branch will automatically trigger a new build.

## License

This project is licensed under the MIT License - see the `LICENSE` file for details.
