import { Node, Edge } from 'reactflow';
import { CustomNodeData } from '../types/workflowNodes';

/**
 * 檢查新增連線是否會造成循環。
 * @param sourceId 來源節點 ID
 * @param targetId 目標節點 ID
 * @param edges 畫布所有連線
 * @returns 是否會產生循環
 */
function createsCycle(sourceId: string, targetId: string, edges: Edge[]): boolean {
  // 使用 DFS 檢查 targetId 是否能回到 sourceId
  const graph: Record<string, string[]> = {};
  edges.forEach(e => {
    if (!graph[e.source]) graph[e.source] = [];
    graph[e.source].push(e.target);
  });
  // 加入即將新增的連線
  if (!graph[sourceId]) graph[sourceId] = [];
  graph[sourceId].push(targetId);

  const visited = new Set<string>();
  function dfs(nodeId: string): boolean {
    if (nodeId === sourceId && visited.size > 0) return true;
    if (visited.has(nodeId)) return false;
    visited.add(nodeId);
    const neighbors = graph[nodeId] || [];
    for (const n of neighbors) {
      if (dfs(n)) return true;
    }
    visited.delete(nodeId);
    return false;
  }
  return dfs(targetId);
}

/**
 * 驗證節點連線是否合法，符合 OpenAI Agents SDK 實際設計。
 *
 * 允許：
 *   - Agent → Agent（handoff，可多對多）
 *   - Function Tool → Agent（tool，可多對多）
 *   - Agent → Runner（執行，Runner 只能有一個輸入）
 *
 * 禁止：
 *   - 其他型別連線
 *   - 循環連線
 *   - Runner 有多個輸入
 *
 * Args:
 *   sourceNode: 來源節點
 *   targetNode: 目標節點
 *   nodes: 畫布所有節點
 *   edges: 畫布所有連線
 *
 * Returns:
 *   是否允許連線（true/false）
 */
export function validateConnection(
  sourceNode: Node<CustomNodeData>,
  targetNode: Node<CustomNodeData>,
  nodes: Node<CustomNodeData>[],
  edges: Edge[]
): boolean {
  // Input 節點只能連到 Agent，且只能有一個輸出（必須放在型別驗證之前）
  if (sourceNode.type === 'input') {
    if (targetNode.type !== 'agent') {
      console.warn('[連線驗證] Input 節點只能連到 Agent 節點');
      return false;
    }
    const outgoing = edges.filter(e => e.source === sourceNode.id);
    if (outgoing.length > 0) {
      console.warn('[連線驗證] Input 節點只能有一個輸出');
      return false;
    }
    // 允許 input → agent
    return true;
  }
  // 型別驗證
  const validType =
    (sourceNode.type === 'agent' && targetNode.type === 'agent') || // handoff
    (sourceNode.type === 'functionTool' && targetNode.type === 'agent') || // tool
    (sourceNode.type === 'agent' && targetNode.type === 'runner') || // 執行
    (sourceNode.type === 'guardrail' && targetNode.type === 'agent'); // Guardrail 保護 Agent
  if (!validType) {
    console.warn('[連線驗證] 不允許的型別連線:', sourceNode.type, '→', targetNode.type);
    return false;
  }
  // 禁止循環
  if (createsCycle(sourceNode.id, targetNode.id, edges)) {
    console.warn('[連線驗證] 禁止循環連線:', sourceNode.id, '→', targetNode.id);
    return false;
  }
  // Runner 只能有一個輸入
  if (targetNode.type === 'runner') {
    const incoming = edges.filter(e => e.target === targetNode.id);
    if (incoming.length > 0) {
      console.warn('[連線驗證] Runner 只能有一個輸入:', targetNode.id);
      return false;
    }
  }
  // Function Tool 可被多個 Agent 共用（不限制 outgoing edge 數量）
  // Input 節點只能連到 Agent，且只能有一個輸出
  if (sourceNode.type === 'input') {
    if (targetNode.type !== 'agent') {
      console.warn('[連線驗證] Input 節點只能連到 Agent 節點');
      return false;
    }
    const outgoing = edges.filter(e => e.source === sourceNode.id);
    if (outgoing.length > 0) {
      console.warn('[連線驗證] Input 節點只能有一個輸出');
      return false;
    }
  }
  return true;
} 