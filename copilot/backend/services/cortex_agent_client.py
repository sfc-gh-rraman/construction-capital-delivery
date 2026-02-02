"""
Cortex Agent REST API Client

Calls the Snowflake Cortex Agents REST API and streams responses
including "thinking steps" back to the frontend via SSE.
"""

import os
import json
import logging
import httpx
from typing import AsyncGenerator, Optional, Dict, Any, List

logger = logging.getLogger(__name__)


class CortexAgentClient:
    """
    Client for calling Snowflake Cortex Agents REST API.
    
    Endpoint: POST /api/v2/databases/{db}/schemas/{schema}/agents/{name}:run
    
    Authentication: OAuth token from SPCS (/snowflake/session/token)
    """
    
    def __init__(self):
        self.database = os.environ.get("SNOWFLAKE_DATABASE", "CAPITAL_PROJECTS_DB")
        # Agent is in CAPITAL_PROJECTS schema, not ATOMIC
        self.schema = "CAPITAL_PROJECTS"
        self.agent_name = "ATLAS_CAPTIAL_PROJECTS_AGENT"
        self.host = os.environ.get("SNOWFLAKE_HOST", "")
        self._token = None
        
        logger.info(f"CortexAgentClient initialized: db={self.database}, schema={self.schema}, agent={self.agent_name}")
    
    def _get_token(self) -> str:
        """Get OAuth token from SPCS session file."""
        token_path = "/snowflake/session/token"
        if os.path.exists(token_path):
            with open(token_path, "r") as f:
                return f.read().strip()
        raise RuntimeError("No SPCS token available - not running in SPCS?")
    
    def _get_base_url(self) -> str:
        """Get the Snowflake REST API base URL."""
        if not self.host:
            raise RuntimeError("SNOWFLAKE_HOST environment variable not set")
        return f"https://{self.host}"
    
    def _get_agent_url(self) -> str:
        """Get the agent run endpoint URL - named agent format."""
        base = self._get_base_url()
        # Named agent endpoint: /api/v2/databases/{db}/schemas/{schema}/agents/{name}:run
        return f"{base}/api/v2/databases/{self.database}/schemas/{self.schema}/agents/{self.agent_name}:run"
    
    def _format_messages_for_api(self, messages: List[Dict[str, str]]) -> List[Dict[str, Any]]:
        """
        Format messages for Cortex Agent API.
        
        The API expects content to be an array of content objects:
        {"role": "user", "content": [{"type": "text", "text": "..."}]}
        
        NOT a bare string:
        {"role": "user", "content": "..."} <-- WRONG
        """
        formatted = []
        for msg in messages:
            formatted.append({
                "role": msg["role"],
                "content": [
                    {
                        "type": "text",
                        "text": msg["content"]
                    }
                ]
            })
        return formatted
    
    async def run_agent_stream(
        self,
        messages: List[Dict[str, str]],
        conversation_id: Optional[str] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Call the Cortex Agent REST API with streaming enabled.
        
        Yields events including:
        - type: "thinking" - Planning/reasoning steps
        - type: "text" - Response text chunks
        - type: "tool_use" - SQL execution info
        - type: "done" - Stream complete
        - type: "error" - Error occurred
        
        Args:
            messages: List of message dicts with 'role' and 'content'
            conversation_id: Optional conversation ID for context
            
        Yields:
            Event dicts with type and data
        """
        try:
            token = self._get_token()
            url = self._get_agent_url()
            
            headers = {
                "Authorization": f"Bearer {token}",
                "Content-Type": "application/json",
                "Accept": "text/event-stream",
                "X-Snowflake-Authorization-Token-Type": "OAUTH",
            }
            
            # Format messages for Cortex Agent API - content must be array of objects!
            formatted_messages = self._format_messages_for_api(messages)
            
            body = {
                "messages": formatted_messages,
                "stream": True,
            }
            
            if conversation_id:
                body["thread_id"] = conversation_id
            
            logger.info(f"Request body: {json.dumps(body)[:500]}")
            
            logger.info(f"Calling Cortex Agent: {url}")
            logger.debug(f"Request body: {json.dumps(body)[:200]}")
            
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream(
                    "POST",
                    url,
                    headers=headers,
                    json=body,
                ) as response:
                    if response.status_code != 200:
                        error_text = await response.aread()
                        logger.error(f"Agent API error: {response.status_code} - {error_text}")
                        yield {
                            "type": "error",
                            "content": f"Agent API error: {response.status_code}",
                            "details": error_text.decode() if error_text else ""
                        }
                        return
                    
                    # Process SSE stream
                    buffer = ""
                    async for chunk in response.aiter_text():
                        buffer += chunk
                        
                        # Process complete events (separated by double newlines)
                        while "\n\n" in buffer:
                            event_str, buffer = buffer.split("\n\n", 1)
                            
                            # Parse SSE event
                            event = self._parse_sse_event(event_str)
                            if event:
                                yield event
                    
                    # Process any remaining buffer
                    if buffer.strip():
                        event = self._parse_sse_event(buffer)
                        if event:
                            yield event
            
            yield {"type": "done"}
            
        except Exception as e:
            logger.error(f"Cortex Agent stream error: {e}")
            yield {
                "type": "error",
                "content": str(e)
            }
    
    def _parse_sse_event(self, event_str: str) -> Optional[Dict[str, Any]]:
        """
        Parse an SSE event string from Cortex Agent API.
        
        Cortex Agent SSE format includes events like:
        - content_block_delta with delta.type="text_delta" and delta.text="..."
        - message_start, message_delta, message_stop
        - thinking steps
        """
        try:
            lines = event_str.strip().split("\n")
            event_type = None
            data = None
            
            for line in lines:
                if line.startswith("event:"):
                    event_type = line[6:].strip()
                elif line.startswith("data:"):
                    data_str = line[5:].strip()
                    if data_str == "[DONE]":
                        return {"type": "done"}
                    try:
                        data = json.loads(data_str)
                    except json.JSONDecodeError:
                        data = {"raw": data_str}
            
            if data is None:
                return None
            
            # Log raw event for debugging
            logger.debug(f"SSE event_type={event_type}, data_keys={data.keys() if isinstance(data, dict) else 'not_dict'}")
            
            result = {"type": event_type or "message"}
            
            if not isinstance(data, dict):
                result["content"] = str(data)
                return result
            
            # Handle Cortex Agent response format
            # The response has a "delta" field with content
            if "delta" in data:
                delta = data["delta"]
                
                # Text content - could be in delta.text or delta.content[].text
                if "text" in delta:
                    result["type"] = "text"
                    result["content"] = delta["text"]
                elif "content" in delta:
                    # Content is an array of content blocks
                    content_blocks = delta["content"]
                    if isinstance(content_blocks, list):
                        text_parts = []
                        for block in content_blocks:
                            if isinstance(block, dict) and "text" in block:
                                text_parts.append(block["text"])
                            elif isinstance(block, str):
                                text_parts.append(block)
                        if text_parts:
                            result["type"] = "text"
                            result["content"] = "".join(text_parts)
                    elif isinstance(content_blocks, str):
                        result["type"] = "text"
                        result["content"] = content_blocks
                
                # Thinking/planning steps
                if "thinking" in delta:
                    result["type"] = "thinking"
                    thinking = delta["thinking"]
                    if isinstance(thinking, dict):
                        result["title"] = thinking.get("title", "Processing")
                        result["content"] = thinking.get("content", "")
                    else:
                        result["title"] = "Processing"
                        result["content"] = str(thinking)
                
                # Tool use (SQL execution)
                if "tool_use" in delta:
                    result["type"] = "tool_use"
                    result["tool_use"] = delta["tool_use"]
                if "sql" in delta:
                    result["sql"] = delta["sql"]
                    
            # Handle top-level content (non-delta format)
            elif "content" in data:
                content = data["content"]
                if isinstance(content, list):
                    text_parts = []
                    for block in content:
                        if isinstance(block, dict) and "text" in block:
                            text_parts.append(block["text"])
                        elif isinstance(block, str):
                            text_parts.append(block)
                    result["type"] = "text"
                    result["content"] = "".join(text_parts)
                elif isinstance(content, str):
                    result["type"] = "text"
                    result["content"] = content
                    
            # Handle message types
            elif "type" in data:
                result["type"] = data["type"]
                if data["type"] == "message_start":
                    result["type"] = "thinking"
                    result["title"] = "Planning"
                    result["content"] = "Analyzing your question..."
                elif data["type"] == "message_stop":
                    result["type"] = "done"
                    
            # Handle text directly in data
            elif "text" in data:
                result["type"] = "text"
                result["content"] = data["text"]
            
            return result
            
        except Exception as e:
            logger.warning(f"Failed to parse SSE event: {e}, event_str={event_str[:200]}")
            return None
    
    async def run_agent(
        self,
        message: str,
        conversation_history: Optional[List[Dict[str, str]]] = None
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Convenience method to run agent with a single message.
        
        Args:
            message: User's message/question
            conversation_history: Optional previous messages
            
        Yields:
            Event dicts from the agent stream
        """
        messages = conversation_history or []
        messages.append({"role": "user", "content": message})
        
        async for event in self.run_agent_stream(messages):
            yield event


# Singleton instance
_agent_client: Optional[CortexAgentClient] = None


def get_cortex_agent_client() -> CortexAgentClient:
    """Get or create Cortex Agent client singleton."""
    global _agent_client
    if _agent_client is None:
        _agent_client = CortexAgentClient()
    return _agent_client
