import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { FunctionToolNodeData, FunctionToolParameter } from '../../types/workflowNodes';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWorkflowStore } from '../../store/workflowStore';

/**
 * 自訂 Function Tool 節點元件。
 *
 * Args:
 *   data: 節點資料，應符合 FunctionToolNodeData 結構。
 *
 * Returns:
 *   React 元件
 */
const FunctionToolNode: React.FC<NodeProps<FunctionToolNodeData>> = ({ id, data }) => {
  const { deleteElements } = useReactFlow();
  const toggleNodeExpansion = useWorkflowStore((state) => state.toggleNodeExpansion);

  const compactDescription = data.description && data.description.length > 50
    ? `${data.description.substring(0, 50)}...`
    : data.description;
  const fullDescription = data.description;

  const compactParametersDisplay = () => {
    if (!data.parameters || data.parameters.length === 0) return '無';
    const paramNames = data.parameters.map((p: FunctionToolParameter) => p.name || '未命名參數').join(', ');
    return paramNames.length > 30 ? `${paramNames.substring(0, 30)}...` : paramNames;
  };

  const [isHovered, setIsHovered] = React.useState(false);

  const onDelete = (event: React.MouseEvent) => {
    event.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };

  const onToggleExpand = (event: React.MouseEvent) => {
    event.stopPropagation();
    toggleNodeExpansion(id);
  };

  return (
    <div
      style={{
        position: 'relative',
        background: '#23232a',
        borderLeft: isHovered ? '2.5px solid #4A5568' : '1.5px solid #3f3f46',
        borderRight: isHovered ? '2.5px solid #4A5568' : '1.5px solid #3f3f46',
        borderBottom: isHovered ? '2.5px solid #4A5568' : '1.5px solid #3f3f46',
        borderTop: '6px solid #64748B',
        borderRadius: '12px',
        boxShadow: isHovered ? '0 4px 16px 0 #4A556880' : '0 2px 8px 0 #00000033',
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
          color: isHovered ? '#ff7f7f' : '#6b7280',
          backgroundColor: isHovered ? 'rgba(255, 127, 127, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: '#ef4444',
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

      <Handle type="target" position={Position.Top} style={{ borderRadius: 8, width: 18, height: 18, background: '#64748B', border: '2px solid #fff' }} />
      <div style={{ fontWeight: 800, textAlign: 'center', marginBottom: '10px', fontSize: '16px', letterSpacing: 0.5 }}>
        🛠️ {data.name || 'Function Tool 節點'}
      </div>

      {data.isExpanded ? (
        <>
          {fullDescription && (
            <div style={{ marginBottom: '8px', fontStyle: 'italic', color: '#c0c0c0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '80px', overflowY: 'auto', fontSize: '13px' }}>
             {fullDescription}
            </div>
          )}
          {data.returnType && (
            <div style={{ marginBottom: '8px', color: '#c0c0c0', fontSize: '13px' }}>
              <strong>返回:</strong> {data.returnType}
            </div>
          )}
          {data.parameters && data.parameters.length > 0 && (
            <div style={{ marginBottom: '5px', color: '#c0c0c0', wordBreak: 'break-word', fontSize: '13px' }}>
              <strong>參數:</strong>
              <ul style={{ listStyleType: 'disc', paddingLeft: '20px', margin: '4px 0 0 0' }}>
                {data.parameters.map((param) => (
                  <li key={param.id} style={{fontSize: '12px'}}>
                    {param.name || '未命名'}: {param.type || 'any'}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      ) : (
        <>
          {compactDescription && (
            <div style={{ marginBottom: '5px', fontStyle: 'italic', color: '#b0b0b0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '36px', overflowY: 'hidden', fontSize: '13px' }}>
             {compactDescription}
            </div>
          )}
          {data.returnType && (
            <div style={{ marginBottom: '5px', color: '#b0b0b0', fontSize: '13px' }}>
              <strong>返回:</strong> {data.returnType}
            </div>
          )}
          {data.parameters && data.parameters.length > 0 && (
            <div style={{ marginBottom: '5px', color: '#b0b0b0', wordBreak: 'break-all', fontSize: '13px', maxHeight:'36px', overflowY: 'hidden' }}>
              <strong>參數:</strong> {compactParametersDisplay()}
            </div>
          )}
        </>
      )}
      
      <Handle type="source" position={Position.Bottom} style={{ borderRadius: 8, width: 18, height: 18, background: '#64748B', border: '2px solid #fff' }} />
      {/* Implementation is usually too long for direct display */}
    </div>
  );
};

export default FunctionToolNode; 