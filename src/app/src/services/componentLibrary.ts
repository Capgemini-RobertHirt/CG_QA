/**
 * Component Library - Standard reusable components for template construction
 * Each component defines structure, properties, and subcomponents
 */

export interface ComponentProperty {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'color' | 'select' | 'size';
  label: string;
  description: string;
  default?: any;
  required?: boolean;
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  validation?: string; // regex pattern or validation rule
}

export interface Subcomponent {
  id: string;
  name: string;
  category: 'text' | 'layout' | 'media' | 'special';
  description: string;
  icon: string;
  properties: ComponentProperty[];
  required: boolean;
  multiple: boolean; // Can be used multiple times in parent
  maxInstances?: number;
}

export interface Component {
  id: string;
  name: string;
  category: 'text' | 'layout' | 'media' | 'special' | 'container';
  description: string;
  icon: string;
  properties: ComponentProperty[];
  subcomponents: Subcomponent[];
  required: boolean;
  maxInstances?: number;
}

// Standard text components
const TITLE_COMPONENT: Subcomponent = {
  id: 'title',
  name: 'Title',
  category: 'text',
  icon: '📝',
  description: 'Main heading for section',
  properties: [
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Size of the title',
      default: '24px',
      options: [
        { value: '20px', label: 'Small (20px)' },
        { value: '24px', label: 'Medium (24px)' },
        { value: '28px', label: 'Large (28px)' },
        { value: '32px', label: 'Extra Large (32px)' },
      ],
    },
    {
      name: 'fontWeight',
      type: 'select',
      label: 'Font Weight',
      description: 'Boldness of the title',
      default: 'bold',
      options: [
        { value: 'normal', label: 'Normal' },
        { value: 'bold', label: 'Bold' },
        { value: '900', label: 'Extra Bold' },
      ],
    },
    {
      name: 'color',
      type: 'color',
      label: 'Color',
      description: 'Title text color',
      default: '#000000',
    },
    {
      name: 'alignment',
      type: 'select',
      label: 'Alignment',
      description: 'Text alignment',
      default: 'left',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    },
    {
      name: 'marginBottom',
      type: 'size',
      label: 'Bottom Margin',
      description: 'Space below title',
      default: '16px',
    },
  ],
  required: true,
  multiple: false,
};

const PARAGRAPH_COMPONENT: Subcomponent = {
  id: 'paragraph',
  name: 'Paragraph',
  category: 'text',
  icon: '¶',
  description: 'Body text content',
  properties: [
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Size of paragraph text',
      default: '12px',
      options: [
        { value: '10px', label: 'Small (10px)' },
        { value: '12px', label: 'Medium (12px)' },
        { value: '14px', label: 'Large (14px)' },
      ],
    },
    {
      name: 'lineHeight',
      type: 'select',
      label: 'Line Height',
      description: 'Space between lines',
      default: '1.5',
      options: [
        { value: '1.2', label: 'Tight (1.2)' },
        { value: '1.5', label: 'Normal (1.5)' },
        { value: '1.8', label: 'Loose (1.8)' },
        { value: '2', label: 'Extra Loose (2)' },
      ],
    },
    {
      name: 'color',
      type: 'color',
      label: 'Color',
      description: 'Text color',
      default: '#333333',
    },
    {
      name: 'maxWidth',
      type: 'size',
      label: 'Max Width',
      description: 'Maximum line width',
      default: '100%',
    },
  ],
  required: false,
  multiple: true,
};

const BULLET_LIST_COMPONENT: Subcomponent = {
  id: 'bulletList',
  name: 'Bullet List',
  category: 'text',
  icon: '• •',
  description: 'Unordered list of items',
  properties: [
    {
      name: 'itemCount',
      type: 'number',
      label: 'Number of Items',
      description: 'Expected number of items',
      default: 5,
      min: 1,
      max: 20,
    },
    {
      name: 'bulletStyle',
      type: 'select',
      label: 'Bullet Style',
      description: 'Style of bullet points',
      default: 'circle',
      options: [
        { value: 'circle', label: 'Circle' },
        { value: 'square', label: 'Square' },
        { value: 'diamond', label: 'Diamond' },
        { value: 'dash', label: 'Dash' },
      ],
    },
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Text size in list',
      default: '12px',
    },
    {
      name: 'spacing',
      type: 'size',
      label: 'Item Spacing',
      description: 'Space between items',
      default: '8px',
    },
  ],
  required: false,
  multiple: true,
};

const NUMBERED_LIST_COMPONENT: Subcomponent = {
  id: 'numberedList',
  name: 'Numbered List',
  category: 'text',
  icon: '1 2',
  description: 'Ordered list of items',
  properties: [
    {
      name: 'itemCount',
      type: 'number',
      label: 'Number of Items',
      description: 'Expected number of items',
      default: 5,
      min: 1,
      max: 20,
    },
    {
      name: 'numberFormat',
      type: 'select',
      label: 'Number Format',
      description: 'Format of numbering',
      default: '1.',
      options: [
        { value: '1.', label: 'Decimal (1.)' },
        { value: 'a.', label: 'Letter (a.)' },
        { value: 'A.', label: 'Capital Letter (A.)' },
        { value: 'i.', label: 'Roman (i.)' },
      ],
    },
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Text size in list',
      default: '12px',
    },
    {
      name: 'spacing',
      type: 'size',
      label: 'Item Spacing',
      description: 'Space between items',
      default: '8px',
    },
  ],
  required: false,
  multiple: true,
};

const HEADING_COMPONENT: Subcomponent = {
  id: 'heading',
  name: 'Heading',
  category: 'text',
  icon: '📌',
  description: 'Section subheading',
  properties: [
    {
      name: 'level',
      type: 'select',
      label: 'Heading Level',
      description: 'Hierarchy level',
      default: 'h2',
      options: [
        { value: 'h2', label: 'Level 2 (H2)' },
        { value: 'h3', label: 'Level 3 (H3)' },
        { value: 'h4', label: 'Level 4 (H4)' },
      ],
    },
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Size of heading',
      default: '18px',
    },
    {
      name: 'color',
      type: 'color',
      label: 'Color',
      description: 'Heading color',
      default: '#003366',
    },
    {
      name: 'underline',
      type: 'boolean',
      label: 'Underline',
      description: 'Add underline',
      default: false,
    },
  ],
  required: false,
  multiple: true,
};

// Layout components
const CARD_COMPONENT: Component = {
  id: 'card',
  name: 'Card',
  category: 'layout',
  icon: '📦',
  description: 'Container with border and shadow',
  properties: [
    {
      name: 'backgroundColor',
      type: 'color',
      label: 'Background Color',
      description: 'Card background',
      default: '#FFFFFF',
    },
    {
      name: 'borderColor',
      type: 'color',
      label: 'Border Color',
      description: 'Card border color',
      default: '#CCCCCC',
    },
    {
      name: 'borderWidth',
      type: 'size',
      label: 'Border Width',
      description: 'Thickness of border',
      default: '1px',
    },
    {
      name: 'padding',
      type: 'size',
      label: 'Padding',
      description: 'Internal spacing',
      default: '16px',
    },
    {
      name: 'borderRadius',
      type: 'size',
      label: 'Border Radius',
      description: 'Corner rounding',
      default: '4px',
    },
    {
      name: 'shadow',
      type: 'boolean',
      label: 'Drop Shadow',
      description: 'Add shadow effect',
      default: true,
    },
  ],
  subcomponents: [TITLE_COMPONENT, PARAGRAPH_COMPONENT, BULLET_LIST_COMPONENT],
  required: false,
};

const COLUMN_COMPONENT: Component = {
  id: 'column',
  name: 'Column Layout',
  category: 'layout',
  icon: '⊢⊣',
  description: 'Multi-column layout container',
  properties: [
    {
      name: 'columnCount',
      type: 'number',
      label: 'Number of Columns',
      description: 'How many columns',
      default: 2,
      min: 1,
      max: 4,
    },
    {
      name: 'columnGap',
      type: 'size',
      label: 'Column Gap',
      description: 'Space between columns',
      default: '20px',
    },
    {
      name: 'columnWidthEqual',
      type: 'boolean',
      label: 'Equal Width',
      description: 'Make all columns equal width',
      default: true,
    },
  ],
  subcomponents: [PARAGRAPH_COMPONENT, BULLET_LIST_COMPONENT, HEADING_COMPONENT],
  required: false,
};

const GRID_COMPONENT: Component = {
  id: 'grid',
  name: 'Grid Layout',
  category: 'layout',
  icon: '⊞⊞',
  description: 'Multi-row multi-column grid',
  properties: [
    {
      name: 'rows',
      type: 'number',
      label: 'Number of Rows',
      description: 'Grid rows',
      default: 3,
      min: 1,
      max: 10,
    },
    {
      name: 'columns',
      type: 'number',
      label: 'Number of Columns',
      description: 'Grid columns',
      default: 3,
      min: 1,
      max: 6,
    },
    {
      name: 'gap',
      type: 'size',
      label: 'Cell Gap',
      description: 'Space between cells',
      default: '16px',
    },
  ],
  subcomponents: [TITLE_COMPONENT, PARAGRAPH_COMPONENT],
  required: false,
};

// Media components
const IMAGE_COMPONENT: Component = {
  id: 'image',
  name: 'Image',
  category: 'media',
  icon: '🖼️',
  description: 'Image or screenshot',
  properties: [
    {
      name: 'width',
      type: 'size',
      label: 'Width',
      description: 'Image width',
      default: '100%',
    },
    {
      name: 'height',
      type: 'size',
      label: 'Height',
      description: 'Image height (auto for aspect ratio)',
      default: 'auto',
    },
    {
      name: 'alignment',
      type: 'select',
      label: 'Alignment',
      description: 'Image alignment',
      default: 'center',
      options: [
        { value: 'left', label: 'Left' },
        { value: 'center', label: 'Center' },
        { value: 'right', label: 'Right' },
      ],
    },
    {
      name: 'caption',
      type: 'boolean',
      label: 'Include Caption',
      description: 'Add text caption below image',
      default: true,
    },
    {
      name: 'border',
      type: 'boolean',
      label: 'Add Border',
      description: 'Border around image',
      default: false,
    },
  ],
  subcomponents: [],
  required: false,
};

const TABLE_COMPONENT: Component = {
  id: 'table',
  name: 'Table',
  category: 'media',
  icon: '⊞⊟',
  description: 'Data table with rows and columns',
  properties: [
    {
      name: 'rows',
      type: 'number',
      label: 'Number of Rows',
      description: 'Table rows (including header)',
      default: 5,
      min: 2,
      max: 20,
    },
    {
      name: 'columns',
      type: 'number',
      label: 'Number of Columns',
      description: 'Table columns',
      default: 4,
      min: 1,
      max: 10,
    },
    {
      name: 'hasHeader',
      type: 'boolean',
      label: 'Header Row',
      description: 'First row is header',
      default: true,
    },
    {
      name: 'striped',
      type: 'boolean',
      label: 'Striped Rows',
      description: 'Alternate row colors',
      default: true,
    },
    {
      name: 'headerColor',
      type: 'color',
      label: 'Header Color',
      description: 'Header background color',
      default: '#003366',
    },
  ],
  subcomponents: [],
  required: false,
};

const CHART_COMPONENT: Component = {
  id: 'chart',
  name: 'Chart/Graph',
  category: 'media',
  icon: '📊',
  description: 'Data visualization chart',
  properties: [
    {
      name: 'chartType',
      type: 'select',
      label: 'Chart Type',
      description: 'Type of chart',
      default: 'bar',
      options: [
        { value: 'bar', label: 'Bar Chart' },
        { value: 'line', label: 'Line Chart' },
        { value: 'pie', label: 'Pie Chart' },
        { value: 'area', label: 'Area Chart' },
      ],
    },
    {
      name: 'width',
      type: 'size',
      label: 'Width',
      description: 'Chart width',
      default: '100%',
    },
    {
      name: 'height',
      type: 'size',
      label: 'Height',
      description: 'Chart height',
      default: '300px',
    },
    {
      name: 'legend',
      type: 'boolean',
      label: 'Show Legend',
      description: 'Display legend',
      default: true,
    },
    {
      name: 'grid',
      type: 'boolean',
      label: 'Show Grid',
      description: 'Background grid lines',
      default: true,
    },
  ],
  subcomponents: [],
  required: false,
};

// Special components
const CODE_BLOCK_COMPONENT: Component = {
  id: 'codeBlock',
  name: 'Code Block',
  category: 'special',
  icon: '{ }',
  description: 'Formatted code snippet',
  properties: [
    {
      name: 'language',
      type: 'select',
      label: 'Language',
      description: 'Programming language',
      default: 'javascript',
      options: [
        { value: 'javascript', label: 'JavaScript' },
        { value: 'typescript', label: 'TypeScript' },
        { value: 'python', label: 'Python' },
        { value: 'java', label: 'Java' },
        { value: 'sql', label: 'SQL' },
        { value: 'html', label: 'HTML' },
        { value: 'css', label: 'CSS' },
      ],
    },
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Code text size',
      default: '11px',
    },
    {
      name: 'lineNumbers',
      type: 'boolean',
      label: 'Line Numbers',
      description: 'Show line numbers',
      default: true,
    },
    {
      name: 'highlight',
      type: 'boolean',
      label: 'Syntax Highlighting',
      description: 'Enable syntax highlighting',
      default: true,
    },
  ],
  subcomponents: [],
  required: false,
};

const TIMELINE_COMPONENT: Component = {
  id: 'timeline',
  name: 'Timeline',
  category: 'special',
  icon: '─→',
  description: 'Timeline with events/milestones',
  properties: [
    {
      name: 'orientation',
      type: 'select',
      label: 'Orientation',
      description: 'Timeline direction',
      default: 'vertical',
      options: [
        { value: 'vertical', label: 'Vertical' },
        { value: 'horizontal', label: 'Horizontal' },
      ],
    },
    {
      name: 'itemCount',
      type: 'number',
      label: 'Number of Items',
      description: 'Timeline events',
      default: 4,
      min: 2,
      max: 12,
    },
    {
      name: 'dotSize',
      type: 'size',
      label: 'Dot Size',
      description: 'Size of timeline dots',
      default: '12px',
    },
    {
      name: 'dotColor',
      type: 'color',
      label: 'Dot Color',
      description: 'Timeline dot color',
      default: '#003366',
    },
    {
      name: 'lineColor',
      type: 'color',
      label: 'Line Color',
      description: 'Timeline line color',
      default: '#CCCCCC',
    },
  ],
  subcomponents: [TITLE_COMPONENT, PARAGRAPH_COMPONENT],
  required: false,
};

const CALLOUT_COMPONENT: Component = {
  id: 'callout',
  name: 'Callout Box',
  category: 'special',
  icon: '❗',
  description: 'Highlighted callout or alert box',
  properties: [
    {
      name: 'type',
      type: 'select',
      label: 'Callout Type',
      description: 'Type of callout',
      default: 'info',
      options: [
        { value: 'info', label: 'Information' },
        { value: 'warning', label: 'Warning' },
        { value: 'success', label: 'Success' },
        { value: 'error', label: 'Error' },
        { value: 'tip', label: 'Tip' },
      ],
    },
    {
      name: 'backgroundColor',
      type: 'color',
      label: 'Background Color',
      description: 'Callout background',
      default: '#E3F2FD',
    },
    {
      name: 'borderColor',
      type: 'color',
      label: 'Border Color',
      description: 'Left border color',
      default: '#1976D2',
    },
    {
      name: 'icon',
      type: 'select',
      label: 'Icon',
      description: 'Callout icon',
      default: 'ⓘ',
      options: [
        { value: 'ⓘ', label: 'Info' },
        { value: '⚠️', label: 'Warning' },
        { value: '✓', label: 'Checkmark' },
        { value: '✕', label: 'X' },
        { value: '💡', label: 'Lightbulb' },
      ],
    },
  ],
  subcomponents: [TITLE_COMPONENT, PARAGRAPH_COMPONENT],
  required: false,
};

const QUOTE_COMPONENT: Component = {
  id: 'quote',
  name: 'Quote/Citation',
  category: 'special',
  icon: '❝ ❞',
  description: 'Quoted text with attribution',
  properties: [
    {
      name: 'fontSize',
      type: 'size',
      label: 'Font Size',
      description: 'Quote text size',
      default: '14px',
    },
    {
      name: 'quoteColor',
      type: 'color',
      label: 'Quote Color',
      description: 'Main quote text color',
      default: '#666666',
    },
    {
      name: 'borderColor',
      type: 'color',
      label: 'Border Color',
      description: 'Left border color',
      default: '#003366',
    },
    {
      name: 'attribution',
      type: 'boolean',
      label: 'Include Attribution',
      description: 'Space for quote author',
      default: true,
    },
    {
      name: 'italic',
      type: 'boolean',
      label: 'Italic Text',
      description: 'Make quote italic',
      default: true,
    },
  ],
  subcomponents: [],
  required: false,
};

// Complete component library
export const COMPONENT_LIBRARY: Component[] = [
  CARD_COMPONENT,
  COLUMN_COMPONENT,
  GRID_COMPONENT,
  IMAGE_COMPONENT,
  TABLE_COMPONENT,
  CHART_COMPONENT,
  CODE_BLOCK_COMPONENT,
  TIMELINE_COMPONENT,
  CALLOUT_COMPONENT,
  QUOTE_COMPONENT,
];

export const SECTION_TEXT_COMPONENTS: Subcomponent[] = [
  TITLE_COMPONENT,
  PARAGRAPH_COMPONENT,
  BULLET_LIST_COMPONENT,
  NUMBERED_LIST_COMPONENT,
  HEADING_COMPONENT,
];

export const getComponentById = (id: string): Component | undefined => {
  return COMPONENT_LIBRARY.find(c => c.id === id);
};

export const getSubcomponentById = (id: string): Subcomponent | undefined => {
  for (const component of COMPONENT_LIBRARY) {
    const found = component.subcomponents.find(s => s.id === id);
    if (found) return found;
  }
  // Also check section text components
  return SECTION_TEXT_COMPONENTS.find(s => s.id === id);
};

export const getComponentsByCategory = (category: string): Component[] => {
  return COMPONENT_LIBRARY.filter(c => c.category === category);
};

// Support for custom components
let customComponentsStore: Component[] = [];

export const loadCustomComponents = (components: Component[]) => {
  customComponentsStore = components;
};

export const getAllComponents = (): Component[] => {
  return [...COMPONENT_LIBRARY, ...customComponentsStore];
};

export const getComponentByIdExtended = (id: string): Component | undefined => {
  return getAllComponents().find(c => c.id === id);
};
