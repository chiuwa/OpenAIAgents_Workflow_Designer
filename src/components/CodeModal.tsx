import React from 'react';
// import { Modal, Button as AntButton } from 'antd'; // AntD imports removed
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
// import DialogContentText from '@mui/material/DialogContentText'; // No longer needed for simple text area
import DialogTitle from '@mui/material/DialogTitle';
// import { styled } from '@mui/material/styles'; // No longer needed for StyledTextarea
import Editor from '@monaco-editor/react'; // IMPORT Monaco Editor

// Monaco Editor 可用於高亮顯示代碼，這裡先用 textarea 佔位 // This comment is now outdated

// const StyledTextarea = styled('textarea')(({ theme }) => ({
// width: '100%',
// height: 400,
// fontFamily: 'monospace',
// fontSize: 14,
// padding: theme.spacing(1),
// border: `1px solid ${theme.palette.divider}`,
// borderRadius: theme.shape.borderRadius,
// })); // REMOVED StyledTextarea

/**
 * 代碼生成彈窗，顯示 Python 代碼並支援複製。
 *
 * Args:
 *   visible: 是否顯示 (MUI Dialog uses 'open')
 *   code: 代碼內容
 *   onClose: 關閉事件
 *
 * Returns:
 *   React 元件
 */
const CodeModal: React.FC<{ visible: boolean; code: string; onClose: () => void }> = ({
  visible,
  code,
  onClose,
}) => {
  const handleCopyCode = () => {
    navigator.clipboard.writeText(code);
    console.log('[CodeModal] 代碼已複製');
    // Optionally, add a user feedback like a snackbar or toast here
  };

  return (
    <Dialog open={visible} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>生成的 Python 代碼</DialogTitle>
      <DialogContent dividers>
        {/* <StyledTextarea value={code} readOnly /> */}
        <Editor
          height="50vh" // Or a fixed height like "500px"
          language="python"
          value={code}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            fontSize: 14, // Consistent font size
            wordWrap: 'on', // Enable word wrap
            scrollBeyondLastLine: false, // Optional: disable scrolling beyond the last line
            automaticLayout: true, // Ensure editor resizes Pferoperly within dialog
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCopyCode} color="primary">
          複製代碼
        </Button>
        <Button onClick={onClose}>關閉</Button>
      </DialogActions>
    </Dialog>
  );
};

export default CodeModal;
