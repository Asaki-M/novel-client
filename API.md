# Novel Server API 接口

## 1. Agent 聊天

### 1.1 普通聊天接口

**POST** `/api/agent/chat`

**请求体:**
```json
{
  "sessionId": "string",
  "characterId": "string",
  "message": "string"
}
```

**响应体:**
```json
{
  "success": true,
  "data": {
    "character": {
      "id": "string",
      "name": "string",
      "avatar": "string",
      "description": "string",
      "systemPrompt": "string",
      "backstoryPrompt": "string",
      "backstory": "string",
      "createdAt": "string",
      "updatedAt": "string"
    },
    "message": "string",
    "usage": {
      "prompt_tokens": 0,
      "completion_tokens": 0,
      "total_tokens": 0
    }
  }
}
```

### 1.2 流式聊天接口

**POST** `/api/agent/chat/stream`

**请求体:**
```json
{
  "sessionId": "string",
  "characterId": "string",
  "message": "string"
}
```

**响应格式:** Server-Sent Events (SSE)

**流式数据格式:**
```
data: {
  "type": "thinking" | "action" | "observation" | "final_answer" | "error",
  "content": "string",
  "iteration": 1,
  "action": "string",
  "isComplete": false,
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

**响应类型说明:**
- `thinking`: Agent 思考过程
- `action`: Agent 执行工具调用
- `observation`: 工具调用结果
- `final_answer`: 最终答案（包含 usage 统计）
- `error`: 错误信息（包含 usage 统计）

**结束标志:**
```
data: [DONE]
```

## 2. 角色卡管理

### 2.1 获取角色卡列表
**GET** `/api/characters`

**响应体:**
```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "avatar": "string",
      "description": "string",
      "systemPrompt": "string",
      "backstoryPrompt": "string",
      "backstory": "string",
      "createdAt": "string",
      "updatedAt": "string"
    }
  ]
}
```

### 2.2 获取角色卡详情
**GET** `/api/characters/:characterId`

**响应体:**
```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "avatar": "string",
    "description": "string",
    "systemPrompt": "string",
    "backstoryPrompt": "string",
    "backstory": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 2.3 创建角色卡
**POST** `/api/characters`

**请求体:**
```json
{
  "name": "string",
  "description": "string",
  "systemPrompt": "string",
  "avatar": "string",
  "backstoryPrompt": "string",
  "backstory": "string"
}
```

**响应体:**
```json
{
  "success": true,
  "message": "角色卡创建成功",
  "data": {
    "id": "string",
    "name": "string",
    "avatar": "string",
    "description": "string",
    "systemPrompt": "string",
    "backstoryPrompt": "string",
    "backstory": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 2.4 更新角色卡
**PUT** `/api/characters/:characterId`

**请求体:**
```json
{
  "name": "string",
  "avatar": "string",
  "description": "string",
  "systemPrompt": "string",
  "backstoryPrompt": "string",
  "backstory": "string"
}
```

**响应体:**
```json
{
  "success": true,
  "message": "角色卡更新成功",
  "data": {
    "id": "string",
    "name": "string",
    "avatar": "string",
    "description": "string",
    "systemPrompt": "string",
    "backstoryPrompt": "string",
    "backstory": "string",
    "createdAt": "string",
    "updatedAt": "string"
  }
}
```

### 2.5 删除角色卡
**DELETE** `/api/characters/:characterId`

**响应体:**
```json
{
  "success": true,
  "message": "角色卡删除成功"
}
```

## 3. 记忆管理

### 3.1 获取会话记忆
**GET** `/api/memory/:sessionId`

**响应体:**
```json
{
  "success": true,
  "data": [
    {
      "role": "string",
      "content": "string",
      "created_at": "string"
    }
  ]
}
```

### 3.2 清空会话记忆
**DELETE** `/api/memory/:sessionId`

**响应体:**
```json
{
  "success": true,
  "message": "已清空会话记忆",
  "data": {
    "deleted": 0
  }
}
```


# RAG Server API 文档

## 知识库管理接口

### 1. 创建知识库

**接口地址：** `POST /api/knowledge-base`

**请求参数：**

| 参数名      | 类型   | 必填 | 说明           |
|-------------|--------|------|----------------|
| name        | string | 是   | 知识库名称     |
| description | string | 否   | 知识库描述     |

### 2. 查询所有知识库

**接口地址：** `GET /api/knowledge-base/collections`

**请求参数：** 无

### 3. 更新知识库

**接口地址：** `PUT /api/knowledge-base/:collectionName`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名         | 类型   | 必填 | 说明           |
|----------------|--------|------|----------------|
| newName        | string | 否   | 新的知识库名称 |
| newDescription | string | 否   | 新的知识库描述 |

### 4. 删除知识库

**接口地址：** `DELETE /api/knowledge-base/:collectionName`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

## 文档管理接口

### 5. 添加文档到知识库

**接口地址：** `POST /api/knowledge-base/:collectionName/documents`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名    | 类型  | 必填 | 说明         |
|-----------|-------|------|--------------|
| documents | array | 是   | 文档数组     |

**documents 数组元素结构：**

| 参数名     | 类型   | 必填 | 说明     |
|------------|--------|------|----------|
| pageContent| string | 是   | 文档内容 |
| metadata   | object | 否   | 元数据   |

### 6. 搜索文档

**接口地址：** `POST /api/knowledge-base/:collectionName/search`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名 | 类型   | 必填 | 说明                     |
|--------|--------|------|--------------------------|
| query  | string | 是   | 查询文本                 |
| k      | number | 否   | 返回文档数量，默认为 5   |
| filter | object | 否   | 过滤条件                 |

### 7. 删除文档

**接口地址：** `DELETE /api/knowledge-base/:collectionName/documents`

**路径参数：**

| 参数名         | 类型   | 必填 | 说明       |
|----------------|--------|------|------------|
| collectionName | string | 是   | 知识库名称 |

**请求参数：**

| 参数名 | 类型  | 必填 | 说明           |
|--------|-------|------|----------------|
| ids    | array | 是   | 文档ID数组     |

## 文本处理接口

### 8. 分割文本

**接口地址：** `POST /api/split-text`

**请求参数：**

| 参数名       | 类型   | 必填 | 说明                                    |
|--------------|--------|------|-----------------------------------------|
| text         | string | 是   | 要分割的文本内容                        |
| chunkSize    | number | 否   | 分割块大小，默认为 100，必须是正整数    |
| chunkOverlap | number | 否   | 块重叠大小，默认为 0，必须≥0且<chunkSize |
