import Groq from "groq-sdk";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";

if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set in environment variables');
}

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

async function consumeStream(stream: AsyncIterable<any>) {
    let content = '';
    try {
        for await (const chunk of stream) {
            content += chunk.choices[0]?.delta?.content || '';
        }
    } catch (error) {
        console.error('Error consuming stream:', error);
        throw error; // Re-throw to be caught by the main try-catch
    }
    return content;
}

export async function POST(request: Request) {
    try {
        const { messages, type } = await request.json();

        if (!messages || (type === 'template' && !messages[0]?.content)) {
            return Response.json(
                { error: 'Invalid request format' },
                { status: 400 }
            );
        }

        if (type === "template") {
            try {
                // First, determine the stack
                const stackResponse = await groq.chat.completions.create({
                    messages: [{
                        role: "system",
                        content: "Analyze the prompt and return a stack. If a specific stack is mentioned, return that. If no stack is specified, return 'nextjs'. Return only the stack name in lowercase, no other text."
                    }, {
                        role: "user",
                        content: messages[0].content
                    }],
                    model: "mixtral-8x7b-32768",
                    temperature: 0,
                    max_tokens: 200,
                    stream: true
                });

                const stack = await consumeStream(stackResponse);
                if (!stack) {
                    throw new Error('Failed to determine stack');
                }

                // Then, generate the template based on the stack
                const templateResponse = await groq.chat.completions.create({
                    messages: [{
                        role: "system",
                        content: `Generate a project template for a ${stack} application. The response must be in XML format with file actions.`
                    }, {
                        role: "user",
                        content: messages[0].content
                    }],
                    model: "mixtral-8x7b-32768",
                    temperature: 0,
                    max_tokens: 8000,
                    stream: true
                });

                const generatedTemplate = await consumeStream(templateResponse);
                if (!generatedTemplate) {
                    throw new Error('Failed to generate template');
                }

                return Response.json({
                    prompts: [BASE_PROMPT],
                    uiPrompts: [generatedTemplate]
                });
            } catch (error) {
                console.error('Template generation error:', error);
                return Response.json(
                    { 
                        error: 'Template Generation Error', 
                        details: error instanceof Error ? error.message : 'Unknown error'
                    },
                    { status: 500 }
                );
            }
        }

        // Regular chat completion
        try {
            const chatCompletion = await groq.chat.completions.create({
                messages: [{
                    role: "system",
                    content: getSystemPrompt()
                }, ...messages.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content
                }))],
                model: "mixtral-8x7b-32768",
                temperature: 0,
                max_tokens: 8000,
                stream: true
            });

            const response = await consumeStream(chatCompletion);
            if (!response) {
                throw new Error('No response from Groq API');
            }

            return Response.json({ response });
        } catch (error) {
            console.error('Chat completion error:', error);
            return Response.json(
                { 
                    error: 'Chat Completion Error', 
                    details: error instanceof Error ? error.message : 'Unknown error'
                },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('API Error:', error);
        return Response.json(
            { 
                error: 'Internal Server Error', 
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}
