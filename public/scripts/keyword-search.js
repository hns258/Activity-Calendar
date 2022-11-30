const Fuse = require("fuse.js");
const path = require("path");

/* TODO Rename to ActivitySearch */
class KeywordSearch {
  constructor(haystack) {
    // Consider making these configurable in (Advanced) Settings page?
    this._fuseOptions = {
      includeScore: true,
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
    const imgTag = activityCell.getElementsByTagName("img")[0];
    const name = decodeURIComponent(imgTag.alt); // TODO check if there's a simpler way to decode w/o 3rd party lib https://stackoverflow.com/questions/1912501/unescape-html-entities-in-javascript?noredirect=1&lq=1
    const divTag = activityCell.getElementsByTagName("div")[0];
    const category = decodeURIComponent(divTag.getAttribute("data-category"));
    return {
      name: name,
      category: category,
      cell: activityCell,
    };
  }

  getFuzzySearchResults(input) {
    // Want to match "most" (percentage) of the characters provided
    this.minMatchCharLength = Math.floor(
      0.75 * input.replaceAll(" ", "").length
    );
    const fuseResults = this._fuse.search(input);
    console.debug(this._fuseOptions);
    console.log(`input: ${input}`);
    console.table(fuseResults);
    return fuseResults.map((result) => result.item);
  }

  setMatches(activityCells, fuzzySearchResults) {
    const activityObjects = activityCells.map((activityCell) =>
      this.extractActivityInfo(activityCell)
    );

    const matches = activityObjects.map((activityObj) => ({
      name: activityObj.name,
      category: activityObj.category,
      matched: fuzzySearchResults.some(
        (result) =>
          activityObj.name.includes(result) ||
          activityObj.category.includes(result)
      ),
      cell: activityObj.cell,
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
