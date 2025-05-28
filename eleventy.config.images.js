const path = require("path");
const eleventyImage = require("@11ty/eleventy-img");

module.exports = eleventyConfig => {
	function relativeToInputPath(inputPath, relativeFilePath) {
		let split = inputPath.split("/");
		split.pop();

		return path.resolve(split.join(path.sep), relativeFilePath);
	}

	// Eleventy Image shortcode
	// https://www.11ty.dev/docs/plugins/image/
	eleventyConfig.addAsyncShortcode("image", async function imageShortcode(src, alt, widths, sizes) {
		// Full list of formats here: https://www.11ty.dev/docs/plugins/image/#output-formats
		// Warning: Avif can be resource-intensive so take care!
		let formats = ["avif", "webp", "auto"];
		let file = relativeToInputPath(this.page.inputPath, src);
		let metadata = await eleventyImage(file, {
			widths: widths || [300, 600, 900, 1200, "auto"],
			formats,
			outputDir: path.join(eleventyConfig.dir.output, "img"), // Advanced usage note: `eleventyConfig.dir` works here because we're using addPlugin.
			urlPath: "/img/",
			filenameFormat: function(id, src, width, format) {
				const extension = path.extname(src);
				const name = path.basename(src, extension);
				return `${name}-${width}w.${format}`;
			}
		});

		// Generate appropriate image attributes
		let imageAttributes = {
			alt,
			sizes: sizes || "(min-width: 1200px) 1200px, 100vw",
			loading: "lazy",
			decoding: "async",
		};
		
		return eleventyImage.generateHTML(metadata, imageAttributes);
	});

	// Add a simpler shortcode for optimized images with default settings
	eleventyConfig.addAsyncShortcode("optimizedImage", async function(src, alt, sizes) {
		if (!src) {
			throw new Error("Image source is required");
		}

		const inputPath = path.join("./public/img/", src);
		
		// Define widths for responsive images
		const widths = [300, 600, 900, 1200];
		
		// Generate optimized images
		const metadata = await eleventyImage(inputPath, {
			widths: widths,
			formats: ["avif", "webp", "jpeg"],
			outputDir: path.join(eleventyConfig.dir.output, "img"),
			urlPath: "/img/",
			filenameFormat: function(id, src, width, format) {
				const extension = path.extname(src);
				const name = path.basename(src, extension);
				return `${name}-${width}w.${format}`;
			}
		});

		// Generate the HTML
		const imageAttributes = {
			alt,
			sizes: sizes || "(min-width: 1200px) 1200px, 100vw",
			loading: "lazy",
			decoding: "async",
		};
		
		return eleventyImage.generateHTML(metadata, imageAttributes);
	});
};
