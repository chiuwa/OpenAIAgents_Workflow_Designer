import React from 'react';
import { Handle, Position, NodeProps, useReactFlow } from 'reactflow';
import { RunnerNodeData } from '../../types/workflowNodes';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useWorkflowStore } from '../../store/workflowStore';

/**
 * 自訂 Runner 節點元件。
 *
 * Args:
 *   id: 節點 ID (implicitly available via NodeProps)
 *   data: 節點資料，應符合 RunnerNodeData 結構
 *
 * Returns:
 *   React 元件
 */
const RunnerNode: React.FC<NodeProps<RunnerNodeData>> = ({ id, data }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const { deleteElements } = useReactFlow();
  const toggleNodeExpansion = useWorkflowStore((state) => state.toggleNodeExpansion);

  if (!data) {
    return null;
  }

  const compactInput = data.input && data.input.length > 30 ? `${data.input.substring(0, 30)}...` : (data.input || '尚未設定');
  const fullInput = data.input || '尚未設定';

  const compactContext = typeof data.context === 'string' && data.context && data.context.length > 30 ? `${data.context.substring(0, 30)}...` : data.context;
  const fullContext = data.context;

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
        borderLeft: isHovered ? `2.5px solid ${data.isExpanded ? '#D6883A' : '#F59E42'}` : '1.5px solid #3f3f46',
        borderRight: isHovered ? `2.5px solid ${data.isExpanded ? '#D6883A' : '#F59E42'}` : '1.5px solid #3f3f46',
        borderBottom: isHovered ? `2.5px solid ${data.isExpanded ? '#D6883A' : '#F59E42'}` : '1.5px solid #3f3f46',
        borderTop: '6px solid #F59E42',
        borderRadius: '12px',
        boxShadow: isHovered ? `0 4px 16px 0 ${data.isExpanded ? '#D6883A80' : '#F59E4280'}` : '0 2px 8px 0 #00000033',
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
          color: isHovered ? '#FFBF69' : '#6b7280',
          backgroundColor: isHovered ? 'rgba(245, 158, 66, 0.1)' : 'transparent',
          zIndex: 10,
          padding: '2px',
          '&:hover': {
            color: '#F59E42', 
            backgroundColor: 'rgba(245, 158, 66, 0.15)',
          }
        }}
      >
        {data.isExpanded ? <ExpandMoreIcon fontSize="inherit" /> : <ChevronRightIcon fontSize="inherit" />}
      </IconButton>

      <Handle type="target" position={Position.Top} style={{ borderRadius: 8, width: 18, height: 18, background: '#F59E42', border: '2px solid #fff' }} />
      <div style={{ fontWeight: 800, textAlign: 'center', marginBottom: '10px', fontSize: '16px', letterSpacing: 0.5 }}>
        🏃 {data.name || 'Runner 節點'}
      </div>
      <div style={{ marginBottom: '8px', color: '#e0e0e0', textAlign: 'center', fontSize: '14px' }}>
        <strong>模式:</strong> {data.execution_mode || '尚未設定'}
      </div>

      {data.isExpanded ? (
        <>
          <div style={{ marginBottom: '8px', color: '#d0d0d0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '80px', overflowY: 'auto', fontSize: '13px' }}>
            <strong>輸入:</strong> {fullInput}
          </div>
          {typeof fullContext === 'string' && fullContext && (
            <div style={{ marginBottom: '5px', color: '#d0d0d0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '60px', overflowY: 'auto', fontSize: '13px' }}>
              <strong>上下文:</strong> {fullContext}
            </div>
          )}
        </>
      ) : (
        <>
          <div style={{ marginBottom: '5px', color: '#c0c0c0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '36px', overflowY: 'hidden', fontSize: '13px' }}>
            <strong>輸入:</strong> {compactInput}
          </div>
          {typeof compactContext === 'string' && compactContext && (
            <div style={{ marginBottom: '5px', color: '#c0c0c0', whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxHeight: '36px', overflowY: 'hidden', fontSize: '13px' }}>
              <strong>上下文:</strong> {compactContext}
            </div>
          )}
        </>
      )}
      <Handle type="source" position={Position.Bottom} style={{ borderRadius: 8, width: 18, height: 18, background: '#F59E42', border: '2px solid #fff' }} />
    </div>
  );
};

export default React.memo(RunnerNode); 