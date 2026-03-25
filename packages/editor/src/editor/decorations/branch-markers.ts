/**
 * T137: TipTap decoration for L-shaped branch markers on branched paragraphs
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

const BRANCH_MARKERS_KEY = new PluginKey('branchMarkers');

export const BranchMarkersExtension = Extension.create({
  name: 'branchMarkers',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: BRANCH_MARKERS_KEY,

        state: {
          init() {
            return { branchedParagraphIndices: new Set<number>() };
          },
          apply(tr, value) {
            const meta = tr.getMeta(BRANCH_MARKERS_KEY) as
              | { branchedParagraphIndices: Set<number> }
              | undefined;
            if (meta) {
              return meta;
            }
            return value;
          },
        },

        props: {
          decorations(state) {
            const pluginState = BRANCH_MARKERS_KEY.getState(state) as {
              branchedParagraphIndices: Set<number>;
            };

            if (!pluginState || pluginState.branchedParagraphIndices.size === 0) {
              return DecorationSet.empty;
            }

            const decorations: Decoration[] = [];
            let paraIndex = 0;

            state.doc.forEach((node, offset) => {
              if (node.type.name === 'paragraph' || node.type.name === 'heading') {
                if (pluginState.branchedParagraphIndices.has(paraIndex)) {
                  decorations.push(
                    Decoration.node(offset, offset + node.nodeSize, {
                      class: 'branched-paragraph',
                      'data-branch-index': String(paraIndex),
                    }),
                  );
                }
                paraIndex++;
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

/**
 * Update the branched paragraph indices in the plugin state.
 * Called when new section branches are created or deleted.
 */
export function updateBranchMarkers(
  editor: {
    view: {
      dispatch: (tr: ReturnType<typeof editor.view.state.tr.setMeta>) => void;
      state: { tr: { setMeta: (key: PluginKey, value: unknown) => unknown } };
    };
  },
  branchedParagraphIndices: Set<number>,
): void {
  const tr = (
    editor.view.state as unknown as {
      tr: { setMeta: (key: PluginKey, value: unknown) => { setMeta: unknown } };
    }
  ).tr;
  const dispatch = editor.view.dispatch;
  dispatch(
    (
      tr as unknown as {
        setMeta: (key: PluginKey, value: { branchedParagraphIndices: Set<number> }) => unknown;
      }
    ).setMeta(BRANCH_MARKERS_KEY, {
      branchedParagraphIndices,
    }) as Parameters<typeof dispatch>[0],
  );
}
