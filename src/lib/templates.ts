export const TEMPLATE_FILES = {
  nextjs: `<boltArtifact id="project-import" title="Next.js Project Files">
<boltAction type="file" filePath="package.json">
{
  "name": "next-app",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "14.1.0",
    "react": "^18",
    "react-dom": "^18",
    "@prisma/client": "^5.10.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "autoprefixer": "^10.0.1",
    "postcss": "^8",
    "tailwindcss": "^3.3.0",
    "eslint": "^8",
    "eslint-config-next": "14.1.0",
    "prisma": "^5.10.0"
  }
}
</boltAction>

<boltAction type="file" filePath="src/lib/utils.ts">
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
</boltAction>

<boltAction type="file" filePath="src/app/api/todos/route.ts">
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const TodoSchema = z.object({
  title: z.string().min(1),
  completed: z.boolean().default(false),
});

export async function GET() {
  try {
    const todos = await prisma.todo.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(todos);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch todos' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = TodoSchema.parse(json);

    const todo = await prisma.todo.create({
      data: body
    });

    return NextResponse.json(todo);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create todo' },
      { status: 500 }
    );
  }
}
</boltAction>

<boltAction type="file" filePath="prisma/schema.prisma">
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model Todo {
  id        String   @id @default(cuid())
  title     String
  completed Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
</boltAction>

<boltAction type="file" filePath="src/lib/prisma.ts">
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
</boltAction>
</boltArtifact>`,

  react: `<boltArtifact id="project-import" title="React Project Files">
        <boltAction type="file" filePath="package.json">
        {
          "name": "vite-react",
          "private": true,
          "version": "0.0.0",
          "type": "module",
          "scripts": {
            "dev": "vite",
            "build": "tsc && vite build",
            "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
            "preview": "vite preview"
          },
          "dependencies": {
            "react": "^18.2.0",
            "react-dom": "^18.2.0"
          },
          "devDependencies": {
            "@types/react": "^18.2.43",
            "@types/react-dom": "^18.2.17",
            "@typescript-eslint/eslint-plugin": "^6.14.0",
            "@typescript-eslint/parser": "^6.14.0",
            "@vitejs/plugin-react": "^4.2.1",
            "autoprefixer": "^10.4.16",
            "eslint": "^8.55.0",
            "eslint-plugin-react-hooks": "^4.6.0",
            "eslint-plugin-react-refresh": "^0.4.5",
            "postcss": "^8.4.32",
            "tailwindcss": "^3.4.0",
            "typescript": "^5.2.2",
            "vite": "^5.0.8"
          }
        }
        </boltAction>
        </boltArtifact>`,

  node: `<boltArtifact id="project-import" title="Node.js Project Files">
        <boltAction type="file" filePath="package.json">
        {
          "name": "node-starter",
          "version": "1.0.0",
          "private": true,
          "scripts": {
            "dev": "tsx watch src/index.ts",
            "build": "tsc",
            "start": "node dist/index.js"
          },
          "dependencies": {
            "express": "^4.18.2"
          },
          "devDependencies": {
            "@types/express": "^4.17.21",
            "@types/node": "^20.11.5",
            "tsx": "^4.7.0",
            "typescript": "^5.3.3"
          }
        }
        </boltAction>
        </boltArtifact>`,
};

export const BASE_PROMPT = `You are a Next.js 14 expert. Generate modern, production-ready Next.js applications using the App Router and React Server Components.

Always respond with XML tags in this format:
<boltArtifact id="implementation" title="Next.js Implementation">
  <boltAction type="file" filePath="path/to/file">
    // File contents here...
  </boltAction>
</boltArtifact>

Guidelines for Next.js applications:
- Use the App Router and React Server Components
- Implement proper data fetching patterns
- Use TypeScript for type safety
- Follow Next.js best practices
- Include proper error handling
- Add loading states and error boundaries
- Use Tailwind CSS for styling
- Keep components modular and reusable
- Add proper comments for complex logic`;

export function getSystemPrompt() {
    return `You are a Next.js 14 expert. Generate code that follows these principles:
    1. Use App Router and React Server Components by default
    2. Implement proper data fetching and mutations
    3. Use TypeScript for type safety
    4. Follow Next.js best practices and conventions
    5. Include error handling and loading states
    6. Use Tailwind CSS for styling
    7. Keep code modular and maintainable
    8. Add proper comments for complex logic
    
    When generating files:
    - Place components in src/components
    - Place API routes in src/app/api
    - Place utilities in src/lib
    - Place types in src/types
    - Use proper file naming conventions
    
    Always wrap file contents in <boltAction type="file" filePath="path/to/file"> tags.`;
}
