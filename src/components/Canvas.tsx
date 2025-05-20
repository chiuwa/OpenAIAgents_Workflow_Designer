import React, { useCallback, useMemo } from 'react';
import ReactFlow, {
  Background, Controls, Node, /*Edge,*/ OnNodesChange, OnEdgesChange, /*XYPosition,*/
  applyNodeChanges, applyEdgeChanges,
  useReactFlow, Connection, addEdge,
  BackgroundVariant
} from 'reactflow';
import { useWorkflowStore } from '../store/workflowStore';
import 'reactflow/dist/style.css';
import AgentNode from './CustomNodes/AgentNode';
import RunnerNode from './CustomNodes/RunnerNode';
import FunctionToolNode from './CustomNodes/FunctionToolNode';
import InputNode from './CustomNodes/InputNode';
import GuardrailNode from './CustomNodes/GuardrailNode';
import { AgentNodeData, RunnerNodeData, FunctionToolNodeData, CustomNodeData, GuardrailNodeData, GuardrailType } from '../types/workflowNodes';
import { validateConnection } from '../utils/connectionValidation';
import CustomEdge from './CustomEdge';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

/**
 * 產生唯一節點 ID
 */
function generateNodeId(type: string) {
  return `${type}_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

/**
 * 工作流畫布元件，負責顯示與操作節點和連線。
 *
 * Returns:
 *   React 元件
 */
const Canvas: React.FC = () => {
  const { nodes, edges, setNodes, setEdges, setSelectedNodeId, updateInputMessageAndSyncRunners } = useWorkflowStore();
  const reactFlowInstance = useReactFlow();
  const [toast, setToast] = React.useState<{ open: boolean, message: string }>({ open: false, message: '' });
  const showToast = (msg: string) => setToast({ open: true, message: msg });

  // 定義自訂節點類型
  const nodeTypes = useMemo(() => ({
    agent: AgentNode,
    runner: RunnerNode,
    functionTool: FunctionToolNode,
    input: InputNode,
    guardrail: GuardrailNode,
  }), []);
  const edgeTypes = useMemo(() => ({
    custom: CustomEdge,
  }), []);

  /**
   * 處理節點選取事件。
   * @param event React 事件
   * @param node 被選取的節點
   */
  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    console.log('[Canvas] Node clicked:', node.id);
    setSelectedNodeId(node.id);
  };

  /**
   * 處理節點變更事件。
   * @param changes 節點變更
   */
  const onNodesChange: OnNodesChange = useCallback(
    (changes) => {
      setNodes(applyNodeChanges(changes, nodes));
    },
    [nodes, setNodes]
  );

  /**
   * 處理連線變更事件。
   * @param changes 連線變更
   */
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      setEdges(applyEdgeChanges(changes, edges));
      // 每次連線變動時，自動同步所有 Input 節點的 message 到下游 Runner
      const currentNodes = useWorkflowStore.getState().nodes;
      currentNodes.forEach(node => {
        if (node.type === 'input' && node.data && 'message' in node.data) {
          updateInputMessageAndSyncRunners(node.id, node.data.message);
        }
      });
    },
    [edges, setEdges, updateInputMessageAndSyncRunners]
  );

  /**
   * 處理拖曳進入畫布事件，允許放置
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * 處理拖放落地事件，自動建立新節點
   */
  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const type = event.dataTransfer.getData('application/reactflow');
    if (!type) return;

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    });

    let newNodeType: 'agent' | 'runner' | 'functionTool' | 'input' | 'guardrail' | undefined = undefined;
    let newNodeData: CustomNodeData | undefined = undefined;

    if (type === 'agent') {
      newNodeType = 'agent';
      newNodeData = {
        nodeType: 'agent',
        name: `Agent 節點`,
        instructions: 'You are a helpful assistant.',
      } as AgentNodeData;
    } else if (type === 'runner') {
      newNodeType = 'runner';
      // 預設 input
      let inputValue = 'Hello world';
      // 嘗試尋找上游 input node
      const inputNode = nodes.find(n => n.type === 'input' && n.data && n.data.nodeType === 'input');
      if (inputNode && inputNode.data && inputNode.data.nodeType === 'input' && inputNode.data.message) {
        inputValue = inputNode.data.message;
      }
      newNodeData = {
        nodeType: 'runner',
        name: `Runner 節點`,
        input: inputValue,
        execution_mode: 'sync',
      } as RunnerNodeData;
    } else if (type === 'functionTool') {
      newNodeType = 'functionTool';
      newNodeData = {
        nodeType: 'functionTool',
        name: `Function Tool 節點`,
        parameters: [],
        returnType: 'string',
        implementation: 'return "Hello from function tool"'
      } as FunctionToolNodeData;
    } else if (type === 'input') {
      newNodeType = 'input';
      newNodeData = {
        nodeType: 'input',
        name: `Input 節點`,
        message: '',
      } as CustomNodeData;
    } else if (type === 'guardrail') {
      newNodeType = 'guardrail';
      newNodeData = {
        nodeType: 'guardrail',
        name: `Guardrail 節點`,
        guardrailType: GuardrailType.INPUT,
        internalAgentName: 'DefaultGuardAgent',
        internalAgentInstructions: 'Check the input based on policy X.',
        tripwireConditionLogic: 'output.is_policy_violated === true',
      } as GuardrailNodeData;
    }

    if (!newNodeType || !newNodeData) return;

    const newNode: Node<CustomNodeData> = {
      id: generateNodeId(type),
      type: newNodeType,
      position,
      data: newNodeData,
    };

    setNodes([...nodes, newNode]);
    setSelectedNodeId(newNode.id);
    console.log('[Canvas] Drop create node:', newNode);
  }, [nodes, setNodes, reactFlowInstance, setSelectedNodeId]);

  /**
   * 處理節點連線驗證，進階規則由 validateConnection 控制
   */
  const onConnect = useCallback((connection: Connection) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    if (!sourceNode || !targetNode) return;
    if (validateConnection(sourceNode, targetNode, nodes, edges)) {
      setEdges(addEdge(connection, edges));
      console.log('[Canvas] 允許連線:', sourceNode.type, '→', targetNode.type);
    } else {
      // 根據型別給不同提示
      if (sourceNode.type === 'agent' && targetNode.type === 'functionTool') {
        showToast('請從 Function Tool 節點拉線到 Agent 節點（不是反過來）');
      } else if (sourceNode.type === 'input' && targetNode.type !== 'agent') {
        showToast('Input 節點只能連到 Agent 節點');
      } else {
        showToast('不允許的連線類型');
      }
      console.warn('[Canvas] 不允許的連線:', sourceNode.type, '→', targetNode.type);
    }
  }, [nodes, edges, setEdges]);

  // 刪除 edge 的 callback
  const onDeleteEdge = useCallback((edgeId: string) => {
    setEdges(edges.filter(e => e.id !== edgeId));
  }, [edges, setEdges]);

  return (
    <div
      style={{ width: '100%', height: '100vh', background: '#18181b' /* 使用主題色 */ }}
      onDrop={onDrop}
      onDragOver={onDragOver}
    >
      <ReactFlow
        nodes={nodes as Node<CustomNodeData>[]}
        edges={edges.map(e => ({ ...e, type: 'custom', data: { ...e.data, onDelete: onDeleteEdge } }))}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        onConnect={onConnect}
        snapToGrid={true}
        snapGrid={[16, 16]}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
        <Controls />
      </ReactFlow>
      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert severity="warning" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Canvas;
