import Groq from "groq-sdk";
import { getSystemPrompt } from "./prompts";
import { getTemplatePrompt, getBasePrompt } from "../templates/route";

const groq = new Groq();

export async function POST(request: Request) {
    const { messages, type } = await request.json();

    if (type === "template") {
        const templateResponse = await groq.chat.completions.create({
            messages: [{
                role: "system",
                content: "You are a project stack analyzer. Analyze the requirements and return a JSON response with a 'stack' field that contains either 'node' or 'react'. Example: {\"stack\": \"react\"}"
            }, {
                role: "user",
                content: messages[0].content
            }],
            model: "mixtral-8x7b-32768",
            temperature: 0,
            max_tokens: 200,
            stream: false,
            response_format: { type: "json_object" }
        });

        const stack = templateResponse.choices[0]?.message?.content || '';
        const stackType = JSON.parse(stack).stack || 'react'; // Default to react if parsing fails
        
        return Response.json({
            prompts: [getTemplatePrompt(stackType)],
            uiPrompts: [getBasePrompt(stackType)]
        });
    }

    // Regular chat completion
    const chatCompletion = await groq.chat.completions.create({
        messages: [{
            role: "system",
            content: getSystemPrompt()
        }, ...messages],
        model: "mixtral-8x7b-32768",
        temperature: 0,
        max_tokens: 1024,
        top_p: 1,
        stream: true,
        stop: null
    });

    const responseStream = new ReadableStream({
        async start(controller) {
            for await (const chunk of chatCompletion) {
                const content = chunk.choices[0]?.delta?.content || '';
                controller.enqueue(content);
            }
            controller.close();
        },
    });

    return new Response(responseStream, {
        headers: { "Content-Type": "text/plain" },
    });
}
