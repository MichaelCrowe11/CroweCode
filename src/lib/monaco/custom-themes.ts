import type { editor } from 'monaco-editor';

export interface CroweTheme {
  id: string;
  name: string;
  type: 'light' | 'dark';
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    textSecondary: string;
    border: string;
    selection: string;
    cursor: string;
  };
  monacoTheme: editor.IStandaloneThemeData;
}

// CroweCode Brand Colors
const CROWE_COLORS = {
  brand: {
    primary: '#0EA5E9',    // sky-500
    secondary: '#8B5CF6',  // violet-500
    accent: '#10B981',     // emerald-500
    warning: '#F59E0B',    // amber-500
    error: '#EF4444',      // red-500
    success: '#22C55E',    // green-500
  },
  dark: {
    bg100: '#09090B',      // zinc-950
    bg200: '#18181B',      // zinc-900
    bg300: '#27272A',      // zinc-800
    bg400: '#3F3F46',      // zinc-700
    text100: '#FAFAFA',    // zinc-50
    text200: '#E4E4E7',    // zinc-200
    text300: '#A1A1AA',    // zinc-400
    text400: '#71717A',    // zinc-500
  },
  light: {
    bg100: '#FFFFFF',      // white
    bg200: '#F4F4F5',      // zinc-100
    bg300: '#E4E4E7',      // zinc-200
    bg400: '#D4D4D8',      // zinc-300
    text100: '#09090B',    // zinc-950
    text200: '#18181B',    // zinc-900
    text300: '#52525B',    // zinc-600
    text400: '#71717A',    // zinc-500
  }
};

// Custom CroweCode Themes
export const croweThemes: CroweTheme[] = [
  {
    id: 'crowe-dark',
    name: 'Crowe Dark',
    type: 'dark',
    colors: {
      primary: CROWE_COLORS.brand.primary,
      secondary: CROWE_COLORS.brand.secondary,
      accent: CROWE_COLORS.brand.accent,
      background: CROWE_COLORS.dark.bg100,
      surface: CROWE_COLORS.dark.bg200,
      text: CROWE_COLORS.dark.text100,
      textSecondary: CROWE_COLORS.dark.text300,
      border: CROWE_COLORS.dark.bg400,
      selection: CROWE_COLORS.brand.primary + '40',
      cursor: CROWE_COLORS.brand.primary,
    },
    monacoTheme: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // Keywords
        { token: 'keyword', foreground: CROWE_COLORS.brand.secondary.slice(1) },
        { token: 'keyword.control', foreground: CROWE_COLORS.brand.secondary.slice(1), fontStyle: 'bold' },

        // Strings
        { token: 'string', foreground: CROWE_COLORS.brand.accent.slice(1) },
        { token: 'string.escape', foreground: CROWE_COLORS.brand.warning.slice(1) },

        // Numbers
        { token: 'number', foreground: CROWE_COLORS.brand.warning.slice(1) },

        // Comments
        { token: 'comment', foreground: CROWE_COLORS.dark.text400.slice(1), fontStyle: 'italic' },

        // Functions
        { token: 'entity.name.function', foreground: CROWE_COLORS.brand.primary.slice(1), fontStyle: 'bold' },
        { token: 'support.function', foreground: CROWE_COLORS.brand.primary.slice(1) },

        // Variables
        { token: 'variable', foreground: CROWE_COLORS.dark.text100.slice(1) },
        { token: 'variable.parameter', foreground: CROWE_COLORS.dark.text200.slice(1), fontStyle: 'italic' },

        // Types
        { token: 'entity.name.type', foreground: CROWE_COLORS.brand.accent.slice(1), fontStyle: 'bold' },
        { token: 'support.type', foreground: CROWE_COLORS.brand.accent.slice(1) },

        // Constants
        { token: 'constant', foreground: CROWE_COLORS.brand.warning.slice(1), fontStyle: 'bold' },

        // Operators
        { token: 'operator', foreground: CROWE_COLORS.dark.text200.slice(1) },

        // Punctuation
        { token: 'punctuation', foreground: CROWE_COLORS.dark.text300.slice(1) },

        // Tags (HTML/XML)
        { token: 'entity.name.tag', foreground: CROWE_COLORS.brand.error.slice(1) },
        { token: 'entity.other.attribute-name', foreground: CROWE_COLORS.brand.warning.slice(1) },

        // JSON
        { token: 'support.type.property-name.json', foreground: CROWE_COLORS.brand.primary.slice(1) },

        // CSS
        { token: 'support.type.property-name.css', foreground: CROWE_COLORS.brand.primary.slice(1) },
        { token: 'keyword.other.unit.css', foreground: CROWE_COLORS.brand.warning.slice(1) },

        // Markdown
        { token: 'markup.heading', foreground: CROWE_COLORS.brand.primary.slice(1), fontStyle: 'bold' },
        { token: 'markup.bold', fontStyle: 'bold' },
        { token: 'markup.italic', fontStyle: 'italic' },
        { token: 'markup.underline.link', foreground: CROWE_COLORS.brand.primary.slice(1), fontStyle: 'underline' },
      ],
      colors: {
        'editor.background': CROWE_COLORS.dark.bg100,
        'editor.foreground': CROWE_COLORS.dark.text100,
        'editor.selectionBackground': CROWE_COLORS.brand.primary + '30',
        'editor.lineHighlightBackground': CROWE_COLORS.dark.bg200,
        'editor.lineHighlightBorder': 'transparent',
        'editorCursor.foreground': CROWE_COLORS.brand.primary,
        'editorWhitespace.foreground': CROWE_COLORS.dark.text400 + '50',
        'editorLineNumber.foreground': CROWE_COLORS.dark.text400,
        'editorLineNumber.activeForeground': CROWE_COLORS.brand.primary,
        'editor.selectionHighlightBackground': CROWE_COLORS.brand.primary + '20',
        'editor.wordHighlightBackground': CROWE_COLORS.brand.secondary + '20',
        'editor.wordHighlightStrongBackground': CROWE_COLORS.brand.secondary + '30',
        'editor.findMatchBackground': CROWE_COLORS.brand.warning + '40',
        'editor.findMatchHighlightBackground': CROWE_COLORS.brand.warning + '20',
        'editorGutter.background': CROWE_COLORS.dark.bg100,
        'editorGutter.modifiedBackground': CROWE_COLORS.brand.warning,
        'editorGutter.addedBackground': CROWE_COLORS.brand.accent,
        'editorGutter.deletedBackground': CROWE_COLORS.brand.error,
        'scrollbarSlider.background': CROWE_COLORS.dark.bg300 + '80',
        'scrollbarSlider.hoverBackground': CROWE_COLORS.dark.bg400 + '80',
        'scrollbarSlider.activeBackground': CROWE_COLORS.brand.primary + '80',
        'minimap.background': CROWE_COLORS.dark.bg100,
        'minimapSlider.background': CROWE_COLORS.dark.bg300 + '80',
        'minimapSlider.hoverBackground': CROWE_COLORS.dark.bg400 + '80',
        'minimapSlider.activeBackground': CROWE_COLORS.brand.primary + '80',
      }
    }
  },
  {
    id: 'crowe-light',
    name: 'Crowe Light',
    type: 'light',
    colors: {
      primary: CROWE_COLORS.brand.primary,
      secondary: CROWE_COLORS.brand.secondary,
      accent: CROWE_COLORS.brand.accent,
      background: CROWE_COLORS.light.bg100,
      surface: CROWE_COLORS.light.bg200,
      text: CROWE_COLORS.light.text100,
      textSecondary: CROWE_COLORS.light.text300,
      border: CROWE_COLORS.light.bg400,
      selection: CROWE_COLORS.brand.primary + '30',
      cursor: CROWE_COLORS.brand.primary,
    },
    monacoTheme: {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: CROWE_COLORS.brand.secondary.slice(1), fontStyle: 'bold' },
        { token: 'string', foreground: CROWE_COLORS.brand.accent.slice(1) },
        { token: 'number', foreground: CROWE_COLORS.brand.warning.slice(1) },
        { token: 'comment', foreground: CROWE_COLORS.light.text400.slice(1), fontStyle: 'italic' },
        { token: 'entity.name.function', foreground: CROWE_COLORS.brand.primary.slice(1), fontStyle: 'bold' },
        { token: 'entity.name.type', foreground: CROWE_COLORS.brand.accent.slice(1), fontStyle: 'bold' },
        { token: 'constant', foreground: CROWE_COLORS.brand.warning.slice(1), fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': CROWE_COLORS.light.bg100,
        'editor.foreground': CROWE_COLORS.light.text100,
        'editor.selectionBackground': CROWE_COLORS.brand.primary + '20',
        'editor.lineHighlightBackground': CROWE_COLORS.light.bg200,
        'editorCursor.foreground': CROWE_COLORS.brand.primary,
        'editorLineNumber.foreground': CROWE_COLORS.light.text400,
        'editorLineNumber.activeForeground': CROWE_COLORS.brand.primary,
      }
    }
  },
  {
    id: 'crowe-cyberpunk',
    name: 'Crowe Cyberpunk',
    type: 'dark',
    colors: {
      primary: '#00D9FF',
      secondary: '#FF0080',
      accent: '#00FF88',
      background: '#0A0A0F',
      surface: '#1A1A2E',
      text: '#E0E0FF',
      textSecondary: '#8080C0',
      border: '#2D2D44',
      selection: '#00D9FF40',
      cursor: '#00D9FF',
    },
    monacoTheme: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: 'FF0080', fontStyle: 'bold' },
        { token: 'string', foreground: '00FF88' },
        { token: 'number', foreground: 'FFD700' },
        { token: 'comment', foreground: '6A5ACD', fontStyle: 'italic' },
        { token: 'entity.name.function', foreground: '00D9FF', fontStyle: 'bold' },
        { token: 'entity.name.type', foreground: '00FF88', fontStyle: 'bold' },
        { token: 'constant', foreground: 'FFD700', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#0A0A0F',
        'editor.foreground': '#E0E0FF',
        'editor.selectionBackground': '#00D9FF40',
        'editor.lineHighlightBackground': '#1A1A2E',
        'editorCursor.foreground': '#00D9FF',
        'editorLineNumber.foreground': '#8080C0',
        'editorLineNumber.activeForeground': '#00D9FF',
      }
    }
  },
  {
    id: 'crowe-forest',
    name: 'Crowe Forest',
    type: 'dark',
    colors: {
      primary: '#22C55E',
      secondary: '#059669',
      accent: '#84CC16',
      background: '#0F1419',
      surface: '#1C2128',
      text: '#F0F6FC',
      textSecondary: '#8B949E',
      border: '#30363D',
      selection: '#22C55E40',
      cursor: '#22C55E',
    },
    monacoTheme: {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'keyword', foreground: '059669', fontStyle: 'bold' },
        { token: 'string', foreground: '84CC16' },
        { token: 'number', foreground: 'FCD34D' },
        { token: 'comment', foreground: '6B7280', fontStyle: 'italic' },
        { token: 'entity.name.function', foreground: '22C55E', fontStyle: 'bold' },
        { token: 'entity.name.type', foreground: '84CC16', fontStyle: 'bold' },
        { token: 'constant', foreground: 'FCD34D', fontStyle: 'bold' },
      ],
      colors: {
        'editor.background': '#0F1419',
        'editor.foreground': '#F0F6FC',
        'editor.selectionBackground': '#22C55E40',
        'editor.lineHighlightBackground': '#1C2128',
        'editorCursor.foreground': '#22C55E',
        'editorLineNumber.foreground': '#8B949E',
        'editorLineNumber.activeForeground': '#22C55E',
      }
    }
  }
];

// Function to register all custom themes with Monaco
export function registerCroweThemes() {
  if (typeof window !== 'undefined') {
    import('monaco-editor').then(({ editor }) => {
      croweThemes.forEach(theme => {
        editor.defineTheme(theme.id, theme.monacoTheme);
      });
    });
  }
}

// Get theme by ID
export function getCroweTheme(id: string): CroweTheme | undefined {
  return croweThemes.find(theme => theme.id === id);
}

// Get all available themes
export function getAllCroweThemes(): CroweTheme[] {
  return croweThemes;
}

// Get themes by type
export function getCroweThemesByType(type: 'light' | 'dark'): CroweTheme[] {
  return croweThemes.filter(theme => theme.type === type);
}