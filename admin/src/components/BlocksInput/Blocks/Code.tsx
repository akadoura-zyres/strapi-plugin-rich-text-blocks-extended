import * as React from 'react';

import { Box, SingleSelect, SingleSelectOption } from '@strapi/design-system';
import { CodeBlock as CodeBlockIcon } from '@strapi/icons';
import Prism from 'prismjs';
import { useIntl } from 'react-intl';
import { BaseRange, Element, Editor, Node, NodeEntry, Transforms } from 'slate';
import { useSelected, type RenderElementProps, useFocused, ReactEditor } from 'slate-react';
import { styled } from 'styled-components';

import { useBlocksEditorContext, type BlocksStore } from '../BlocksEditor';
import { codeLanguages } from '../utils/constants';
import { baseHandleConvert } from '../utils/conversions';
import { pressEnterTwiceToExit } from '../utils/enterKey';
import { CustomElement, CustomText, type Block } from '../utils/types';

if (typeof window !== 'undefined') {
  (window as any).Prism = Prism;
}

import 'prismjs/themes/prism-solarizedlight.css';


require('prismjs/components/prism-asmatmel');
require('prismjs/components/prism-bash');
require('prismjs/components/prism-basic');
require('prismjs/components/prism-c');
require('prismjs/components/prism-clojure');
require('prismjs/components/prism-cobol');
require('prismjs/components/prism-cpp');
require('prismjs/components/prism-csharp');
require('prismjs/components/prism-dart');
require('prismjs/components/prism-docker');
require('prismjs/components/prism-elixir');
require('prismjs/components/prism-erlang');
require('prismjs/components/prism-fortran');
require('prismjs/components/prism-fsharp');
require('prismjs/components/prism-go');
require('prismjs/components/prism-graphql');
require('prismjs/components/prism-groovy');
require('prismjs/components/prism-haskell');
require('prismjs/components/prism-haxe');
require('prismjs/components/prism-ini');
require('prismjs/components/prism-java');
require('prismjs/components/prism-javascript');
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-json');
require('prismjs/components/prism-julia');
require('prismjs/components/prism-kotlin');
require('prismjs/components/prism-latex');
require('prismjs/components/prism-lua');
require('prismjs/components/prism-markdown');
require('prismjs/components/prism-matlab');
require('prismjs/components/prism-makefile');
require('prismjs/components/prism-objectivec');
require('prismjs/components/prism-perl');
require('prismjs/components/prism-php');
require('prismjs/components/prism-powershell');
require('prismjs/components/prism-python');
require('prismjs/components/prism-r');
require('prismjs/components/prism-ruby');
require('prismjs/components/prism-rust');
require('prismjs/components/prism-sas');
require('prismjs/components/prism-scala');
require('prismjs/components/prism-scheme');
require('prismjs/components/prism-sql');
require('prismjs/components/prism-stata');
require('prismjs/components/prism-swift');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-tsx');
require('prismjs/components/prism-vbnet');
require('prismjs/components/prism-yaml');


// Add custom type definitions
interface CodeElement extends CustomElement {
  type: 'code';
  language?: string;
  children: CustomText[];
}

interface CodeEditorProps extends RenderElementProps {
  element: CodeElement;
}

type BaseRangeCustom = BaseRange & { className: string };

const isCodeElement = (node: Node): node is CodeElement => {
  return (
    !Editor.isEditor(node) && 
    Element.isElement(node) && 
    'type' in node && 
    node.type === 'code'
  );
};

export const decorateCode = ([node, path]: NodeEntry) => {
  const ranges: BaseRangeCustom[] = [];

  // make sure it is an Slate Element
  if (!Element.isElement(node) ||  'type' in node && 
    node.type === 'code') return ranges;
  // transform the Element into a string
  const text = Node.string(node);
  const language = codeLanguages.find((lang) => lang.value === (node as CustomElement).language);
  const decorateKey = language?.decorate ?? language?.value;

  const selectedLanguage = Prism.languages[decorateKey || 'plaintext'];

  // create "tokens" with "prismjs" and put them in "ranges"
  const tokens = Prism.tokenize(text, selectedLanguage);
  let start = 0;
  for (const token of tokens) {
    const length = token.length;
    const end = start + length;
    if (typeof token !== 'string') {
      ranges.push({
        anchor: { path, offset: start },
        focus: { path, offset: end },
        className: `token ${token.type}`,
      });
    }
    start = end;
  }

  // these will be found in "renderLeaf" in "leaf" and their "className" will be applied
  return ranges;
};

const CodeBlock = styled.pre`
  border-radius: ${({ theme }) => theme.borderRadius};
  background-color: ${({ theme }) => theme.colors.neutral100};
  max-width: 100%;
  overflow: auto;
  padding: ${({ theme }) => `${theme.spaces[3]} ${theme.spaces[4]}`};
  flex-shrink: 1;

  & > code {
    font-family: 'SF Mono', SFMono-Regular, ui-monospace, 'DejaVu Sans Mono', Menlo, Consolas,
      monospace;
    color: ${({ theme }) => theme.colors.neutral800};
    overflow: auto;
    max-width: 100%;
  }
`;

const CodeEditor = (props: CodeEditorProps) => {
  const { editor } = useBlocksEditorContext('CodeEditor');
  const editorIsFocused = useFocused();
  const imageIsSelected = useSelected();
  const { formatMessage } = useIntl();
  const [isSelectOpen, setIsSelectOpen] = React.useState(false);
  const shouldDisplayLanguageSelect = (editorIsFocused && imageIsSelected) || isSelectOpen;

  return (
    <Box position="relative" width="100%">
      <CodeBlock {...props.attributes}>
        <code>{props.children}</code>
      </CodeBlock>
      {shouldDisplayLanguageSelect && (
        <Box
          position="absolute"
          background="neutral0"
          borderColor="neutral150"
          borderStyle="solid"
          borderWidth="0.5px"
          shadow="tableShadow"
          top="100%"
          marginTop={1}
          right={0}
          padding={1}
          hasRadius
        >
          <SingleSelect
            onChange={(open: string | number) => {
              Transforms.setNodes<CodeElement>(
                editor,
                { language: open.toString() },
                { 
                  match: (node): node is CodeElement => isCodeElement(node)
                }
              );
            }}
            value={(isCodeElement(props.element) && props.element.language) || 'plaintext'}
            onOpenChange={(open: boolean) => {
              setIsSelectOpen(open);

              // Focus the editor again when closing the select so the user can continue typing
              if (!open) {
                ReactEditor.focus(editor as ReactEditor);
              }
            }}
            onCloseAutoFocus={(e: Event) => e.preventDefault()}
            aria-label={formatMessage({
              id: 'components.Blocks.blocks.code.languageLabel',
              defaultMessage: 'Select a language',
            })}
          >
            {codeLanguages.map(({ value, label }) => (
              <SingleSelectOption value={value} key={value}>
                {label}
              </SingleSelectOption>
            ))}
          </SingleSelect>
        </Box>
      )}
    </Box>
  );
};

const codeBlocks: Pick<BlocksStore, 'code'> = {
  code: {
    renderElement: (props: RenderElementProps) => <CodeEditor {...props as CodeEditorProps} />,
    icon: CodeBlockIcon,
    label: {
      id: 'components.Blocks.blocks.code',
      defaultMessage: 'Code block',
    },
    // Update the matchNode function to accept Node type
    matchNode: (node: Node): node is CodeElement => {
      return (
        !Editor.isEditor(node) && 
        Element.isElement(node) && 
        'type' in node && 
        node.type === 'code'
      );
    },
    isInBlocksSelector: true,
    handleConvert(editor) {
      baseHandleConvert<CodeElement>(editor, { 
        type: 'code', 
        language: 'plaintext',
        children: [{ type: 'text', text: '' } as CustomText]
      });
    },
    handleEnterKey(editor) {
      pressEnterTwiceToExit(editor);
    },
    snippets: ['```'],
  },
};

export { codeBlocks };
