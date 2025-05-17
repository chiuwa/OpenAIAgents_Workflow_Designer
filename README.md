[easy_version_workflow.json](https://github.com/user-attachments/files/20266110/easy_version_workflow.json)# OpenAI Agents Workflow Designer - 可視化工作流設計器

**(English Title: OpenAI Agents Workflow Designer - Visual Workflow Designer)**

---

一個基於 Web 的可視化工具，允許用戶通過拖放節點、配置屬性、連接節點來設計 OpenAI Agents 工作流，並最終生成可運行的 Python SDK 代碼。

An open-source, web-based visual tool that allows users to design OpenAI Agents workflows by dragging and dropping nodes, configuring their properties, connecting them, and ultimately generating runnable Python SDK code.

[![chiuwa/OpenAIAgents_Workflow_Designer](https://img.shields.io/badge/GitHub-chiuwa/OpenAIAgents_Workflow_Designer-blue?logo=github)](https://github.com/chiuwa/OpenAIAgents_Workflow_Designer)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Demo / 截圖 (Demo / Screenshots)
![image](https://github.com/user-attachments/assets/ee6cee31-39e6-4e75-a94d-ef621576a807)
![image](https://github.com/user-attachments/assets/cf82b0ac-a784-4e8e-8ab7-4397518a0ac8)
![image](https://github.com/user-attachments/assets/7d441e67-69f9-40c6-abe9-68d74357b22e)



## 主要功能 (Key Features)

*   **可視化拖放界面 (Visual Drag & Drop Interface)**: 使用 [React Flow](https://reactflow.dev/) 輕鬆構建和修改工作流。
    *   Easily build and modify workflows using [React Flow](https://reactflow.dev/).
*   **多樣化的節點類型 (Diverse Node Types)**:
    *   **Agent 節點 (Agent Node)**: 定義核心處理單元，包括指令、工具、輸出模型 (Pydantic) 和 Handoffs。
        *   Define core processing units, including instructions, tools, output models (Pydantic), and handoffs.
    *   **Function Tool 節點 (Function Tool Node)**: 創建並配置供 Agent 使用的 Python 工具函數。
        *   Create and configure Python tool functions for Agents to use.
    *   **Runner 節點 (Runner Node)**: 設置工作流的執行入口、輸入和運行模式（同步/異步）。
        *   Set up the execution entry point, input, and run mode (synchronous/asynchronous) for the workflow.
    *   **Input 節點 (Input Node)**: 為 Runner 提供初始輸入消息。
        *   Provide initial input messages for the Runner.
    *   **Guardrail 節點 (Guardrail Node)**: 實現輸入/輸出守衛，可配置內部 Agent 進行複雜邏輯判斷。
        *   Implement input/output guards, configurable with an internal Agent for complex logic.
*   **動態屬性面板 (Dynamic Properties Panel)**: 根據選中節點，實時編輯節點屬性，使用 [Zustand](https://zustand-demo.pmnd.rs/) 管理全局狀態。
    *   Edit node properties in real-time based on the selected node, using [Zustand](https://zustand-demo.pmnd.rs/) for global state management.
*   **Python SDK 代碼生成 (Python SDK Code Generation)**: 一鍵生成符合 OpenAI Agents Python SDK 規範的可執行 Python 腳本。
    *   One-click generation of executable Python scripts compliant with the OpenAI Agents Python SDK.
*   **Pydantic 模型支持 (Pydantic Model Support)**: 為 Agent 和 Guardrail 內部 Agent 定義結構化的輸出類型。
    *   Define structured output types for Agents and Guardrail internal Agents.
*   **工作流保存與載入 (Workflow Save & Load)**: 以 JSON 格式導出和導入工作流設計。
    *   Export and import workflow designs in JSON format.
*   **用戶體驗優化 (User Experience Enhancements)**:
    *   節點展開/折疊 (Node expand/collapse)
    *   代碼生成彈窗語法高亮 (Syntax highlighting in code generation modal)
    *   畫布吸附網格和點狀背景 (Canvas snap-to-grid and dot background)
*   **詳細的工作流元數據 (Detailed Workflow Metadata)**: 可為每個工作流添加名稱和描述。
    *   Add names and descriptions for each workflow.

## 技術棧 (Tech Stack)

*   **前端 (Frontend)**:
    *   [Next.js](https://nextjs.org/) (React Framework)
    *   [TypeScript](https://www.typescriptlang.org/)
    *   [React Flow](https://reactflow.dev/) (Workflow visualization)
    *   [Zustand](https://zustand-demo.pmnd.rs/) (State management)
    *   [Material UI (MUI)](https://mui.com/) (Component library)
    *   [Monaco Editor](https://microsoft.github.io/monaco-editor/) (Code editor for tool implementation & Pydantic schemas)
*   **代碼生成 (Code Generation)**:
    *   Custom TypeScript logic to generate Python code for the [OpenAI Agents Python SDK](https://github.com/openai/openai-agents).
*   **開發工具 (Development Tools)**:
    *   [ESLint](https://eslint.org/), [Prettier](https://prettier.io/) (Linting and formatting - though Prettier for Python was removed from direct frontend use)

## 安裝與運行 (Installation & Setup)

1.  **克隆倉庫 (Clone the repository):**
    ```bash
    git clone https://github.com/chiuwa/OpenAIAgents_Workflow_Designer.git
    cd OpenAIAgents_Workflow_Designer
    ```

2.  **安裝依賴 (Install dependencies):**
    ```bash
    npm install
    # 或者 (or)
    # yarn install
    ```

3.  **運行開發服務器 (Run the development server):**
    ```bash
    npm run dev
    # 或者 (or)
    # yarn dev
    ```
    然後在瀏覽器中打開 `http://localhost:3000`。
    Then open `http://localhost:3000` in your browser.

## 使用指南 (Usage Guide)

1.  **拖放節點 (Drag & Drop Nodes)**: 從左側邊欄將 Agent, Function Tool, Runner, Input, Guardrail 節點拖到畫布上。
    *   Drag Agent, Function Tool, Runner, Input, and Guardrail nodes from the left sidebar onto the canvas.
2.  **配置節點 (Configure Nodes)**: 單擊節點，在右側屬性面板中配置其詳細信息（例如 Agent 指令、工具函數實現、Runner 輸入等）。
    *   Click on a node to configure its details in the right-hand properties panel (e.g., Agent instructions, tool function implementation, Runner input, etc.).
3.  **連接節點 (Connect Nodes)**: 從節點的 Handle（圓點）拖動到另一個節點的 Handle 以創建連接。
    *   Drag from a node's handle (the small circle) to another node's handle to create connections.
    *   確保連接符合邏輯（例如，Function Tool 連接到 Agent 的 `tools` 輸入，Agent 連接到 Agent 的 `handoffs` 輸入，Input 連接到 Runner 的 `input` 等）。
        *   Ensure connections are logical (e.g., Function Tool to Agent's `tools` input, Agent to Agent's `handoffs` input, Input to Runner's `input`, etc.).
4.  **配置工作流元數據 (Configure Workflow Metadata)**: 在左側邊欄頂部輸入工作流的名稱和描述。
    *   Enter the workflow name and description at the top of the left sidebar.
5.  **生成代碼 (Generate Code)**: 點擊頂部工具欄的 "生成代碼" (Generate Code) 按鈕，查看並複製生成的 Python 腳本。
    *   Click the "生成代碼" (Generate Code) button in the top toolbar to view and copy the generated Python script.
6.  **保存/載入工作流 (Save/Load Workflow)**: 使用頂部工具欄的 "保存" (Save) 和 "載入" (Load) 按鈕來導出或導入您的工作流設計 (JSON 格式)。
    *   Use the "保存" (Save) and "載入" (Load) buttons in the top toolbar to export or import your workflow design (in JSON format).

## 範例工作流 (Example Workflows)

項目中將提供兩個 JSON 範例文件，您可以通過 "載入工作流" 功能導入它們來快速了解不同節點的用法：

The project will provide two example JSON files that you can import via the "Load Workflow" feature to quickly understand the usage of different nodes:

*   `easy_version_workflow.json`: 一個包含基本節點（Input, Agent, Function Tool, Runner）的簡單工作流。
    *   A simple workflow containing basic nodes (Input, Agent, Function Tool, Runner).
*   `sample_workflow.json`: 一個更複雜的工作流，展示了包括 Guardrail 在內的多種節點和交互。
    *   A more complex workflow demonstrating various nodes and interactions, including Guardrails.

這些文件位於項目的 `/public/` 目錄下。
These files will be located in the project's `/public/` directory.

## 貢獻 (Contributing)

歡迎各種形式的貢獻！如果您有任何建議、發現了 Bug 或想要添加新功能，請隨時創建 Issue 或提交 Pull Request。

Contributions of all kinds are welcome! If you have any suggestions, find a bug, or want to add new features, please feel free to create an Issue or submit a Pull Request.

1.  Fork 本倉庫 (Fork this repository)
2.  創建您的特性分支 (Create your feature branch) (`git checkout -b feature/AmazingFeature`)
3.  提交您的更改 (Commit your changes) (`git commit -m 'Add some AmazingFeature'`)
4.  推送到分支 (Push to the branch) (`git push origin feature/AmazingFeature`)
5.  開啟一個 Pull Request (Open a Pull Request)

## 待辦事項 / 未來展望 (Roadmap / Future Enhancements)

*   [ ] 更智能的節點大小自適應 (Smarter node auto-sizing based on content)
*   [ ] 增強拖放時的放置位置提示 (Enhanced drop placement hints)
*   [ ] 工作流版本控制 (Workflow versioning)
*   [ ] 實時協作 (Real-time collaboration features)
*   [ ] 更完善的錯誤校驗和提示 (More comprehensive error checking and hints)
*   [ ] 主題切換 (Theme switching - light/dark mode)
*   [ ] 集成測試 (Integration tests)

## 授權 (License)

本項目採用 MIT 授權。詳情請見 `LICENSE` 文件。
This project is licensed under the MIT License. See the `LICENSE` file for details.

---

感謝您的使用和貢獻！
Thank you for using and contributing! 
