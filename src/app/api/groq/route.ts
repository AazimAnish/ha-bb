import Groq from "groq-sdk";
import { BASE_PROMPT, getSystemPrompt } from "./prompts";

const groq = new Groq();

async function consumeStream(stream: AsyncIterable<any>) {
    let content = '';
    for await (const chunk of stream) {
        content += chunk.choices[0]?.delta?.content || '';
    }
    return content;
}

export async function POST(request: Request) {
    const { messages, type } = await request.json();

    if (type === "template") {
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

        // Then, generate the template based on the stack
        const templateResponse = await groq.chat.completions.create({
            messages: [{
                role: "system",
                content: `Generate a project template for a ${stack} application. The response must be in this exact format:
                '<boltArtifact id="project-import" title="Project Files"><boltAction type="file" filePath="...">[file content]</boltAction>...</boltArtifact>'
                
                Include essential files like package.json, configuration files, and basic source files. Format must match exactly.
                Do not include any explanation or additional text.`
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

        return Response.json({
            prompts: [BASE_PROMPT, `Here is an artifact that contains all files of the project visible to you.\nConsider the contents of ALL files in the project.\n\n${generatedTemplate}\n\nHere is a list of files that exist on the file system but are not being shown to you:\n\n  - .gitignore\n  - package-lock.json\n`],
            uiPrompts: [generatedTemplate]
        });
    }

    // Regular chat completion
    const chatCompletion = await groq.chat.completions.create({
        messages: [{
            role: "system",
            content: getSystemPrompt()
        }, ...messages],
        model: "mixtral-8x7b-32768",
        max_tokens: 8000,
        stream: true
    });

    const response = await consumeStream(chatCompletion);

    return Response.json({
        response
    });
}
