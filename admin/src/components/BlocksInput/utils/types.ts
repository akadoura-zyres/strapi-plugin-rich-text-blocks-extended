import type { BaseElement, BaseText, Node, Descendant } from 'slate';

// Common interfaces
export interface Option {
  label: string;
  value: string;
  isDefault?: boolean;
}

export interface FontSetting {
  breakpoint: 'mobile' | 'tablet' | 'desktop';
  fontSize: string | null;
  fontLeading: string | null;
  fontAlignment: string | null;
  fontTracking: string | null;
}

// Base element types
export interface CustomElement extends BaseElement {
  type: string;
  fontFamily?: string;
  fontColor?: string;
  fontSettings?: FontSetting[];
  [key: string]: unknown;
}

export interface CustomText extends BaseText {
  type: 'text';
  text: string;
}

// Specific element types
export interface LinkNode extends CustomElement {
  type: 'link';
  url: string;
  children: Descendant[];
}

export interface ListNode extends CustomElement {
  type: 'list';
  format: 'ordered' | 'unordered';
  indentLevel: number;
  children: Descendant[];
}

export interface HeadingElement extends CustomElement {
  type: 'heading';
  level: 1 | 2 | 3 | 4 | 5 | 6;
  children: CustomText[];
}

export interface ImageElement extends CustomElement {
  type: 'image';
  image: {
    url: string;
    alternativeText?: string;
    width?: number;
    height?: number;
    formats?: Record<string, any>;
    hash?: string;
    ext?: string;
    mime?: string;
    size?: number;
    previewUrl?: string;
  };
  children: CustomText[];
}

export type Block<T extends string> = Extract<Node, { type: T }>;

// Utility functions
export const getEntries = <T extends object>(object: T) =>
  Object.entries(object) as [keyof T, T[keyof T]][];

export const getKeys = <T extends object>(object: T) => 
  Object.keys(object) as (keyof T)[];

export const isLinkNode = (element: CustomElement): element is LinkNode => {
  return element.type === 'link';
};

export const isListNode = (element: CustomElement): element is ListNode => {
  return element.type === 'list';
};