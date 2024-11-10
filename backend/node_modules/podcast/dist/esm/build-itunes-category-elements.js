export const buildITunesCategoryElements = (categories) => {
    const arr = [];
    if (Array.isArray(categories)) {
        for (const category of categories) {
            if (category.subcats) {
                const elements = [
                    { _attr: { text: category.text } },
                ];
                const cats = buildITunesCategoryElements(category.subcats);
                elements.push(...cats);
                arr.push({ "itunes:category": elements });
            }
            else {
                arr.push({ "itunes:category": { _attr: { text: category.text } } });
            }
        }
    }
    return arr;
};
