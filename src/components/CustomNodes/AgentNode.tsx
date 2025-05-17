import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { AgentNodeData } from '../../types/workflowNodes';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWorkflowStore } from '../../store/workflowStore';

/**
 * 自訂 Agent 節點元件。
 *
 * Args:
 *   data: 節點資料，應符合 AgentNodeData 結構。
 *
 * Returns:
 *   React 元件
 */
const AgentNode: React.FC<NodeProps<AgentNodeData>> = ({ id, data }) => {
  const { deleteElements } = useReactFlow();
  const allNodes = useWorkflowStore((state) => state.nodes);
  const allEdges = useWorkflowStore((state) => state.edges);
  const toggleNodeExpansion = useWorkflowStore((state) => state.toggleNodeExpansion);

  const previewInstructions = data.instructions && data.instructions.length > 30
    ? `${data.instructions.substring(0, 30)}...`
    : data.instructions;
  
  const fullInstructions = data.instructions;

  const [isHovered, setIsHovered] = React.useState(false);

  const { connectedTools, connectedHandoffs } = React.useMemo(() => {
    const tools: string[] = [];
    const handoffs: string[] = [];

    allEdges.forEach(edge => {
      // Find tools connected TO this agent
      if (edge.target === id) {
        const sourceNode = allNodes.find(n => n.id === edge.source);
        if (sourceNode && sourceNode.data.nodeType === 'functionTool') {
          tools.push(sourceNode.data.name || 'Unnamed Tool');
        }
      }
      // Find handoffs FROM this agent
      if (edge.source === id) {
        const targetNode = allNodes.find(n => n.id === edge.target);
        if (targetNode && targetNode.data.nodeType === 'agent') {
          handoffs.push(targetNode.data.name || 'Unnamed Agent');
        }
      }
    });
    return { connectedTools: tools, connectedHandoffs: handoffs };
  }, [id, allNodes, allEdges]);

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent node click/drag when clicking delete button
    deleteElements({ nodes: [{ id }] });
  };

  const onToggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleNodeExpansion(id);
  };

  return (
    <div
      style={{
        position: 'relative', // Needed for absolute positioning of the delete button
        background: '#23232a',
        borderLeft: isHovered ? '2.5px solid #2E1065' : '1.5px solid #3f3f46',
        borderRight: isHovered ? '2.5px solid #2E1065' : '1.5px solid #3f3f46',
        borderBottom: isHovered ? '2.5px solid #2E1065' : '1.5px solid #3f3f46',
        borderTop: '6px solid #223354',
        borderRadius: '12px',
        boxShadow: isHovered ? '0 4px 16px 0 #2E106580' : '0 2px 8px 0 #00000033',
        padding: '16px 20px',
        width: 250,
        fontSize: '15px',
        color: '#e0e0e0',
        transition: 'all 0.18s cubic-bezier(.4,2,.6,1)',
        cursor: 'pointer',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <IconButton 
        aria-label="delete"
        onClick={onDelete}
        size="small"
        sx={{
          position: 'absolute',
          top: 2,
          right: 2,
          color: isHovered ? '#ff7f7f' : '#6b7280', // Change color on hover for better visibility
          backgroundColor: isHovered ? 'rgba(255, 127, 127, 0.1)' : 'transparent',
          zIndex: 10, // Ensure button is on top
          padding: '2px', 
          '&:hover': {
            color: '#ef4444', // Brighter red on button hover
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
          }
        }}
      >
        <DeleteIcon fontSize="inherit" />
      </IconButton>

      <IconButton
        aria-label={data.isExpanded ? "collapse" : "expand"}
        onClick={onToggleExpand}
        size="small"
        sx={{
          position: 'absolute',
          top: 2,
          left: 2,
          color: isHovered ? '#7f7fff' : '#6b7280',
          backgroundColor: isHovered ? 'rgba(127, 127, 255, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: '#5f5fff',
            backgroundColor: 'rgba(95, 95, 255, 0.15)',
          }
        }}
      >
        {data.isExpanded ? <ExpandMoreIcon fontSize="inherit" /> : <ChevronRightIcon fontSize="inherit" />}
      </IconButton>

      <Handle type="target" position={Position.Top} style={{ borderRadius: 8, width: 18, height: 18, background: '#223354', border: '2px solid #fff' }} />
      <div style={{ fontWeight: 800, textAlign: 'center', marginBottom: '10px', fontSize: '16px', letterSpacing: 0.5 }}>
        🧑‍💼 {data.name || 'Agent 節點'}
      </div>
      
      {data.isExpanded ? (
        <>
          {fullInstructions && (
            <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '120px', overflowY: 'auto', fontSize: '14px' }}>
              <strong>指示:</strong> {fullInstructions}
            </div>
          )}
          {data.pydanticSchema && data.pydanticSchema.modelName && (
            <div style={{ marginBottom: '5px', color: '#b0b0b0', wordBreak: 'break-word', fontSize: '13px' }}>
              <strong>輸出模型:</strong> {data.pydanticSchema.modelName}
            </div>
          )}
          {connectedTools.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '13px', color: '#a0a0a0', wordBreak: 'break-word' }}>
              <strong>Tools:</strong> {connectedTools.join(', ')}
            </div>
          )}
          {connectedHandoffs.length > 0 && (
            <div style={{ marginTop: '4px', fontSize: '13px', color: '#a0a0a0', wordBreak: 'break-word' }}>
              <strong>Handoffs:</strong> {connectedHandoffs.join(', ')}
            </div>
          )}
        </>
      ) : (
        <>
          {previewInstructions && (
            <div style={{ marginBottom: '8px', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '40px', overflowY: 'hidden', fontSize: '14px' }}>
              <strong>指示:</strong> {previewInstructions}
            </div>
          )}
          {data.pydanticSchema && data.pydanticSchema.modelName && (
            <div style={{ marginBottom: '5px', color: '#b0b0b0', wordBreak: 'break-word', fontSize: '13px' }}>
              <strong>輸出模型:</strong> {data.pydanticSchema.modelName}
            </div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Bottom} style={{ borderRadius: 8, width: 18, height: 18, background: '#223354', border: '2px solid #fff' }} />
    </div>
  );
};

export default AgentNode; 