export * from "./types/index";
import { FeedOptions, ItemOptions, Feed, Item, FeedNamespace } from "./types/index";
export declare class Podcast {
    feed: Feed;
    items: Item[];
    options: FeedOptions;
    constructor(options?: FeedOptions, items?: ReadonlyArray<ItemOptions>);
    protected getOptionDefaults(_options: FeedOptions): FeedOptions;
    protected getNamespaces(options: FeedOptions): FeedNamespace;
    protected getITunesFeedElements(options: FeedOptions): any[];
    init(options: FeedOptions, items?: ReadonlyArray<ItemOptions>): Feed;
    protected getITunesItemElements(itemOptions: ItemOptions): any[];
    addItem(itemOptions: ItemOptions): void;
    buildXml(options?: {
        indent?: string;
    }): string;
}
