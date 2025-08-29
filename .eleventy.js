module.exports = function(eleventyConfig) {
  // Copy static files
  eleventyConfig.addPassthroughCopy("src/css");
  
  // Set path prefix for GitHub Pages if needed
  let pathPrefix = "";
  if (process.env.GITHUB_REPOSITORY) {
    const repoName = process.env.GITHUB_REPOSITORY.split('/')[1];
    pathPrefix = `/${repoName}/`;
  }
  
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
    const chapterTitles = {
      'Chapter_01_Summary': 'A Critical Consideration of the New Pedagogy',
      'Chapter_02_Summary': 'History of Methods', 
      'Chapter_03_Summary': 'Inaugural Address for the Children\'s Houses',
      'Chapter_04_Summary': 'Pedagogical Methods & Discipline in the Children\'s Houses',
      'Chapter_05_Summary': 'Discipline',
      'Chapter_06_Summary': 'How the Lessons Should be Given',
      'Chapter_07_Summary': 'Exercises of Practical Life',
      'Chapter_08_Summary': 'Refection—The Child\'s Diet',
      'Chapter_09_Summary': 'Muscular Education—Gymnastics',
      'Chapter_10_Summary': 'Nature in Education—Agricultural Labour',
      'Chapter_11_Summary': 'Manual Labour—the Potter\'s Art and Building',
      'Chapter_12_Summary': 'Education of the Senses',
      'Chapter_13_Summary': 'Sequence of Exercises',
      'Chapter_14_Summary': 'Conclusion',
      'Master_Summary': 'Complete Overview of The Montessori Method'
    };
    return chapterTitles[fileSlug] || fileSlug.replace(/Chapter_\d+_/, '').replace(/_/g, ' ');
  });

  // Add a filter for short navigation titles
  eleventyConfig.addFilter("navTitle", function(fileSlug) {
    const navTitles = {
      'Chapter_01_Summary': 'New Pedagogy',
      'Chapter_02_Summary': 'History', 
      'Chapter_03_Summary': 'Inaugural Address',
      'Chapter_04_Summary': 'Methods',
      'Chapter_05_Summary': 'Discipline',
      'Chapter_06_Summary': 'Lessons',
      'Chapter_07_Summary': 'Practical Life',
      'Chapter_08_Summary': 'Child\'s Diet',
      'Chapter_09_Summary': 'Gymnastics',
      'Chapter_10_Summary': 'Nature',
      'Chapter_11_Summary': 'Manual Labor',
      'Chapter_12_Summary': 'Senses',
      'Chapter_13_Summary': 'Sequence',
      'Chapter_14_Summary': 'Conclusion',
      'Master_Summary': 'Overview'
    };
    return navTitles[fileSlug] || fileSlug.replace(/Chapter_\d+_/, '').replace(/_/g, ' ');
  });

  // Add filters to find next and previous chapters
  eleventyConfig.addFilter("getNextChapter", function(currentPage, collections) {
    const summaries = collections.summaries.filter(item => item.fileSlug !== 'Master_Summary');
    const currentIndex = summaries.findIndex(item => item.url === currentPage.url);
    return currentIndex < summaries.length - 1 ? summaries[currentIndex + 1] : null;
  });

  eleventyConfig.addFilter("getPrevChapter", function(currentPage, collections) {
    const summaries = collections.summaries.filter(item => item.fileSlug !== 'Master_Summary');
    const currentIndex = summaries.findIndex(item => item.url === currentPage.url);
    return currentIndex > 0 ? summaries[currentIndex - 1] : null;
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      layouts: "_layouts"
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: pathPrefix
  };
};