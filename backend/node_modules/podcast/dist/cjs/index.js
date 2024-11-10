"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Podcast = void 0;
__exportStar(require("./types/index"), exports);
const rss_1 = __importDefault(require("rss"));
const deprecate_1 = __importDefault(require("./deprecate"));
const build_itunes_category_elements_1 = require("./build-itunes-category-elements");
const build_simple_chapters_element_1 = require("./build-simple-chapters-element");
const duration_format_1 = __importDefault(require("./duration-format"));
class Podcast {
    constructor(options = {}, items = []) {
        this.items = [];
        this.options = {};
        this.options = this.getOptionDefaults(options);
        this.feed = this.init(this.options, items);
    }
    getOptionDefaults(_options) {
        const options = {
            ..._options,
            title: _options.title || "Untitled Podcast Feed",
            description: _options.description || "",
            feedUrl: _options.feedUrl || "",
            siteUrl: _options.siteUrl || "",
            generator: _options.generator || "Podcast for Node",
            customElements: _options.customElements || [],
            customNamespaces: {
                ..._options.customNamespaces,
            },
        };
        options.itunesOwner = options.itunesOwner || {
            name: options.author || "",
            email: "",
        };
        options.namespaces = options.namespaces || {};
        if (typeof options.namespaces.iTunes === "undefined") {
            options.namespaces.iTunes = true;
        }
        if (typeof options.namespaces.podcast === "undefined") {
            options.namespaces.podcast = true;
        }
        if (typeof options.namespaces.simpleChapters === "undefined") {
            options.namespaces.simpleChapters = true;
        }
        return options;
    }
    getNamespaces(options) {
        const namespaces = {
            ...options.customNamespaces,
        };
        if (options.namespaces?.iTunes) {
            namespaces.itunes = "http://www.itunes.com/dtds/podcast-1.0.dtd";
        }
        if (options.namespaces?.simpleChapters) {
            namespaces.psc = "http://podlove.org/simple-chapters";
        }
        if (options.namespaces?.podcast) {
            namespaces.podcast = "https://podcastindex.org/namespace/1.0";
        }
        return namespaces;
    }
    getITunesFeedElements(options) {
        const customElements = [];
        if (options.itunesAuthor || options.author) {
            customElements.push({
                "itunes:author": options.itunesAuthor || options.author,
            });
        }
        if (options.itunesSubtitle) {
            customElements.push({
                "itunes:subtitle": options.itunesSubtitle,
            });
        }
        if (options.itunesSummary || options.description) {
            customElements.push({
                "itunes:summary": options.itunesSummary || options.description,
            });
        }
        if (options.itunesType) {
            customElements.push({
                "itunes:type": options.itunesType,
            });
        }
        customElements.push({
            "itunes:owner": [
                { "itunes:name": options.itunesOwner?.name || "" },
                { "itunes:email": options.itunesOwner?.email || "" },
            ],
        });
        customElements.push({
            "itunes:explicit": typeof options.itunesExplicit === "boolean" ? !!options.itunesExplicit : options.itunesExplicit || false,
        });
        if (options.itunesCategory) {
            const categories = (0, build_itunes_category_elements_1.buildITunesCategoryElements)(options.itunesCategory);
            categories.forEach((category) => {
                customElements.push(category);
            });
        }
        if (options.itunesImage || options.imageUrl) {
            customElements.push({
                "itunes:image": {
                    _attr: {
                        href: options.itunesImage || options.imageUrl,
                    },
                },
            });
        }
        return customElements;
    }
    init(options, items = []) {
        const feed = {
            ...this.options,
        };
        feed.customNamespaces = {
            ...this.getNamespaces(options),
        };
        if (options.namespaces?.iTunes) {
            feed.customElements = [
                ...(feed.customElements || []),
                ...this.getITunesFeedElements(options),
            ];
        }
        this.items = [];
        const initialItems = items;
        initialItems.forEach((item) => this.addItem(item));
        return feed;
    }
    getITunesItemElements(itemOptions) {
        const customElements = [];
        if (itemOptions.itunesAuthor || itemOptions.author) {
            customElements.push({
                "itunes:author": itemOptions.itunesAuthor || itemOptions.author,
            });
        }
        if (itemOptions.itunesSubtitle) {
            customElements.push({
                "itunes:subtitle": itemOptions.itunesSubtitle,
            });
        }
        if (itemOptions.itunesSummary || itemOptions.description) {
            customElements.push({
                "itunes:summary": itemOptions.itunesSummary || itemOptions.description,
            });
        }
        customElements.push({
            "itunes:explicit": typeof itemOptions.itunesExplicit === "boolean" ? !!itemOptions.itunesExplicit : itemOptions.itunesExplicit || false,
        });
        if (itemOptions.itunesDuration) {
            customElements.push({
                "itunes:duration": (0, duration_format_1.default)(itemOptions.itunesDuration),
            });
        }
        if (itemOptions.itunesKeywords) {
            (0, deprecate_1.default)({ name: "itunesKeywords", type: "option" });
            customElements.push({
                "itunes:keywords": itemOptions.itunesKeywords,
            });
        }
        if (itemOptions.itunesImage || itemOptions.imageUrl) {
            customElements.push({
                "itunes:image": {
                    _attr: {
                        href: itemOptions.itunesImage || itemOptions.imageUrl,
                    },
                },
            });
        }
        if (itemOptions.itunesSeason)
            customElements.push({ "itunes:season": itemOptions.itunesSeason });
        if (itemOptions.itunesEpisode)
            customElements.push({ "itunes:episode": itemOptions.itunesEpisode });
        if (itemOptions.itunesTitle)
            customElements.push({ "itunes:title": itemOptions.itunesTitle });
        if (itemOptions.itunesEpisodeType) {
            customElements.push({
                "itunes:episodeType": itemOptions.itunesEpisodeType,
            });
        }
        if (itemOptions.itunesNewFeedUrl) {
            customElements.push({
                "itunes:new-feed-url": itemOptions.itunesNewFeedUrl,
            });
        }
        return customElements;
    }
    addItem(itemOptions) {
        const item = { ...itemOptions };
        item.customElements = item.customElements || [];
        if (itemOptions.content) {
            item.customElements.push({
                "content:encoded": {
                    _cdata: itemOptions.content,
                },
            });
        }
        if (this.options.namespaces?.iTunes) {
            item.customElements = [
                ...(item.customElements || []),
                ...this.getITunesItemElements(itemOptions),
            ];
        }
        if (this.options.namespaces?.simpleChapters && itemOptions.pscChapters) {
            item.customElements = [
                ...(item.customElements || []),
                (0, build_simple_chapters_element_1.buildSimpleChaptersElement)(itemOptions.pscChapters),
            ];
        }
        this.items.push(item);
        return;
    }
    buildXml(options = {}) {
        const rss = new rss_1.default({
            ...this.feed,
            feed_url: this.feed.feedUrl,
            site_url: this.feed.siteUrl,
            custom_elements: this.feed.customElements,
            custom_namespaces: this.feed.customNamespaces,
        });
        this.items.forEach((item) => rss.item({
            ...item,
            custom_elements: item.customElements,
        }));
        return rss.xml(options);
    }
}
exports.Podcast = Podcast;
