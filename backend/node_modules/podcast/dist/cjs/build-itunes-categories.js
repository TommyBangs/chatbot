"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildITunesCategories = void 0;
const buildITunesCategories = (categories) => {
    const arr = [];
    if (Array.isArray(categories)) {
        categories.forEach((category) => {
            if (category.subcats) {
                const elements = [
                    { _attr: { text: category.text } },
                ];
                const cats = (0, exports.buildITunesCategories)(category.subcats);
                elements.push(...cats);
                // cats.forEach((cat) => {
                //   elements.push(cat);
                // });
                arr.push({ "itunes:category": elements });
            }
            else {
                arr.push({ "itunes:category": { _attr: { text: category.text } } });
            }
        });
    }
    return arr;
};
exports.buildITunesCategories = buildITunesCategories;
