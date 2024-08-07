// Show UI
figma.showUI(__html__, { width: 300, height: 50 });

// Function to check if a character is Chinese
function iasChinese(char: string) {
  return /[\u4E00-\u9FFF]/.test(char);
}

// Function to get all unique fonts used in a text node
function getUniqueFonts(node: any) {
  const fonts = new Set();
  for (let i = 0; i < node.characters.length; i++) {
    const font = node.getRangeFontName(i, i + 1);
    fonts.add(JSON.stringify(font)); // Convert to string for Set uniqueness
  }
  return Array.from(fonts).map((font: any) => JSON.parse(font));
}

// Function to apply fonts
async function applyFonts(nodes: any, fontOption: any) {
  const fontCombinations: any = {
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
      await Promise.all(uniqueFonts.map(font => figma.loadFontAsync(font)));

      // Load both fonts
      await Promise.all([
        figma.loadFontAsync(chineseFontName),
        figma.loadFontAsync(englishFontName)
      ]);

      // Iterate through each character to determine ranges
      for (let i = 0; i < node.characters.length; i++) {
        const currentIsChinese = iasChinese(node.characters[i]);
        if (i === 0) {
          isChinese = currentIsChinese;
        } else if (currentIsChinese !== isChinese) {
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
}

// Listen for messages from the UI
figma.ui.onmessage = async msg => {
  if (msg.type === 'apply-fonts') {
    const selectedNodes = figma.currentPage.selection;

    if (selectedNodes.length === 0) {
      figma.notify("Please select at least one text layer");
      return;
    }

    await applyFonts(selectedNodes, msg.fontOption);
    figma.notify(`Applied mixed fonts to ${selectedNodes.length} selected layers`);
  }

  // Don't close the plugin after applying fonts
  // figma.closePlugin();
};