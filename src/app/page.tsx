"use client";
import React, { useState, useRef } from 'react';
// import { App } from 'antd'; // Removed Ant Design App import
import Button from '@mui/material/Button'; // Added MUI Button import
import IconButton from '@mui/material/IconButton'; // ADDED IconButton
import SaveIcon from '@mui/icons-material/Save'; // ADDED SaveIcon
import FileUploadIcon from '@mui/icons-material/FileUpload'; // ADDED FileUploadIcon
// import Sidebar from '../components/Sidebar'; // Removed Sidebar
import Canvas from '../components/Canvas';
import PropertiesPanel from '../components/PropertiesPanel';
import CodeModal from '../components/CodeModal';
import { useWorkflowStore } from '../store/workflowStore';
import { generatePythonCode } from '../utils/codegen';
import { ReactFlowProvider } from 'reactflow';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
// import { useTheme } from '@mui/material/styles'; // Removed useTheme
import TerminalIcon from '@mui/icons-material/Terminal';
// import RocketLaunchIcon from '@mui/icons-material/RocketLaunch'; // Removed RocketLaunchIcon
import TextField from '@mui/material/TextField'; // Import TextField

/**
 * 主頁面，組合各區域元件。
 *
 * Returns:
 *   React 元件
 */
export default function Home() {
  const { nodes, edges } = useWorkflowStore();
  const [codeVisible, setCodeVisible] = useState(false);
  const [pythonCode, setPythonCode] = useState("");
  // const theme = useTheme(); // Removed theme
  // Get workflow metadata and setters from store
  const workflowName = useWorkflowStore((state) => state.workflowName);
  const workflowDescription = useWorkflowStore((state) => state.workflowDescription);
  const setWorkflowName = useWorkflowStore((state) => state.setWorkflowName);
  const setWorkflowDescription = useWorkflowStore((state) => state.setWorkflowDescription);
  const loadWorkflow = useWorkflowStore((state) => state.loadWorkflow); // ADDED loadWorkflow from store

  const fileInputRef = useRef<HTMLInputElement>(null); // ADDED ref for file input

  const handleGenerateCode = () => {
    try {
      // Pass workflow metadata to codegen function
      const generated_code = generatePythonCode(nodes, edges, workflowName, workflowDescription);
      setPythonCode(generated_code);
      setCodeVisible(true);
    } catch (error) {
      console.error("Failed to generate Python code:", error);
      setPythonCode("# Failed to generate code.\n# Please check the console for errors.");
      setCodeVisible(true);
    }
  };

  const handleSaveWorkflow = () => {
    const workflowData = {
      workflowName,
      workflowDescription,
      nodes,
      edges,
    };
    const jsonString = JSON.stringify(workflowData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '_') || 'workflow'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    console.log('[Page] Workflow saved');
  };

  const handleLoadWorkflowFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Failed to read file content.');
        }
        const parsedData = JSON.parse(text);
        
        // Basic validation
        if (
          parsedData &&
          Array.isArray(parsedData.nodes) &&
          Array.isArray(parsedData.edges) &&
          typeof parsedData.workflowName === 'string' &&
          typeof parsedData.workflowDescription === 'string'
        ) {
          loadWorkflow({
            nodes: parsedData.nodes,
            edges: parsedData.edges,
            workflowName: parsedData.workflowName,
            workflowDescription: parsedData.workflowDescription,
          });
          console.log('[Page] Workflow loaded');
        } else {
          throw new Error('Invalid workflow file format.');
        }
      } catch (error) {
        console.error("Error loading workflow file:", error);
        alert(`Error loading workflow: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };
    reader.onerror = (e) => {
      console.error("Error reading file:", e);
      alert('Error reading file.');
    };
    reader.readAsText(file);

    // Reset file input to allow loading the same file again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerLoadFile = () => {
    fileInputRef.current?.click();
  };

  return (
    // <App> // Removed Ant Design App wrapper
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontSize: 15 }}>
        <header style={{
          height: 64,
          background: '#223354',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 40px',
          fontSize: 26,
          fontWeight: 800,
          letterSpacing: 1.2,
          lineHeight: 1.2,
          fontFamily: 'Inter, Geist, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
          boxShadow: '0 2px 8px 0 #00000033',
        }}>
          
          <span
            style={{
              fontWeight: 700,
              fontSize: 22,
              letterSpacing: 1,
              lineHeight: 1.18,
              fontFamily: 'Inter, Geist, Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              color: '#fff'
            }}
          >
            OpenAI Agents Workflow Designer
          </span>
          
          {/* Save and Load Buttons */}
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleLoadWorkflowFileSelected}
            accept=".json"
            style={{ display: 'none' }}
          />
          <IconButton 
            onClick={triggerLoadFile}
            color="inherit"
            sx={{ ml: 2, color: '#fff' }}
            title="載入工作流 (JSON)"
          >
            <FileUploadIcon />
          </IconButton>
          <IconButton 
            onClick={handleSaveWorkflow} 
            color="inherit"
            sx={{ color: '#fff' }}
            title="保存工作流 (JSON)"
          >
            <SaveIcon />
          </IconButton>

          <Button
            variant="contained"
            color="primary"
            startIcon={<TerminalIcon sx={{ color: '#fff' }} />}
            sx={{
              height: 40,
              px: 3,
              borderRadius: 24,
              fontWeight: 700,
              fontSize: 16,
              marginLeft: 'auto',
              background: '#223354',
              boxShadow: 'none',
              textTransform: 'none',
              '&:hover': {
                background: '#1A253A'
              }
            }}
            onClick={handleGenerateCode}
          >
            生成代碼
          </Button>
        </header>
        <div style={{ display: 'flex', flex: 1, minHeight: 0 }}>
          <ReactFlowProvider>
            <aside style={{ width: 220, background: '#f4f6fa', borderRight: '1px solid #eee' }}>
              <Box sx={{ width: 220, bgcolor: 'background.paper', borderRight: '1px solid #23232a', p: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* Workflow Metadata Inputs */}
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', mb: 1 }}>工作流設定</Typography>
                <TextField 
                  label="工作流名稱"
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 1.5 }}
                />
                <TextField 
                  label="工作流描述 (可選)"
                  value={workflowDescription}
                  onChange={(e) => setWorkflowDescription(e.target.value)}
                  variant="outlined"
                  size="small"
                  multiline
                  rows={2}
                  sx={{ mb: 2 }}
                />
                <Divider sx={{ bgcolor: 'primary.main', opacity: 0.2, mb: 1 }} />

                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary', pt:1, pb: 1 }}>元件庫</Typography>
                <Divider sx={{ bgcolor: 'primary.main', opacity: 0.2 }} />
                <List dense sx={{ px: 1 }}>
                  <ListItem draggable onDragStart={e => e.dataTransfer.setData('application/reactflow', 'input')} sx={{ cursor: 'grab', color: 'text.primary' }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#22c55e' }}>🟢</ListItemIcon>
                    <ListItemText primary={<span style={{fontWeight:600}}>Input 節點</span>} />
                  </ListItem>
                  <ListItem draggable onDragStart={e => e.dataTransfer.setData('application/reactflow', 'agent')} sx={{ cursor: 'grab', color: 'text.primary' }}>
                    <ListItemIcon sx={{ minWidth: 32, color: 'primary.main' }}>🧑‍💼</ListItemIcon>
                    <ListItemText primary={<span style={{fontWeight:600}}>Agent 節點</span>} />
                  </ListItem>
                  <ListItem draggable onDragStart={e => e.dataTransfer.setData('application/reactflow', 'runner')} sx={{ cursor: 'grab', color: 'text.primary' }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#f59e42' }}>🏃</ListItemIcon>
                    <ListItemText primary={<span style={{fontWeight:600}}>Runner 節點</span>} />
                  </ListItem>
                  <ListItem draggable onDragStart={e => e.dataTransfer.setData('application/reactflow', 'functionTool')} sx={{ cursor: 'grab', color: 'text.primary' }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#a3a3a3' }}>🛠️</ListItemIcon>
                    <ListItemText primary={<span style={{fontWeight:600}}>Function Tool 節點</span>} />
                  </ListItem>
                  <ListItem draggable onDragStart={e => e.dataTransfer.setData('application/reactflow', 'guardrail')} sx={{ cursor: 'grab', color: 'text.primary' }}>
                    <ListItemIcon sx={{ minWidth: 32, color: '#8B5CF6' }}>🛡️</ListItemIcon>
                    <ListItemText primary={<span style={{fontWeight:600}}>Guardrail 節點</span>} />
                  </ListItem>
                </List>
                <Typography variant="caption" sx={{ color: 'text.secondary', p: 2, pt: 0 }}>
                  拖曳元件到畫布以建立節點
                </Typography>
              </Box>
            </aside>
            <main style={{ flex: 1, minWidth: 0 }}>
              <Canvas />
            </main>
            <aside style={{ width: 300, background: '#f8fafc', borderLeft: '1px solid #eee' }}>
              <Box sx={{ width: 300, bgcolor: 'background.paper', borderLeft: '1px solid', borderColor: 'primary.main', borderLeftOpacity: 0.12, p: 0, height: '100%' }}>
                <PropertiesPanel />
              </Box>
            </aside>
          </ReactFlowProvider>
        </div>
        <CodeModal
          visible={codeVisible}
          code={pythonCode}
          onClose={() => setCodeVisible(false)}
        />
      </div>
    // </App> // Removed Ant Design App wrapper
  );
}
