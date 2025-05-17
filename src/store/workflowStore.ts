import create from 'zustand';
import { Node, Edge } from 'reactflow';
import { CustomNodeData, InputNodeData, RunnerNodeData, AgentNodeData, FunctionToolNodeData, GuardrailNodeData } from '../types/workflowNodes';

/**
 * 狀態管理：儲存節點、連線與選中節點。
 *
 * Attributes:
 *   nodes: 畫布上的所有節點，節點 data 為 CustomNodeData 類型
 *   edges: 畫布上的所有連線
 *   selectedNodeId: 當前選中的節點 ID
 *   workflowName: 工作流程的名稱
 *   workflowDescription: 工作流程的描述
 *   setNodes: 設定節點陣列
 *   setEdges: 設定連線陣列
 *   setSelectedNodeId: 設定選中節點 ID
 *   updateNodeData: 更新指定節點的 data 物件
 *   setWorkflowName: 設定工作流程的名稱
 *   setWorkflowDescription: 設定工作流程的描述
 *   toggleNodeExpansion: 切換節點的擴展狀態
 */
interface WorkflowState {
  nodes: Node<CustomNodeData>[];
  edges: Edge[];
  selectedNodeId: string | null;
  workflowName: string;
  workflowDescription: string;
  setNodes: (nodes: Node<CustomNodeData>[]) => void;
  setEdges: (edges: Edge[]) => void;
  setSelectedNodeId: (id: string | null) => void;
  updateNodeData: (nodeId: string, dataUpdate: Partial<CustomNodeData>) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (description: string) => void;
  toggleNodeExpansion: (nodeId: string) => void;
  /**
   * 當 Input 節點 message 變動時，自動同步所有下游 Runner 節點的 data.input。
   * @param inputNodeId Input 節點 ID
   * @param newMessage 新訊息
   */
  updateInputMessageAndSyncRunners: (inputNodeId: string, newMessage: string) => void;
  loadWorkflow: (data: {
    nodes: Node<CustomNodeData>[];
    edges: Edge[];
    workflowName: string;
    workflowDescription: string;
  }) => void;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  nodes: [],
  edges: [],
  selectedNodeId: null,
  workflowName: 'My Workflow',
  workflowDescription: '',
  setNodes: (nodes) => {
    console.log('[Zustand] setNodes', nodes);
    set({ nodes });
  },
  setEdges: (edges) => {
    console.log('[Zustand] setEdges', edges);
    set({ edges });
  },
  setSelectedNodeId: (id) => {
    console.log('[Zustand] setSelectedNodeId', id);
    set({ selectedNodeId: id });
  },
  setWorkflowName: (name) => {
    console.log('[Zustand] setWorkflowName', name);
    set({ workflowName: name });
  },
  setWorkflowDescription: (description) => {
    console.log('[Zustand] setWorkflowDescription', description);
    set({ workflowDescription: description });
  },
  updateNodeData: (nodeId: string, dataUpdate: Partial<CustomNodeData>) => {
    console.log('[Zustand] updateNodeData', nodeId, dataUpdate);
    set((state) => ({
      nodes: state.nodes.map((node): Node<CustomNodeData> => {
        if (node.id === nodeId) {
          let updatedNodeData: CustomNodeData;
          switch (node.data.nodeType) {
            case 'agent':
              updatedNodeData = { ...node.data, ...(dataUpdate as Partial<AgentNodeData>) };
              break;
            case 'runner':
              updatedNodeData = { ...node.data, ...(dataUpdate as Partial<RunnerNodeData>) };
              break;
            case 'functionTool':
              updatedNodeData = { ...node.data, ...(dataUpdate as Partial<FunctionToolNodeData>) };
              break;
            case 'input':
              updatedNodeData = { ...node.data, ...(dataUpdate as Partial<InputNodeData>) };
              break;
            case 'guardrail':
              updatedNodeData = { ...node.data, ...(dataUpdate as Partial<GuardrailNodeData>) };
              break;
            default:
              // This case should ideally not be reached.
              // If it is, log an error and return the original data to avoid type corruption.
              const exhaustiveCheck: never = node.data; // Ensures all cases are handled if CustomNodeData is a strict union
              console.error('Unreachable code in updateNodeData switch default! Node data:', exhaustiveCheck);
              updatedNodeData = node.data; // Do not apply update if type is unknown
          }
          return { ...node, data: updatedNodeData };
        }
        return node;
      }),
    }));
  },
  toggleNodeExpansion: (nodeId: string) => {
    set((state) => ({
      nodes: state.nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              isExpanded: !node.data.isExpanded, // Toggle the state
            },
          };
        }
        return node;
      }),
    }));
    console.log('[Zustand] toggleNodeExpansion', nodeId);
  },
  /**
   * 當 Input 節點 message 變動時，自動同步所有下游 Runner 節點的 data.input。
   * @param inputNodeId Input 節點 ID
   * @param newMessage 新訊息
   */
  updateInputMessageAndSyncRunners: (inputNodeId: string, newMessage: string) => {
    const { nodes: currentNodes, edges: currentEdges } = get(); // 在操作開始前獲取一次狀態

    // 1. 遞迴尋找所有下游 Runner 節點
    const findDownstreamRunners = (startId: string, visited = new Set<string>()): string[] => {
      if (visited.has(startId)) return [];
      visited.add(startId);

      const downstreamEdges = currentEdges.filter(e => e.source === startId); // 使用初始獲取的 edges
      let runnerIds: string[] = [];

      for (const edge of downstreamEdges) {
        const targetNode = currentNodes.find(n => n.id === edge.target);
        if (!targetNode) continue;

        if (targetNode.data.nodeType === 'runner') {
          runnerIds.push(targetNode.id);
        } else if (targetNode.data.nodeType === 'agent') { // 假設 Agent 也可以是中間節點
          runnerIds = runnerIds.concat(findDownstreamRunners(targetNode.id, visited));
        }
      }
      return runnerIds;
    };

    const runnerIdsToUpdate = findDownstreamRunners(inputNodeId);
    console.log(`[Zustand] Found downstream runners for ${inputNodeId}:`, runnerIdsToUpdate);

    // 2. 一次性更新 Input 節點和所有相關的 Runner 節點
    set(state => {
      const newNodes = state.nodes.map((node): Node<CustomNodeData> => { // Explicitly type the return of map callback
        if (node.id === inputNodeId && node.data.nodeType === 'input') {
          // node.data is InputNodeData here due to type guard
          const updatedData: InputNodeData = { ...node.data, message: newMessage };
          return { ...node, data: updatedData };
        }
        if (runnerIdsToUpdate.includes(node.id) && node.data.nodeType === 'runner') {
          // node.data is RunnerNodeData here due to type guard
          const updatedData: RunnerNodeData = { ...node.data, input: newMessage };
          return { ...node, data: updatedData };
        }
        return node;
      });
      return { nodes: newNodes };
    });
    console.log('[Zustand] updateInputMessageAndSyncRunners complete. Input:', inputNodeId, 'NewMsg:', newMessage, 'Runners updated:', runnerIdsToUpdate);
  },
  loadWorkflow: (data) => {
    console.log('[Zustand] loadWorkflow', data);
    set({
      nodes: data.nodes,
      edges: data.edges,
      workflowName: data.workflowName,
      workflowDescription: data.workflowDescription,
      selectedNodeId: null, // Reset selected node on new workflow load
    });
  },
}));
