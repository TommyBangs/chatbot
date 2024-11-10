export * from "./types/index";
import RSS from "rss";
import deprecate from "./deprecate";
import { buildITunesCategoryElements } from "./build-itunes-category-elements";
import { buildSimpleChaptersElement } from "./build-simple-chapters-element";
import durationFormat from "./duration-format";
export class Podcast {
    constructor(options = {}, items = []) {
        this.items = [];
        this.options = {};
        this.options = this.getOptionDefaults(options);
        this.feed = this.init(this.options, items);
    }
    getOptionDefaults(_options) {
        const options = Object.assign(Object.assign({}, _options), { title: _options.title || "Untitled Podcast Feed", description: _options.description || "", feedUrl: _options.feedUrl || "", siteUrl: _options.siteUrl || "", generator: _options.generator || "Podcast for Node", customElements: _options.customElements || [], customNamespaces: Object.assign({}, _options.customNamespaces) });
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
        var _a, _b, _c;
        const namespaces = Object.assign({}, options.customNamespaces);
        if ((_a = options.namespaces) === null || _a === void 0 ? void 0 : _a.iTunes) {
            namespaces.itunes = "http://www.itunes.com/dtds/podcast-1.0.dtd";
        }
        if ((_b = options.namespaces) === null || _b === void 0 ? void 0 : _b.simpleChapters) {
            namespaces.psc = "http://podlove.org/simple-chapters";
        }
        if ((_c = options.namespaces) === null || _c === void 0 ? void 0 : _c.podcast) {
            namespaces.podcast = "https://podcastindex.org/namespace/1.0";
        }
        return namespaces;
    }
    getITunesFeedElements(options) {
        var _a, _b;
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
                { "itunes:name": ((_a = options.itunesOwner) === null || _a === void 0 ? void 0 : _a.name) || "" },
                { "itunes:email": ((_b = options.itunesOwner) === null || _b === void 0 ? void 0 : _b.email) || "" },
            ],
        });
        customElements.push({
            "itunes:explicit": typeof options.itunesExplicit === "boolean" ? !!options.itunesExplicit : options.itunesExplicit || false,
        });
        if (options.itunesCategory) {
            const categories = buildITunesCategoryElements(options.itunesCategory);
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
        var _a;
        const feed = Object.assign({}, this.options);
        feed.customNamespaces = Object.assign({}, this.getNamespaces(options));
        if ((_a = options.namespaces) === null || _a === void 0 ? void 0 : _a.iTunes) {
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
                "itunes:duration": durationFormat(itemOptions.itunesDuration),
            });
        }
        if (itemOptions.itunesKeywords) {
            deprecate({ name: "itunesKeywords", type: "option" });
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
        var _a, _b;
        const item = Object.assign({}, itemOptions);
        item.customElements = item.customElements || [];
        if (itemOptions.content) {
            item.customElements.push({
                "content:encoded": {
                    _cdata: itemOptions.content,
                },
            });
        }
        if ((_a = this.options.namespaces) === null || _a === void 0 ? void 0 : _a.iTunes) {
            item.customElements = [
                ...(item.customElements || []),
                ...this.getITunesItemElements(itemOptions),
            ];
        }
        if (((_b = this.options.namespaces) === null || _b === void 0 ? void 0 : _b.simpleChapters) && itemOptions.pscChapters) {
            item.customElements = [
                ...(item.customElements || []),
                buildSimpleChaptersElement(itemOptions.pscChapters),
            ];
        }
        this.items.push(item);
        return;
    }
    buildXml(options = {}) {
        const rss = new RSS(Object.assign(Object.assign({}, this.feed), { feed_url: this.feed.feedUrl, site_url: this.feed.siteUrl, custom_elements: this.feed.customElements, custom_namespaces: this.feed.customNamespaces }));
        this.items.forEach((item) => rss.item(Object.assign(Object.assign({}, item), { custom_elements: item.customElements })));
        return rss.xml(options);
    }
}
