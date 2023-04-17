import type { Output } from "$lib/components/CellOutput.svelte";

export function parsePythonError(output: string): string {
    const position = output.search('File "<exec>",');
    if (position < 0) return output;
    return output.slice(position);
}

const loadedKeyword = 'Loaded';

export function getLoadedLibraries(loadedMessage: string): string[] {
    if (!loadedMessage.startsWith(loadedKeyword)) return [];
    const librariesStr = loadedMessage.substring(loadedKeyword.length);
    const libraries = librariesStr.split(',').map(libraryStr => libraryStr.trim());
    return libraries
}

const chatModelNames = ["gpt-4", "gpt-3.5-turbo"]
export interface OpenaiModelInfo {
    id: string
}

export function getChatModels(modelInfoArr: OpenaiModelInfo[]): string[] {
    const chatModelInfoArr = modelInfoArr.filter(info => chatModelNames.includes(info.id))
    return chatModelInfoArr.map(modelInfo => modelInfo.id);
}

export interface ParsedContent {
    type: 'text' | 'python' | 'output'
    content: string
}

export function parseCodeAndTextContent(content: string): ParsedContent[] {
    const codeRegex = /```(python|output)([\s\S]*?)```/g;
    let match;
    let lastIndex = 0;
    const sections: ParsedContent[] = [];

    while ((match = codeRegex.exec(content)) !== null) {
        const textSection = content.slice(lastIndex, match.index).trim();
        if (textSection) {
            sections.push({ type: 'text', content: textSection });
        }
        const codeSection = match[2].trim();
        if (codeSection) {
            sections.push({ type: match[1] as ('python' | 'output'), content: codeSection });
        }
        lastIndex = codeRegex.lastIndex;
    }

    const finalTextSection = content.slice(lastIndex).trim();
    if (finalTextSection) {
        sections.push({ type: 'text', content: finalTextSection });
    }

    return sections;
}

export function combineCodeAndOutputToString(code: string, outputs: Output<unknown>[]): string {
    const outputCombined: string = outputs
        .filter(output => output.format === 'string')
        .map((output) => output.value).join('\n');
    return `\`\`\`python\n${code}\n\`\`\`\n\`\`\`output\n${outputCombined}\n\`\`\``
}