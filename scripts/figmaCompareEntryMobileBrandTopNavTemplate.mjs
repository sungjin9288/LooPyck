export const fileKey = 'Oj35jzmgbwnxzpTTqTcxLi';

export const description =
  'Create SUN-10 CompareEntry/Mobile/Brand-Musinsa TopNav/Context slice in the existing Figma kickoff file';

export const code = String.raw`await figma.loadFontAsync({ family: 'Inter', style: 'Regular' });
await figma.loadFontAsync({ family: 'Inter', style: 'Medium' });
await figma.loadFontAsync({ family: 'Inter', style: 'Semi Bold' });
await figma.loadFontAsync({ family: 'Inter', style: 'Bold' });

let page = figma.root.children.find((candidate) => candidate.name === 'SUN-10 Compare Entry');
if (!page) {
  page = figma.root.children[0];
  page.name = 'SUN-10 Compare Entry';
}
await figma.setCurrentPageAsync(page);

const existing = page.findOne((node) => node.name === 'CompareEntry/Mobile/Brand-Musinsa');
if (existing) existing.remove();

const rgb = (hex) => {
  const normalized = hex.replace('#', '');
  return {
    r: parseInt(normalized.slice(0, 2), 16) / 255,
    g: parseInt(normalized.slice(2, 4), 16) / 255,
    b: parseInt(normalized.slice(4, 6), 16) / 255,
  };
};

const paint = (hex) => ({ type: 'SOLID', color: rgb(hex) });

const setText = (
  node,
  text,
  size,
  weight = 'Regular',
  color = '#FFFFFF',
  lineHeight = Math.round(size * 1.25),
) => {
  node.fontName = { family: 'Inter', style: weight };
  node.characters = text;
  node.fontSize = size;
  node.lineHeight = { unit: 'PIXELS', value: lineHeight };
  node.fills = [paint(color)];
};

let baseX = 160;
const desktopBrand = page.findOne((node) => node.name === 'CompareEntry/Desktop/Brand-Musinsa');
if (desktopBrand) baseX = desktopBrand.x;

const frame = figma.createFrame();
frame.name = 'CompareEntry/Mobile/Brand-Musinsa';
frame.resize(393, 852);
frame.x = baseX;
frame.y = 1120;
frame.fills = [paint('#0D1117')];
frame.layoutMode = 'VERTICAL';
frame.primaryAxisSizingMode = 'FIXED';
frame.counterAxisSizingMode = 'FIXED';
frame.itemSpacing = 0;
frame.paddingLeft = 18;
frame.paddingRight = 18;
frame.paddingTop = 20;
frame.paddingBottom = 28;
page.appendChild(frame);

const topNav = figma.createFrame();
topNav.name = 'TopNav/Context';
topNav.resize(357, 128);
topNav.fills = [paint('#111827')];
topNav.strokes = [paint('#243447')];
topNav.strokeWeight = 1;
topNav.cornerRadius = 24;
topNav.layoutMode = 'VERTICAL';
topNav.primaryAxisSizingMode = 'FIXED';
topNav.counterAxisSizingMode = 'FIXED';
topNav.primaryAxisAlignItems = 'CENTER';
topNav.counterAxisAlignItems = 'MIN';
topNav.paddingLeft = 18;
topNav.paddingRight = 18;
topNav.paddingTop = 16;
topNav.paddingBottom = 16;
topNav.itemSpacing = 14;
frame.appendChild(topNav);
topNav.layoutSizingHorizontal = 'FILL';

const identityRow = figma.createFrame();
identityRow.name = 'TopNav/Context/RouteIdentity';
identityRow.layoutMode = 'HORIZONTAL';
identityRow.primaryAxisSizingMode = 'AUTO';
identityRow.counterAxisSizingMode = 'AUTO';
identityRow.counterAxisAlignItems = 'CENTER';
identityRow.itemSpacing = 11;
identityRow.fills = [];
topNav.appendChild(identityRow);
identityRow.layoutSizingHorizontal = 'FILL';

const logo = figma.createFrame();
logo.name = 'TopNav/Context/LogoMark';
logo.resize(38, 38);
logo.cornerRadius = 13;
logo.fills = [paint('#F4FF3A')];
identityRow.appendChild(logo);

const logoText = figma.createText();
logoText.name = 'TopNav/Context/LogoInitial';
setText(logoText, 'L', 19, 'Bold', '#0D1117', 22);
logo.appendChild(logoText);
logoText.x = 13;
logoText.y = 8;

const copy = figma.createFrame();
copy.name = 'TopNav/Context/RouteCopy';
copy.layoutMode = 'VERTICAL';
copy.primaryAxisSizingMode = 'AUTO';
copy.counterAxisSizingMode = 'AUTO';
copy.itemSpacing = 3;
copy.fills = [];
identityRow.appendChild(copy);

const eyebrow = figma.createText();
eyebrow.name = 'TopNav/Context/Eyebrow';
setText(eyebrow, 'Brand Compare Entry', 12, 'Semi Bold', '#F4FF3A', 15);
copy.appendChild(eyebrow);

const title = figma.createText();
title.name = 'TopNav/Context/Title';
title.resize(250, 42);
setText(title, '무신사 비교 시작', 18, 'Bold', '#F8FAFC', 22);
copy.appendChild(title);

const rail = figma.createFrame();
rail.name = 'TopNav/Context/MobileStatusRail';
rail.layoutMode = 'HORIZONTAL';
rail.primaryAxisSizingMode = 'AUTO';
rail.counterAxisSizingMode = 'AUTO';
rail.counterAxisAlignItems = 'CENTER';
rail.itemSpacing = 8;
rail.fills = [];
topNav.appendChild(rail);
rail.layoutSizingHorizontal = 'FILL';

const chips = [
  ['MOBILE', '393'],
  ['ROUTE', '/brand/musinsa'],
  ['SUN-10', 'TopNav'],
];

for (const [label, value] of chips) {
  const chip = figma.createFrame();
  chip.name = \`TopNav/Context/Chip/\${label}\`;
  chip.layoutMode = 'VERTICAL';
  chip.primaryAxisSizingMode = 'AUTO';
  chip.counterAxisSizingMode = 'AUTO';
  chip.itemSpacing = 2;
  chip.paddingLeft = 10;
  chip.paddingRight = 10;
  chip.paddingTop = 7;
  chip.paddingBottom = 7;
  chip.cornerRadius = 13;
  chip.fills = [paint(label === 'SUN-10' ? '#1B2A1F' : '#182235')];
  chip.strokes = [paint(label === 'SUN-10' ? '#59D26F' : '#334155')];
  chip.strokeWeight = 1;
  rail.appendChild(chip);

  const chipLabel = figma.createText();
  chipLabel.name = \`TopNav/Context/Chip/\${label}/Label\`;
  setText(chipLabel, label, 9, 'Bold', label === 'SUN-10' ? '#86EFAC' : '#94A3B8', 11);
  chip.appendChild(chipLabel);

  const chipValue = figma.createText();
  chipValue.name = \`TopNav/Context/Chip/\${label}/Value\`;
  setText(chipValue, value, 10, 'Semi Bold', '#F8FAFC', 13);
  chip.appendChild(chipValue);
}

const placeholder = figma.createFrame();
placeholder.name = 'SUN-10 Remaining Sections Placeholder';
placeholder.resize(357, 650);
placeholder.fills = [paint('#0B1220')];
placeholder.strokes = [paint('#1E293B')];
placeholder.strokeWeight = 1;
placeholder.cornerRadius = 28;
placeholder.layoutMode = 'VERTICAL';
placeholder.primaryAxisSizingMode = 'FIXED';
placeholder.counterAxisSizingMode = 'FIXED';
placeholder.paddingLeft = 20;
placeholder.paddingRight = 20;
placeholder.paddingTop = 24;
placeholder.paddingBottom = 24;
placeholder.itemSpacing = 12;
frame.appendChild(placeholder);
placeholder.layoutSizingHorizontal = 'FILL';

const placeholderTitle = figma.createText();
placeholderTitle.name = 'SUN-10 Remaining Sections Placeholder/Title';
placeholderTitle.resize(300, 64);
setText(placeholderTitle, 'Mobile Brand sections remain pending', 22, 'Bold', '#E5E7EB', 27);
placeholder.appendChild(placeholderTitle);

const placeholderBody = figma.createText();
placeholderBody.name = 'SUN-10 Remaining Sections Placeholder/Body';
placeholderBody.resize(300, 88);
setText(
  placeholderBody,
  'This mobile frame intentionally contains only TopNav/Context. Continue with Hero/Search, QuickRoutes, CompareProof, SiblingNavigation, and ShortlistReentry before review approval.',
  14,
  'Regular',
  '#94A3B8',
  20,
);
placeholder.appendChild(placeholderBody);

return {
  pageId: page.id,
  pageName: page.name,
  createdNodeIds: [frame.id, topNav.id, placeholder.id],
  frameId: frame.id,
  sectionId: topNav.id,
  frameName: frame.name,
  completedSection: topNav.name,
  x: frame.x,
  y: frame.y,
};`;
