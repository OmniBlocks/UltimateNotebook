import { Array as YArray, Doc as YDoc, Map as YMap } from 'yjs';

import {
  parseYDocFromBinary,
  parseYDocToMarkdown,
  readAllDocIdsFromRootDoc,
} from '../../native';

export interface PageDocContent {
  title: string;
  summary: string;
}

export interface WorkspaceDocContent {
  name: string;
  avatarKey: string;
}

type KnownFlavour =
  | 'affine:page'
  | 'affine:note'
  | 'affine:surface'
  | 'affine:paragraph'
  | 'affine:list'
  | 'affine:code'
  | 'affine:image'
  | 'affine:attachment'
  | 'affine:transcription'
  | 'affine:callout'
  | 'affine:table';

export function parseWorkspaceDoc(doc: YDoc): WorkspaceDocContent | null {
  // not a workspace doc
  if (!doc.share.has('meta')) {
    return null;
  }

  const meta = doc.getMap('meta');

  return {
    name: meta.get('name') as string,
    avatarKey: meta.get('avatar') as string,
  };
}

export interface ParsePageOptions {
  maxSummaryLength: number;
}

/**
 * Extracts page title and textual summary from a Yjs document representing a page.
 *
 * @param doc - The Yjs document to parse for page blocks.
 * @param opts - Options controlling summary extraction.
 * @param opts.maxSummaryLength - Maximum number of characters to include in the summary; use `-1` to include full textual content.
 * @returns The page's title and assembled summary, or `null` if the document is not a page or contains no root page block.
 */
export function parsePageDoc(
  doc: YDoc,
  opts: ParsePageOptions = { maxSummaryLength: 150 }
): PageDocContent | null {
  // not a page doc
  if (!doc.share.has('blocks')) {
    return null;
  }

  const blocks = doc.getMap<YMap<any>>('blocks');

  if (!blocks.size) {
    return null;
  }

  const content: PageDocContent = {
    title: '',
    summary: '',
  };

  let summaryLenNeeded = opts.maxSummaryLength;

  let root: YMap<any> | null = null;
  for (const block of blocks.values()) {
    const flavour = block.get('sys:flavour') as KnownFlavour;
    if (flavour === 'affine:page') {
      content.title = block.get('prop:title') as string;
      root = block;
    }
  }

  if (!root) {
    return null;
  }

  const queue: string[] = [root.get('sys:id')];

  function pushChildren(block: YMap<any>) {
    const children = block.get('sys:children') as YArray<string> | undefined;
    if (children?.length) {
      for (let i = children.length - 1; i >= 0; i--) {
        queue.push(children.get(i));
      }
    }
  }

  while (queue.length) {
    const blockId = queue.pop();
    const block = blockId ? blocks.get(blockId) : null;
    if (!block) {
      break;
    }

    const flavour = block.get('sys:flavour') as KnownFlavour;

    switch (flavour) {
      case 'affine:page':
      case 'affine:note': {
        pushChildren(block);
        break;
      }
      case 'affine:attachment':
      case 'affine:transcription':
      case 'affine:callout': {
        // only extract text in full content mode
        if (summaryLenNeeded === -1) {
          pushChildren(block);
        }
        break;
      }
      case 'affine:table': {
        // only extract text in full content mode
        if (summaryLenNeeded === -1) {
          const contents: string[] = [...block.keys()]
            .map(key => {
              if (key.startsWith('prop:cells.') && key.endsWith('.text')) {
                return block.get(key)?.toString() ?? '';
              }
              return '';
            })
            .filter(Boolean);
          content.summary += contents.join('|');
        }
        break;
      }
      case 'affine:paragraph':
      case 'affine:list':
      case 'affine:code': {
        pushChildren(block);
        const text = block.get('prop:text');
        if (!text) {
          continue;
        }

        if (summaryLenNeeded === -1) {
          content.summary += text.toString();
        } else if (summaryLenNeeded > 0) {
          content.summary += text.toString();
          summaryLenNeeded -= text.length;
        } else {
          break;
        }
      }
    }
  }

  return content;
}

/**
 * Extracts all document IDs referenced by a workspace root snapshot.
 *
 * @param snapshot - Binary snapshot of the workspace root document
 * @returns An array of document IDs found in the snapshot
 */
export function readAllDocIdsFromWorkspaceSnapshot(snapshot: Uint8Array) {
  return readAllDocIdsFromRootDoc(Buffer.from(snapshot), false);
}

/**
 * Parses a JSON string and returns the resulting value if parsing succeeds.
 *
 * @param str - The JSON string to parse
 * @returns The parsed value cast to `T`, or `undefined` if parsing fails
 */
function safeParseJson<T>(str: string): T | undefined {
  try {
    return JSON.parse(str) as T;
  } catch {
    return undefined;
  }
}

/**
 * Parse a document snapshot and enrich its blocks with `docId`, `ref`, and parsed additional metadata.
 *
 * @param docId - Identifier of the document represented by the snapshot
 * @param docSnapshot - Binary snapshot of the document
 * @returns An object containing the parsed document data with a `blocks` array; each block preserves its original fields and additionally includes `docId`, `ref` (from `refInfo`), and `additional` parsed as JSON when present
 */
export async function readAllBlocksFromDocSnapshot(
  docId: string,
  docSnapshot: Uint8Array
) {
  const result = parseYDocFromBinary(Buffer.from(docSnapshot), docId);

  return {
    ...result,
    blocks: result.blocks.map(block => ({
      ...block,
      docId,
      ref: block.refInfo,
      additional: block.additional
        ? safeParseJson(block.additional)
        : undefined,
    })),
  };
}

/**
 * Convert a serialized document snapshot into a plain title and Markdown content.
 *
 * @param docId - The document identifier used when parsing the snapshot.
 * @param docSnapshot - Binary snapshot of the document (Yjs/Blocksuite format) as a Uint8Array.
 * @param aiEditable - When true, include AI-editable transformations in the generated Markdown.
 * @returns An object with `title` (document title) and `markdown` (document content as a Markdown string).
 */
export function parseDocToMarkdownFromDocSnapshot(
  docId: string,
  docSnapshot: Uint8Array,
  aiEditable = false
) {
  const parsed = parseYDocToMarkdown(
    Buffer.from(docSnapshot),
    docId,
    aiEditable
  );

  return {
    title: parsed.title,
    markdown: parsed.markdown,
  };
}