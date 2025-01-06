import { Groq } from "groq-sdk";
import { TEMPLATE_FILES, BASE_PROMPT, getSystemPrompt } from "@/lib/templates";

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
        throw error;
    }
    return content.trim();
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
                // Log template request
                console.log('Template Request:', messages[0].content);

                const stackResponse = await groq.chat.completions.create({
                    messages: [{
                        role: "system",
                        content: "Analyze the prompt and determine the best stack. Options are: nextjs (default), react, or node. If a specific stack is mentioned, return that. If no stack is specified or if it's a website/webapp, return 'nextjs'. Return only the stack name in lowercase, no other text."
                    }, {
                        role: "user",
                        content: messages[0].content
                    }],
                    model: "mixtral-8x7b-32768",
                    temperature: 0,
                    max_tokens: 200,
                    stream: true
                });

                let stack = await consumeStream(stackResponse);
                console.log('Stack Determination:', stack); // Log determined stack

                // Normalize and validate stack
                stack = stack.toLowerCase().trim();
                
                // If stack is not one of the valid options, default to nextjs
                if (!TEMPLATE_FILES[stack as keyof typeof TEMPLATE_FILES]) {
                    console.log(`Invalid or unspecified stack "${stack}", defaulting to nextjs`);
                    stack = 'nextjs';
                }

                // Get template for determined stack
                const template = TEMPLATE_FILES[stack as keyof typeof TEMPLATE_FILES];

                // Return both the prompts and uiPrompts as expected by the client
                return Response.json({
                    prompts: [BASE_PROMPT],
                    uiPrompts: [template]
                });

            } catch (error) {
                console.error('Template generation error:', error);
                // Default to nextjs template in case of error
                return Response.json({
                    prompts: [BASE_PROMPT],
                    uiPrompts: [TEMPLATE_FILES.nextjs]
                });
            }
        }

        // Regular chat completion for implementation
        try {
            console.log('Implementation Request:', messages); // Log implementation request

            const chatCompletion = await groq.chat.completions.create({
                messages: [{
                    role: "system",
                    content: getSystemPrompt()
                }, ...messages.map((msg: any) => ({
                    role: msg.role || "user",
                    content: typeof msg === 'string' ? msg : msg.content
                }))],
                model: "mixtral-8x7b-32768",
                temperature: 0,
                max_tokens: 32768,
                stream: true
            });

            const response = await consumeStream(chatCompletion);
            console.log('Implementation Response:', response); // Log implementation response

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