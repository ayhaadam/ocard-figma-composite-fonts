"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
// Show UI
figma.showUI(__html__, { width: 300, height: 50 });
// Function to check if a character is Chinese
function iasChinese(char) {
    return /[\u4E00-\u9FFF]/.test(char);
}
// Function to get all unique fonts used in a text node
function getUniqueFonts(node) {
    const fonts = new Set();
    for (let i = 0; i < node.characters.length; i++) {
        const font = node.getRangeFontName(i, i + 1);
        fonts.add(JSON.stringify(font)); // Convert to string for Set uniqueness
    }
    return Array.from(fonts).map((font) => JSON.parse(font));
}
// Function to apply fonts
function applyFonts(nodes, fontOption) {
    return __awaiter(this, void 0, void 0, function* () {
        const fontCombinations = {
            normal: {
                chinese: { family: "PingFang TC", style: "Regular" },
                english: { family: "Montserrat", style: "Medium" }
            },
            bold: {
                chinese: { family: "PingFang TC", style: "Medium" },
                english: { family: "Montserrat", style: "SemiBold" }
            }
        };
        const chineseFontName = fontCombinations[fontOption].chinese;
        const englishFontName = fontCombinations[fontOption].english;
        for (const node of nodes) {
            if (node.type === "TEXT") {
                let ranges = [];
                let start = 0;
                let isChinese = false;
                // Get all unique fonts used in the node
                const uniqueFonts = getUniqueFonts(node);
                // Load all current fonts used in the node
                yield Promise.all(uniqueFonts.map(font => figma.loadFontAsync(font)));
                // Load both fonts
                yield Promise.all([
                    figma.loadFontAsync(chineseFontName),
                    figma.loadFontAsync(englishFontName)
                ]);
                // Iterate through each character to determine ranges
                for (let i = 0; i < node.characters.length; i++) {
                    const currentIsChinese = iasChinese(node.characters[i]);
                    if (i === 0) {
                        isChinese = currentIsChinese;
                    }
                    else if (currentIsChinese !== isChinese) {
                        ranges.push({ start, end: i, isChinese });
                        start = i;
                        isChinese = currentIsChinese;
                    }
                }
                // Add the last range
                ranges.push({ start, end: node.characters.length, isChinese });
                // Apply fonts to each range
                ranges.forEach(range => {
                    node.setRangeFontName(range.start, range.end, range.isChinese ? chineseFontName : englishFontName);
                });
            }
        }
    });
}
// Listen for messages from the UI
figma.ui.onmessage = (msg) => __awaiter(void 0, void 0, void 0, function* () {
    if (msg.type === 'apply-fonts') {
        const selectedNodes = figma.currentPage.selection;
        if (selectedNodes.length === 0) {
            figma.notify("未選擇任何元件");
            return;
        }
        yield applyFonts(selectedNodes, msg.fontOption);
        // figma.notify(`Applied mixed fonts to ${selectedNodes.length} selected layers`);
    }
    // Don't close the plugin after applying fonts
    // figma.closePlugin();
});
