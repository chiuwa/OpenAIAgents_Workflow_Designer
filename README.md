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

[Uploadi{
    "workflowName": "綜合範例工作流 (OpenAI Agents)",
    "workflowDescription": "一個包含所有節點類型和多種交互的複雜工作流，參考官方 SDK 範例。",
    "nodes": [
      {
        "id": "input_start_workflow",
        "type": "input",
        "position": { "x": 50, "y": 400 },
        "data": {
          "nodeType": "input",
          "name": "用戶初始請求",
          "message": "Tell me about the first president of the United States and also calculate 2 + 2.",
          "isExpanded": true
        }
      },
      {
        "id": "guardrail_homework_check",
        "type": "guardrail",
        "position": { "x": 350, "y": 150 },
        "data": {
          "nodeType": "guardrail",
          "name": "作業問題檢查器",
          "guardrailType": "input",
          "description": "檢查用戶輸入是否與家庭作業相關。如果不是作業，則繼續。",
          "internalAgentName": "HomeworkCheckAgent",
          "internalAgentInstructions": "You are an agent that checks if the user's query is about homework. Respond with is_homework (boolean) and reasoning (string).",
          "internalAgentPydanticSchema": {
            "modelName": "HomeworkCheckOutput",
            "description": "Output schema for homework check guardrail agent.",
            "fields": [
              { "id": "field_hw_1_unique", "name": "is_homework", "type": "boolean", "isOptional": false, "description": "True if the query is about homework." },
              { "id": "field_hw_2_unique", "name": "reasoning", "type": "string", "isOptional": false, "description": "Reasoning behind the decision." }
            ]
          },
          "tripwireConditionLogic": "output.is_homework == True",
          "isExpanded": false
        }
      },
      {
        "id": "agent_triage_main",
        "type": "agent",
        "position": { "x": 650, "y": 400 },
        "data": {
          "nodeType": "agent",
          "name": "請求分流 Agent",
          "instructions": "You are a helpful assistant. Analyze the user's request. If it's a math question, handoff to MathTutor. If it's a history question, handoff to HistoryTutor. If it involves calculation, use the calculator tool. For weather, use the weather tool. Otherwise, try to answer directly.",
          "handoff_description": "Hands off to specialized agents based on query type if tools are not suitable.",
          "pydanticSchema": {
            "modelName": "TriageFinalAnswer",
            "description": "The final answer or summary provided by the Triage agent after processing.",
            "fields": [
              { "id": "field_tfa_1_unique", "name": "final_content", "type": "string", "isOptional": false, "description": "The comprehensive answer or a summary of handoff/tool use." },
              { "id": "field_tfa_2_unique", "name": "action_taken", "type": "string", "isOptional": false, "description": "Brief description of action (e.g., 'answered_directly', 'handed_off_to_math', 'used_calculator_tool')."}
            ]
          },
          "isExpanded": true
        }
      },
      {
        "id": "tool_get_weather",
        "type": "functionTool",
        "position": { "x": 350, "y": 400 },
        "data": {
          "nodeType": "functionTool",
          "name": "獲取天氣工具",
          "description": "Get the current weather for a given city.",
          "parameters": [
            { "id": "param_gw_1_unique", "name": "city", "type": "string" }
          ],
          "returnType": "string",
          "implementation": "import random\nchoices = [\"sunny\", \"cloudy\", \"rainy\", \"snowy\"]\nreturn f\"The weather in {city} is {random.choice(choices)}.\"",
          "isExpanded": false
        }
      },
      {
        "id": "tool_calculator",
        "type": "functionTool",
        "position": { "x": 350, "y": 580 },
        "data": {
          "nodeType": "functionTool",
          "name": "簡易計算機工具",
          "description": "Performs simple arithmetic (add, subtract, multiply, divide). Operator should be '+', '-', '*', '/'.",
          "parameters": [
            { "id": "param_calc_1_unique", "name": "operand1", "type": "number" },
            { "id": "param_calc_2_unique", "name": "operator", "type": "string" },
            { "id": "param_calc_3_unique", "name": "operand2", "type": "number" }
          ],
          "returnType": "number",
          "implementation": "if operator == '+':\n  return operand1 + operand2\nelif operator == '-':\n  return operand1 - operand2\nelif operator == '*':\n  return operand1 * operand2\nelif operator == '/' and operand2 != 0:\n  return operand1 / operand2\nelif operator == '/' and operand2 == 0:\n  raise ValueError(\"Cannot divide by zero\")\nelse:\n  raise ValueError(f\"Unknown operator: {operator}\")",
          "isExpanded": false
        }
      },
      {
        "id": "agent_math_tutor",
        "type": "agent",
        "position": { "x": 1000, "y": 250 },
        "data": {
          "nodeType": "agent",
          "name": "數學導師 Agent",
          "instructions": "You are a specialist in mathematics. Explain your reasoning step by step and include examples if possible. Your output should be a MathProblemSolution.",
          "handoff_description": "Specialist for math questions that the Triage agent cannot handle with tools.",
          "pydanticSchema": {
            "modelName": "MathProblemSolution",
            "description": "Provides a solution and explanation for a math problem.",
            "fields": [
              { "id": "field_mps_1_unique", "name": "problem_statement", "type": "string", "isOptional": false, "description": "The original math problem." },
              { "id": "field_mps_2_unique", "name": "solution_steps", "type": "list", "isOptional": false, "description": "Step-by-step explanation as a list of strings." },
              { "id": "field_mps_3_unique", "name": "final_answer", "type": "string", "isOptional": false, "description": "The final answer to the problem." }
            ]
          },
          "isExpanded": false
        }
      },
      {
        "id": "agent_history_tutor",
        "type": "agent",
        "position": { "x": 1000, "y": 550 },
        "data": {
          "nodeType": "agent",
          "name": "歷史導師 Agent",
          "instructions": "You are a specialist in history. Explain important events and context clearly. Provide detailed information.",
          "handoff_description": "Specialist for historical questions.",
          "isExpanded": true
        }
      },
      {
          "id": "guardrail_history_filter",
          "type": "guardrail",
          "position": { "x": 1300, "y": 650 },
          "data": {
            "nodeType": "guardrail",
            "name": "歷史內容過濾器",
            "guardrailType": "output",
            "description": "Ensures historical answers are neutral, respectful, and cite sources if making specific claims. Tripwire if critique is severe.",
            "internalAgentName": "HistoryOutputReviewAgent",
            "internalAgentInstructions": "Review the historical explanation. Check for neutrality, respectfulness, and presence of source citations for claims. Output fields: `is_appropriate` (boolean), `critique_level` (string, e.g., 'minor', 'major'), `suggestions` (string).",
            "internalAgentPydanticSchema": {
              "modelName": "HistoryReviewOutput",
              "description": "Output for historical content review.",
              "fields": [
                { "id": "field_hr_1_unique", "name": "is_appropriate", "type": "boolean", "isOptional": false },
                { "id": "field_hr_2_unique", "name": "critique_level", "type": "string", "isOptional": false },
                { "id": "field_hr_3_unique", "name": "suggestions", "type": "string", "isOptional": true }
              ]
            },
            "tripwireConditionLogic": "output.critique_level == 'major'", 
            "isExpanded": false
          }
      },
      {
        "id": "runner_main_execution",
        "type": "runner",
        "position": { "x": 650, "y": 700 },
        "data": {
          "nodeType": "runner",
          "name": "主流程執行器",
          "input": "Tell me about the first president of the United States and also calculate 2 + 2.", 
          "execution_mode": "async",
          "isExpanded": true
        }
      },
      {
        "id": "runner_math_specialist",
        "type": "runner",
        "position": { "x": 1300, "y": 250 },
        "data": {
          "nodeType": "runner",
          "name": "數學專家執行器",
          "input": "", 
          "execution_mode": "sync",
          "context": "{'calculation_precision': 'high'}",
          "isExpanded": false
        }
      },
      {
        "id": "runner_history_specialist",
        "type": "runner",
        "position": { "x": 1300, "y": 450 },
        "data": {
          "nodeType": "runner",
          "name": "歷史專家執行器",
          "input": "",
          "execution_mode": "async",
          "isExpanded": false
        }
      }
    ],
    "edges": [
      { "id": "edge_input_conceptual_to_triage", "source": "input_start_workflow", "target": "agent_triage_main", "type": "custom", "label": "Initial Input", "animated": false, "style": { "strokeDasharray": "5,5", "stroke":"#9ca3af" }, "markerEnd": { "type": "arrowclosed", "color": "#9ca3af"} },
      { "id": "edge_guardrail_input_to_triage", "source": "guardrail_homework_check", "target": "agent_triage_main", "type": "custom", "label": "Input Guardrail", "animated": true, "markerEnd": { "type": "arrowclosed"} },
      { "id": "edge_triage_uses_tool_weather", "source": "tool_get_weather", "target": "agent_triage_main", "type": "custom", "label": "Uses Tool", "animated": true, "markerEnd": { "type": "arrowclosed"} },
      { "id": "edge_triage_uses_tool_calculator", "source": "tool_calculator", "target": "agent_triage_main", "type": "custom", "label": "Uses Tool", "animated": true, "markerEnd": { "type": "arrowclosed"} },
      { "id": "edge_triage_handoff_math", "source": "agent_triage_main", "target": "agent_math_tutor", "type": "custom", "label": "Handoff: Math", "animated": true, "markerEnd": { "type": "arrowclosed"} },
      { "id": "edge_triage_handoff_history", "source": "agent_triage_main", "target": "agent_history_tutor", "type": "custom", "label": "Handoff: History", "animated": true, "markerEnd": { "type": "arrowclosed"} },
      { "id": "edge_history_output_guardrail", "source": "guardrail_history_filter", "target": "agent_history_tutor", "type": "custom", "label": "Output Guardrail", "animated": true, "markerEnd": { "type": "arrowclosed"} },
  

       { "id": "edge_agent_triage_to_runner_main", "source": "agent_triage_main", "target": "runner_main_execution", "type": "custom", "label": "Executed by", "animated": false, "style": { "strokeDasharray": "5,5", "stroke":"#6b7280" }, "markerEnd": { "type": "arrowclosed", "color": "#6b7280"} },

       { "id": "edge_agent_math_to_runner_math", "source": "agent_math_tutor", "target": "runner_math_specialist", "type": "custom", "label": "Executed by", "animated": false, "style": { "strokeDasharray": "5,5", "stroke":"#6b7280" }, "markerEnd": { "type": "arrowclosed", "color": "#6b7280"} },
   
       { "id": "edge_agent_history_to_runner_history", "source": "agent_history_tutor", "target": "runner_history_specialist", "type": "custom", "label": "Executed by", "animated": false, "style": { "strokeDasharray": "5,5", "stroke":"#6b7280" }, "markerEnd": { "type": "arrowclosed", "color": "#6b7280"} }
    ]
  }ng sample_workflow.json…]()
[Uploa{
  "workflowName": "簡易範例工作流",
  "workflowDescription": "一個包含 Input, Agent (帶 Pydantic Output), Function Tool 和 Runner 的基礎工作流。",
  "nodes": [
    {
      "id": "input_user_greeting",
      "type": "input",
      "position": {
        "x": 50,
        "y": 100
      },
      "data": {
        "nodeType": "input",
        "name": "用戶問候",
        "message": "Hello, what can you do? ",
        "isExpanded": true
      },
      "width": 150,
      "height": 124,
      "selected": false,
      "dragging": false
    },
    {
      "id": "tool_greet_user",
      "type": "functionTool",
      "position": {
        "x": 560,
        "y": 160
      },
      "data": {
        "nodeType": "functionTool",
        "name": "問候語生成工具",
        "description": "Generates a greeting message.",
        "parameters": [
          {
            "id": "param_user_name_greet",
            "name": "user_name",
            "type": "string",
            "description": "Name of the user."
          }
        ],
        "returnType": "string",
        "implementation": "return f\"Hello {user_name}! I am a helpful assistant. You asked: '{initial_input_message}'\"",
        "isExpanded": false
      },
      "width": 250,
      "height": 147,
      "selected": false,
      "dragging": false,
      "positionAbsolute": {
        "x": 560,
        "y": 160
      }
    },
    {
      "id": "agent_greeting_processor",
      "type": "agent",
      "position": {
        "x": 288,
        "y": 368
      },
      "data": {
        "nodeType": "agent",
        "name": "問候處理 Agent",
        "instructions": "You are an agent that greets the user. Use the '問候語生成工具' to formulate a response. The user's name is 'Guest' if not otherwise specified. Include the original message in your greeting.",
        "pydanticSchema": {
          "id": "schema_greeting_output_unique",
          "modelName": "GreetingResponse",
          "description": "The structured response from the Greeting Agent.",
          "fields": [
            {
              "id": "field_gr_1_unique",
              "name": "greeting_message",
              "type": "string",
              "isOptional": false,
              "description": "The generated greeting message."
            },
            {
              "id": "field_gr_2_unique",
              "name": "processed_input",
              "type": "string",
              "isOptional": false,
              "description": "The input message that was processed."
            }
          ]
        },
        "isExpanded": true
      },
      "width": 250,
      "height": 248,
      "selected": false,
      "dragging": false,
      "positionAbsolute": {
        "x": 288,
        "y": 368
      }
    },
    {
      "id": "runner_execute_greeting",
      "type": "runner",
      "position": {
        "x": 288,
        "y": 736
      },
      "data": {
        "nodeType": "runner",
        "name": "執行問候 Agent",
        "input": "Hello, what can you do? ",
        "executionMode": "sync",
        "context": "{\"initial_input_message\": \"Hello, what can you do?\"}",
        "isExpanded": true
      },
      "width": 250,
      "height": 174,
      "selected": true,
      "dragging": false,
      "positionAbsolute": {
        "x": 288,
        "y": 736
      }
    }
  ],
  "edges": [
    {
      "id": "edge_input_to_agent_greeting_conceptual",
      "source": "input_user_greeting",
      "target": "agent_greeting_processor",
      "type": "custom",
      "label": "Provides Input For Runner"
    },
    {
      "id": "edge_tool_greet_to_agent_greeting",
      "source": "tool_greet_user",
      "target": "agent_greeting_processor",
      "type": "custom",
      "label": "Tool For Agent"
    },
    {
      "id": "edge_agent_greeting_to_runner_execute",
      "source": "agent_greeting_processor",
      "target": "runner_execute_greeting",
      "type": "custom",
      "label": "Executed By",
      "animated": true
    }
  ]
}ding easy_version_workflow.json…]()


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

這些文件位於項目的 `/public/examples/` 目錄下 (或您選擇存放它們的位置)。
These files will be located in the project's `/public/examples/` directory (or wherever you choose to place them).

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
