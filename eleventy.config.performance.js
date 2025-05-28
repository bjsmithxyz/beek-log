const CleanCSS = require("clean-css");
const { minify } = require("terser");

module.exports = eleventyConfig => {
  // Minify CSS
  eleventyConfig.addFilter("cssmin", function(code) {
    return new CleanCSS({}).minify(code).styles;
  });

  // Minify JS
  eleventyConfig.addNunjucksAsyncFilter("jsmin", async function(
    code,
    callback
  ) {
    try {
      const minified = await minify(code);
      callback(null, minified.code);
    } catch (err) {
      console.error("Terser error: ", err);
      // Fail gracefully.
      callback(null, code);
    }
  });

  // Add shortcode for current year (useful for copyright)
  eleventyConfig.addShortcode("year", () => `${new Date().getFullYear()}`);

  // Create a collection for featured posts (if any)
  eleventyConfig.addCollection("featured", function(collectionApi) {
    return collectionApi.getFilteredByTag("posts").filter(post => post.data.featured);
  });

  // Add word count filter
  eleventyConfig.addFilter("wordCount", function(content) {
    return content.split(/\s+/).length;
  });

  // Add reading time filter (average 200 words per minute)
  eleventyConfig.addFilter("readingTime", function(content) {
    const words = content.split(/\s+/).length;
    const minutes = Math.ceil(words / 200);
    return `${minutes} min read`;
  });

  // Image shortcodes for better content management
  eleventyConfig.addShortcode("singleImage", function(src, alt = "") {
    return `<a href="/img/${src}" target="_blank" class="image-single">
			<img src="/img/${src}" alt="${alt}">
		</a>`;
  });

  eleventyConfig.addShortcode("imageGrid", function(...images) {
    const imageCount = images.length;
    const gridClass = imageCount <= 2 ? 'image-grid-2' : 'image-grid-3';
    
    const imageElements = images.map(img => {
      const [src, alt = ""] = Array.isArray(img) ? img : [img, ""];
      return `<a href="/img/${src}" target="_blank" class="image-grid-item">
				<img src="/img/${src}" alt="${alt}">
			</a>`;
    }).join('\n\t\t');

    return `<div class="image-grid ${gridClass}">
		${imageElements}
	</div>`;
  });

  eleventyConfig.addShortcode("imageCaption", function(text) {
		// Convert line breaks to proper HTML
		const htmlText = text.replace(/\n/g, '<br>\n');
		return `<div class="image-caption">
		<i>${htmlText}</i>
	</div>`;
	});

	// Spacing utility shortcode to replace repetitive <br> tags
	eleventyConfig.addShortcode("spacer", function(size = "medium") {
		const validSizes = ["small", "medium", "large"];
		const safeSize = validSizes.includes(size) ? size : "medium";
		return `<div class="spacer-${safeSize}"></div>`;
	});
};
