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
};
