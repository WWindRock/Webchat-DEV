import { v4 as uuidv4 } from 'uuid'
import { BaseAgent } from '../base-agent'
import {
  AgentTask,
  ExecutionContext,
  AgentResponse,
  AgentMessage,
} from '../types'

const ASSISTANT_AGENT_CONFIG = {
  id: 'agent-assistant',
  role: 'assistant' as const,
  name: 'Assistant Agent',
  description: 'General purpose assistant for answering questions and providing help',
  backstory: `You are a helpful AI assistant.
You are knowledgeable about many topics and can help with:
- General questions and answers
- Task clarification
- Guidance and recommendations
- Information retrieval

Your goal is to understand user needs and provide helpful, accurate responses.`,
  capabilities: [
    {
      name: 'Question Answering',
      description: 'Answer general questions',
      skillNames: [],
    },
    {
      name: 'Task Clarification',
      description: 'Clarify user requirements',
      skillNames: [],
    },
    {
      name: 'Guidance',
      description: 'Provide guidance',
      skillNames: [],
    },
  ],
  maxIterations: 3,
  verbose: false,
}

export class AssistantAgent extends BaseAgent {
  constructor() {
    super(ASSISTANT_AGENT_CONFIG)
  }

  async executeTask(task: AgentTask, context: ExecutionContext): Promise<AgentResponse> {
    const startTime = Date.now()
    const messages: AgentMessage[] = []

    messages.push(this.createMessage(
      `Processing request: ${task.description}`,
      'thought'
    ))

    const delegation = this.shouldDelegate(task, context)

    if (delegation.shouldDelegate) {
      messages.push(this.createMessage(
        `Task requires specialized agent (${delegation.targetRole}), returning to master for delegation`,
        'observation'
      ))

      return {
        success: true,
        task: {
          ...task,
          status: 'pending',
          assignedAgent: delegation.targetRole,
          updatedAt: new Date(),
        },
        messages,
        artifacts: [],
        executionTime: Date.now() - startTime,
      }
    }

    const response = this.generateResponse(task, context)

    messages.push(this.createMessage(response, 'final'))

    await this.storeMemory(
      context,
      `Assistant interaction: ${task.description.substring(0, 50)}...`,
      'context'
    )

    return {
      success: true,
      task: {
        ...task,
        status: 'completed',
        result: {
          success: true,
          output: response,
        },
        updatedAt: new Date(),
      },
      messages,
      artifacts: [],
      executionTime: Date.now() - startTime,
    }
  }

  private generateResponse(task: AgentTask, context: ExecutionContext): string {
    const desc = task.description.toLowerCase()

    if (desc.includes('hello') || desc.includes('hi') || desc.includes('hey')) {
      return "Hello! I'm your AI assistant. How can I help you today? I can help with image generation, video creation, coding, data analysis, content writing, and more. Just describe what you need!"
    }

    if (desc.includes('what can you do') || desc.includes('help')) {
      return `I can help you with various tasks:

🎨 **Design & Media**
- Image generation and logo design
- Video creation and animation
- Visual content creation

💻 **Development**  
- Code generation and debugging
- Software development assistance
- Technical explanations

📝 **Content**
- Blog posts and articles
- Marketing copy
- Social media content

📊 **Data**
- Data analysis
- Charts and visualizations
- Reports and insights

Just tell me what you need, and I'll help you get it done!`
    }

    return `I understand you're asking about "${task.description}". 

To help you better, could you provide more details about what you'd like to accomplish? For example:
- What type of content do you need?
- What are your specific requirements?
- Any preferred style or format?

I'm here to help make your ideas come to life!`
  }
}

export const assistantAgent = new AssistantAgent()
