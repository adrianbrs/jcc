export type TreeNode = Map<any, TreeNode>;

export function getDepth(tree: TreeNode): number {
  let depth = 0;
  for (const node of tree.values()) {
    depth = Math.max(depth, getDepth(node) + 1);
  }

  return depth;
}
