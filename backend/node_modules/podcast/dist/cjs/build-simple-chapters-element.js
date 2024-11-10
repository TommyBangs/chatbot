"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildSimpleChaptersElement = void 0;
const buildSimpleChaptersElement = (chapters) => {
    const chaptersElement = {
        "psc:chapters": [
            {
                _attr: {
                    version: chapters.version,
                    "xmlns:psc": "http://podlove.org/simple-chapters",
                },
            },
        ],
    };
    if (Array.isArray(chapters.chapter)) {
        for (const chapter of chapters.chapter) {
            const chapterElement = {
                "psc:chapter": {
                    _attr: chapter,
                },
            };
            chaptersElement["psc:chapters"].push(chapterElement);
        }
    }
    return chaptersElement;
};
exports.buildSimpleChaptersElement = buildSimpleChaptersElement;
