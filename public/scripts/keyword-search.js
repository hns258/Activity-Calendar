const Fuse = require("fuse.js");
const path = require("path");
// const path = require("path");

/* TODO Rename to ActivitySearch */
class KeywordSearch {
  constructor(haystack) {
    // Consider making these configurable in (Advanced) Settings page?
    this._fuseOptions = {
      includeScore: true,
      minMatchCharLength: 3,
      threshold: 0.6,
      ignoreLocation: true,
      ignoreFieldNorm: true,
      isCaseSensitive: false,
    };
    this._fuse = new Fuse(haystack, this._fuseOptions);
    this._haystack = haystack;
  }

  set haystack(newHaystack) {
    this._fuse = new Fuse(newHaystack, this._fuseOptions);
    this._haystack = newHaystack;
  }

  set minMatchCharLength(value) {
    this._fuseOptions.minMatchCharLength = value;
    this._fuse = new Fuse(this._haystack, this._fuseOptions);
  }

  /*
   * Helper function to extract specific information from HTML `<td>` tags
   * containing activity symbols. This information is needed to find matches between
   * activities and fuzzy search results.
   *
   * @param activityCell - HTML element tag housing an activity symbol
   * @returns Object containing any separate info needed and the activityCell itself
   * */
  extractActivityInfo(activityCell) {
    const imageSrc = activityCell.getElementsByTagName("img")[0].src;
    const imgSrc = decodeURI(imageSrc).toLowerCase();
    const parsedPath = path.parse(imgSrc);
    const category = path.basename(parsedPath.dir);
    return { src: imgSrc, category: category, cell: activityCell };
  }

  getFuzzySearchResults(input) {
    this.minMatchCharLength = Math.floor(0.75 * input.replaceAll(" ", "").length);
    const fuseResults = this._fuse.search(input);
    console.debug(this._fuseOptions);
    console.log(`input: ${input}`);
    console.table(fuseResults);
    return fuseResults.map((result) => result.item.toLowerCase());
  }

  setMatches(activityCells, fuzzySearchResults) {
    const activityObjects = activityCells.map((activity) =>
      this.extractActivityInfo(activity)
    );
    const matches = activityObjects.map((activity) => ({
      category: activity.category,
      matched: fuzzySearchResults.some((result) =>
        activity.src.includes(result)
      ),
      src: activity.src,
      cell: activity.cell,
    }));

    console.table(matches);
    return matches;
  }

  groupMatchedByCategory(activityObjects) {
    const result = [];
    activityObjects.reduce((accum, curr) => {
      if (!accum[curr.category]) {
        accum[curr.category] = { category: curr.category, matched: false };
        result.push(accum[curr.category]);
      }
      accum[curr.category].matched ||= curr.matched;
      return accum;
    }, {});
    return result;
  }
}

module.exports = {
  KeywordSearch,
};
