# P0 Security Fix: Tool Call Details Leak in Chat Window

## Security Incident Summary

**Severity**: CRITICAL (P0)  
**Issue**: Agent tool call details (parameters, arguments) are being exposed in the right-side chat window on port 7000 after session switching or re-login.  
**Impact**: Internal implementation details and potentially sensitive tool parameters visible to end users.

## Root Cause Analysis

### Primary Issues Found

1. **Backend: `RenderStyle.show_tool_details = True` by default**
   - File: `CoPaw/src/copaw/app/channels/renderer.py` (line 41)
   - The default setting exposes tool call arguments to all channels

2. **Backend: Console Channel forwards raw tool call data**
   - File: `CoPaw/src/copaw/app/channels/console/channel.py`
   - Messages rendered with tool details are pushed to frontend via `console_push_store.py`

3. **Frontend: Session loading displays raw content with tool details**
   - File: `Selgen/src/app/(canvas)/canvas/page.tsx` (lines 147-224)
   - When loading session history from `/api/chats/${chatId}`, tool call details in metadata are exposed
   - The `safeToString` function stringifies objects that may contain tool parameters

4. **Frontend: Agent API route forwards ALL data including tool calls**
   - File: `Selgen/src/app/api/agent/route.ts` (lines 86-89)
   - Comment explicitly states: "Forward the full message data to client - This includes tool calls"

## Affected Files

### Backend (CoPaw)
1. `CoPaw/src/copaw/app/channels/renderer.py` - Tool call rendering logic
2. `CoPaw/src/copaw/app/channels/console/channel.py` - Console channel message handling
3. `CoPaw/src/copaw/app/channels/base.py` - Base channel with `show_tool_details` flag
4. `CoPaw/src/copaw/app/console_push_store.py` - Message storage for frontend

### Frontend (Selgen)
1. `Selgen/src/app/(canvas)/canvas/page.tsx` - Session loading and message display
2. `Selgen/src/app/api/agent/route.ts` - API proxy that forwards raw data
3. `Selgen/src/components/canvas/ChatView.tsx` - Message rendering component

## Fix Strategy

### Phase 1: Backend - Disable Tool Details by Default

**File**: `CoPaw/src/copaw/app/channels/renderer.py`

**Change**:
```python
# Line 41 - Change default to False
@dataclass
class RenderStyle:
    """Channel capabilities for rendering (no hardcoded markdown/emoji)."""

    show_tool_details: bool = False  # WAS: True
    supports_markdown: bool = True
    supports_code_fence: bool = True
    use_emoji: bool = True
    filter_tool_messages: bool = False
    filter_thinking: bool = False
```

**Verification**: Tool calls should display as "🔧 **tool_name**" without arguments.

---

### Phase 2: Backend - Ensure Console Channel Hides Tool Details

**File**: `CoPaw/src/copaw/app/channels/console/channel.py`

**Change**: Ensure `from_config` and `from_env` set `show_tool_details=False`:

```python
@classmethod
def from_config(
    cls,
    process: ProcessHandler,
    config: ConsoleChannelConfig,
    on_reply_sent: OnReplySent = None,
    show_tool_details: bool = False,  # Force False for console
    filter_tool_messages: bool = False,
    filter_thinking: bool = False,
) -> "ConsoleChannel":
```

**Verification**: Console channel should never expose tool arguments.

---

### Phase 3: Frontend - Filter Tool Details in Session Loading

**File**: `Selgen/src/app/(canvas)/canvas/page.tsx`

**Change**: Lines 147-224 - Filter out tool call details when loading messages:

```typescript
// Add filtering logic in loadSession function
const uiMessages = data.messages.map((m: any) => {
  // NEVER expose tool call arguments or raw tool data
  let content = ''
  
  // Extract only safe content, filter out tool calls from metadata
  const safeMetadata = m.metadata ? {
    ...m.metadata,
    tool_calls: undefined,  // Remove tool call details
    tool_arguments: undefined,
    raw_tool_output: undefined,
  } : undefined
  
  // ... rest of content extraction without tool details
})
```

**Verification**: After switching sessions, tool details should not appear.

---

### Phase 4: Frontend - Filter API Response Data

**File**: `Selgen/src/app/api/agent/route.ts`

**Change**: Lines 86-89 - Filter out tool call data before forwarding:

```typescript
// Filter out tool call details before forwarding
const sanitizedData = {
  ...data,
  // Remove tool call specific fields
  arguments: undefined,
  tool_calls: undefined,
  function_call: undefined,
  // Keep only necessary fields
}
controller.enqueue(encoder.encode(JSON.stringify(sanitizedData) + '\n'))
```

**Verification**: Raw tool data should not reach the frontend.

---

### Phase 5: Frontend - Sanitize Message Content Display

**File**: `Selgen/src/components/canvas/ChatView.tsx`

**Change**: Lines 83-89 - Add content sanitization:

```typescript
// Sanitize content to remove any tool call patterns
const sanitizeContent = (content: any): string => {
  if (typeof content === 'string') {
    // Remove tool call JSON blocks
    return content
      .replace(/```json\s*{\s*"name"\s*:\s*"[^"]+"[^}]+}\s*```/g, '[Tool Call]')
      .replace(/🔧\s*\*\*[^*]+\*\*\s*```[\s\S]*?```/g, '[Tool Used]')
  }
  // ... handle other types
}
```

**Verification**: Any remaining tool patterns should be masked.

---

### Phase 6: Backend - Add WebChat Channel with Strict Filtering

**Create**: `CoPaw/src/copaw/app/channels/webchat/channel.py`

Since the port 7000 interface uses webchat channel, create a dedicated channel that:
1. Always sets `show_tool_details=False`
2. Filters tool messages entirely or shows minimal info
3. Sanitizes all output before sending to frontend

```python
class WebChatChannel(BaseChannel):
    """WebChat channel with strict tool detail filtering."""
    
    channel = "webchat"
    
    def __init__(self, process, **kwargs):
        # Force hide tool details for security
        kwargs['show_tool_details'] = False
        kwargs['filter_tool_messages'] = True  # Or False with sanitized output
        super().__init__(process, **kwargs)
```

---

## Testing & Verification

### Test Scenarios

1. **New Session - First Conversation**
   - Send message that triggers tool call
   - Verify: Only tool name shown, no arguments visible

2. **Session Switching**
   - Switch to existing session with tool calls
   - Verify: Tool details do NOT appear in message history

3. **Re-login Flow**
   - Log out and log back in
   - Load previous session
   - Verify: No tool call parameters exposed

4. **API Response Inspection**
   - Monitor `/api/agent/process` response
   - Verify: No `arguments`, `tool_calls`, or sensitive fields in JSON

### Verification Commands

```bash
# Check backend logs for tool call rendering
pm2 logs copaw-webchat-dev | grep -i "tool"

# Monitor API responses
curl -s http://localhost:7088/api/chats/<chat_id> | jq '.messages[] | {role, content, metadata}'
```

---

## Security Checklist

- [ ] `show_tool_details` defaults to `False` in `RenderStyle`
- [ ] Console channel always uses `show_tool_details=False`
- [ ] WebChat channel created with strict filtering
- [ ] Frontend session loading filters tool metadata
- [ ] API proxy sanitizes responses
- [ ] ChatView component sanitizes displayed content
- [ ] All test scenarios pass
- [ ] Code review completed
- [ ] No `arguments` or `tool_calls` in API responses

---

## Implementation Order

1. **Phase 1** - Backend default change (safest, minimal impact)
2. **Phase 2** - Console channel enforcement
3. **Phase 4** - Frontend API filtering
4. **Phase 3** - Frontend session loading
5. **Phase 5** - Frontend display sanitization
6. **Phase 6** - Dedicated WebChat channel (optional enhancement)

---

## Notes

- This fix prioritizes security over feature completeness
- Tool call visibility can be re-enabled via explicit configuration if needed
- The fix should be backported to any active release branches
- Consider adding audit logging for tool call executions (without exposing arguments to users)
