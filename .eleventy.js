const pluginTOC = require('eleventy-plugin-toc')
const htmlmin = require("html-minifier-terser");
const EleventyFetch = require('@11ty/eleventy-fetch');
const { EleventyRenderPlugin } = require('@11ty/eleventy');
const lodash = require("lodash");

module.exports = function(eleventyConfig) {
  eleventyConfig.setLibrary(
    'md',
    markdownIt = require('markdown-it')({
      html: true
    }).use(require('markdown-it-anchor'))
      .use(require('markdown-it-footnote'))
    );
  eleventyConfig.addPlugin(pluginTOC, {
    tags: ['h1', 'h2', 'h3', 'h4'],
    ul: true,
    wrapper: 'div'
  });

  eleventyConfig.addPlugin(EleventyRenderPlugin);

  eleventyConfig.addAsyncShortcode('readdynamiccodeRender', async (url,fallback_url) => {
    const log_text = `The location of the resource is defined in the md file but was not accessible. The URL is "${url}"`
    const log_text_shown_from_fallback = `The resource of fallback location at "${fallback_url} will be used if available."`
    const screen_text =  "Please revisit this page later. The page is currently unavailable but will become available soon."
    const renderTemplateInside = eleventyConfig.javascriptFunctions.renderTemplate;
    const shortcodeFetch = (url,fallback_url) => {
      try {
        let returnedContent = EleventyFetch(url, {
          duration: '1m',
          type: 'text',
          verbose: true
        }).then(
         function(response){
           let text = renderTemplateInside(response,'md');
           console.log("post:",text)
           return text;
         }
        ).catch(error => {
          console.log(log_text,error);
          if (fallback_url != null ){
            console.log(log_text_shown_from_fallback)
            return shortcodeFetch(fallback_url,null);
          } else {
            return screen_text;
          }
        });
        return returnedContent;
      } catch (e) {
        console.log(log_text);
        return screen_text;
      }
    }
    return shortcodeFetch(url,fallback_url);
  });

  eleventyConfig.addAsyncShortcode('readdynamiccode', async (url,fallback_url) => {
    const log_text = `The location of the resource is defined in the md file but was not accessible. The URL is "${url}"`
    const log_text_shown_from_fallback = `The resource of fallback location at "${fallback_url} will be used if available."`
    const screen_text =  "Please revisit this page later. The page is currently unavailable but will become available soon."
    const shortcodeFetch = (url,fallback_url) => {
      try {
        let returnedContent = EleventyFetch(url, {
          duration: '1m',
          type: 'text',
          verbose: true
        }).then(
         function(response){
           return response;
         }
        ).catch(error => {
          console.log(log_text);
          if (fallback_url != null ){
            console.log(log_text_shown_from_fallback)
            return shortcodeFetch(fallback_url,null);
          } else {
            return screen_text;
          }
        });
        return returnedContent;
      } catch (e) {
        console.log(log_text);
        return screen_text;
      }
    }
    return shortcodeFetch(url,fallback_url);
  });

  eleventyConfig.addTransform("htmlmin", function(content, outputPath) {
    if( outputPath.endsWith(".html") ) {
    try {
      let minified = htmlmin.minify(content, {
        useShortDoctype: true,
        removeComments: true,
        collapseWhitespace: true
      });
      return minified;
    } catch (e) {
      console.error("Error minifying", outputPath, e);
      return content;
    }
    }
  return content;
  });

  eleventyConfig.addFilter("sortDataByLanguageIso", (obj) => {
    const sorted = [];
    Object.keys(obj)
      .sort((a, b) => {
        if (('language' in obj[a].data && 'language' in obj[b].data) !== true){
          return -1;
        } else {
          return obj[a].data.language.iso6392B > obj[b].data.language.iso6392B ? 1 : -1;
        }
      })
      .forEach((name, index) => {
        sorted[index] = obj[name]
      });
    return sorted;
  });

  eleventyConfig.addFilter("sortDataByChapteridSubidLanguageIso", (obj) => {

    const sorted = [];
    console.log(Object.keys(obj));
    Object.keys(obj)
      .sort((a, b) => {

        if (('language' in obj[a].data && 'language' in obj[b].data) !== true) {
          return 0;
        }
        if (('chapterid' in obj[a].data && 'chapterid' in obj[b].data) !== true) {
          return 0;
        }
        if (('chapterid_subid' in obj[a].data.chapterid && 'chapterid_subid' in obj[b].data.chapterid) !== true) {
          return 0;
        }

        if (obj[a].data.chapterid.chapterid_subid > obj[b].data.chapterid.chapterid_subid ) {
          return 1;
        } else if (obj[a].data.chapterid.chapterid_subid < obj[b].data.chapterid.chapterid_subid ){
          return -1;
        }

        if (obj[a].data.language.iso6392B > obj[b].data.language.iso6392B ) {
          return 1;
        } else if (obj[a].data.language.iso6392B < obj[b].data.language.iso6392B ) {
          return -1;
        }
        return 0;
      })
      .forEach((name, index) => {
        sorted[index] = obj[name]
      });
      console.log("start list")
      sorted.forEach((name, index) => {
        console.log(name.data.language.en,name.data.language.iso6392B);
        console.log(name.data.chapterid.chapterid_subid);
        console.log(name.data.url);
      });

    return sorted;

  });

  eleventyConfig.addFilter("groupedAndOrderedContribution", (obj) => {
    // Group by category
    let grouped = lodash.groupBy(obj, (obj) => obj.MainContirbutionCategory);

    // Define a custom order for groups
    let order = ["Writing","Editing","Technical","Translation","Visual","Data","Management","Public Relations","Research"];
    console.log(order);
    // Sort groups by custom order
    let sortedGroups = Object.fromEntries(
      order
        .filter((key) => grouped[key]) // Keep only existing groups
        .map((key) => [key, grouped[key]]) // Create ordered object
    );
    console.log(sortedGroups);
    return sortedGroups;
  });

  eleventyConfig.addPassthroughCopy({
    "src/site/_includes/css/*.css" : "assets/css",
    "src/site/_includes/js/*.js" : "assets/js",
    "src/site/_includes/favicons/*.png" : "assets/favicons",
    "src/site/_data/fonts/authentic-sans/*" : "assets/fonts/authentic-sans",
    "src/site/_data/fonts/lanapixel/*" : "assets/fonts/lanapixel",
    "src/site/_data/fonts/ChenYuluoyan/*" : "assets/fonts/ChenYuluoyan",
    "src/site/_data/fonts/iansui/*" : "assets/fonts/iansui",
    "src/site/_data/fonts/jost/*" : "assets/fonts/jost",
    "src/site/_data/fonts/inter/*" : "assets/fonts/inter",
  });

  eleventyConfig.addWatchTarget("_update_interval");

  return {
    dir: {
      input: "src/site",
      output: "dist",
      includes: "_includes",
      layouts: "_includes/layouts",
      data: "_data"
    }
  }
}
