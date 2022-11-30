const { assert } = require("chai");
const fs = require("fs");
const { KeywordSearch } = require("../public/scripts/keyword-search");
const { JSDOM } = require("jsdom");

// TODO !!! rename file to match naming convention of test on main branch

let symbols = [];
let keywordSearch;
const POPULAR = 3; // TODO move this to a common/consts file?

const sampleInputs = ["caafe", "caffee", "musum", "bik", "cro"];

/**
 * Notes:
 * For some reason, if using score=0.6, "musu sci" is not giving 'Science Museum' as a result
 * but "musu sie" and "musum scen" do
 * (with score=0.6, too many nonsensical results for other queries)
 * TODO add categories
 */
describe("getFuseResults test fixture", () => {
  fs.readFile("./test/test-data/symbols.json", "utf8", (err, jsonString) => {
    console.log("reading file with default symbols");
    if (err) {
      console.log("File read failed:", err);
      return;
    }

    const imagesJson = JSON.parse(jsonString);

    symbols = imagesJson
      .filter(({ ImageTypeID }) => ImageTypeID > POPULAR)
      .map(({ FileName }) => FileName);

    keywordSearch = new KeywordSearch(symbols);

    console.log(`loaded ${symbols.length} symbols into haystack`);
  });

  sampleInputs.forEach(function (inputWord) {
    describe("getFuseResults tests", () => {
      it("should return results from fuse.js fuzzy search", () => {
        console.log(`searching for "${inputWord}" in haystack`);
        const results = keywordSearch.getFuzzySearchResults(inputWord, symbols);
        assert.strictEqual(results.length > 0 && results.length < 15, true);
      });
    });
  });
});

describe("test find matches", () => {
  const filepath = "./test/test-data/default-result-index.html";
  const keywordSearch = new KeywordSearch([]);
  let imgHolders = [];

  const createMockActivityCells = () => {
    fs.readFile(filepath, "utf8", async (err, str) => {
      console.log("reading default final index html file");
      if (err) {
        console.log("File read failed:", err);
        return;
      }
      const dom = new JSDOM(str);
      const doc = dom.window.document;
      imgHolders = doc.getElementsByClassName("activity-img-holder");
    });
  };

  // TODO add categories to mimic app
  const initializeSearchHaystack = () => {
    fs.readFile(
      "./test/test-data/symbols.json",
      "utf8",
      async (err, jsonString) => {
        console.log("reading file with default symbols");
        if (err) {
          console.log("File read failed:", err);
          return;
        }

        console.log("parsing file for symbol objects");
        const imagesJson = JSON.parse(jsonString.toString());
        symbols = imagesJson.map(({ name }) => name);
        keywordSearch.haystack = symbols;
      }
    );
  };

  createMockActivityCells();
  initializeSearchHaystack();

  sampleInputs.forEach(function (input) {
    describe("test findMatches", () => {
      it("should return found matches", () => {
        const fuzzySearchResults = keywordSearch.getFuzzySearchResults(input);
        const results = keywordSearch.setMatches(
          Array.from(imgHolders),
          fuzzySearchResults
        );
        const grouped = keywordSearch.groupMatchedByCategory(results);
        for (const group of grouped) {
          console.log(group);
        }

        const atLeastOneMatch = grouped.reduce((accum, curr) => {
          accum ||= curr.matched;
          return accum;
        }, false);

        assert.isTrue(atLeastOneMatch);
      });
    });
  });
});
