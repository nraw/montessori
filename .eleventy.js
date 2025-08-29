module.exports = function(eleventyConfig) {
  // Copy static files
  eleventyConfig.addPassthroughCopy("src/css");
  
  // Add a collection for summaries
  eleventyConfig.addCollection("summaries", function(collectionApi) {
    return collectionApi.getFilteredByGlob("src/summaries/*.md")
      .sort((a, b) => {
        // Sort by chapter number extracted from filename
        const aNum = parseInt(a.fileSlug.match(/\d+/)?.[0] || '0');
        const bNum = parseInt(b.fileSlug.match(/\d+/)?.[0] || '0');
        return aNum - bNum;
      });
  });

  // Add a filter to extract chapter number from filename
  eleventyConfig.addFilter("chapterNumber", function(fileSlug) {
    const match = fileSlug.match(/Chapter_(\d+)_/);
    return match ? parseInt(match[1]) : 0;
  });

  // Add a filter to extract chapter title from filename
  eleventyConfig.addFilter("chapterTitle", function(fileSlug) {
    return fileSlug.replace(/Chapter_\d+_/, '').replace(/_/g, ' ');
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk"
  };
};