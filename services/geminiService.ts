import { GoogleGenAI, Modality, Type } from "@google/genai";
import { AppMode, StudyFile, ExplanationStyle, CodingChallenge, GraphData, ProgrammingLanguage, ScanResult, CompletionResult, ExecutionMode } from "../types";

// Initialize the client
const getClient = () => {
  const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env.local file.');
  }
  return new GoogleGenAI({ apiKey });
};

// Helper function to handle rate limiting with retry
const withRetry = async <T>(fn: () => Promise<T>, maxRetries = 3, delayMs = 2000): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const isRateLimit = error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('quota');
      
      if (isRateLimit && attempt < maxRetries) {
        console.warn(`Rate limited. Retrying in ${delayMs * attempt}ms... (attempt ${attempt}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delayMs * attempt));
        continue;
      }
      
      if (isRateLimit) {
        throw new Error('API rate limit exceeded. Please wait a moment and try again.');
      }
      
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
};

const getStyleInstruction = (style: ExplanationStyle): string => {
  switch (style) {
    case ExplanationStyle.DEBUG:
      return "You are a Senior Debugger. Analyze the code strictly for syntax errors, logical bugs, and edge cases. Be concise and point out lines.";
    case ExplanationStyle.CODE_WALKTHROUGH:
      return "Explain the code logic step-by-step. Focus on control flow and data structures used. Do not read the syntax characters aloud, explain the intent.";
    case ExplanationStyle.OPTIMIZATION:
      return "Focus purely on Big O notation. Analyze Time and Space complexity. Suggest optimizations to reduce complexity.";
    case ExplanationStyle.SOCRATIC:
      return "Do not give the code solution. Ask leading questions about the algorithm to help the user derive the solution.";
    case ExplanationStyle.ELI5:
      return "Explain the algorithm using real-world analogies (e.g., explain Arrays like a row of mailboxes).";
    default:
      return "You are a Senior Tech Lead tutoring a junior developer.";
  }
};

export const generateDevResponse = async (
  prompt: string,
  mode: AppMode,
  style: ExplanationStyle,
  currentCode: string,
  language: ProgrammingLanguage,
  contextFiles: StudyFile[],
  chatHistory: Array<{ role: string; text: string }> = [],
  allEditorFiles: StudyFile[] = []
) => {
  const ai = getClient();
  
  let systemInstruction = `You are TILA, an AI Coding Tutor and mentor. You help developers learn programming in a natural, conversational way.

CRITICAL RULES (ALWAYS FOLLOW THESE):
- If user asks for code, ALWAYS provide the code immediately - NO EXCEPTIONS
- If user asks for explanation, explain directly without asking questions
- If user asks for help, provide the solution directly
- Respond directly and provide what is asked - NO clarifying questions
- Keep responses concise and helpful
- Remember previous context from the conversation
- Build on what was discussed before
- Use markdown for clarity when needed
- When providing code, wrap it in proper markdown code blocks with language specified
- DO NOT ask "do you prefer", "have you already", "would you like" - just provide the answer
- DO NOT use Socratic method when user explicitly asks for code or solution`;
  
  // Only add style instruction if it's not Socratic, or if user is asking for code
  if (style !== ExplanationStyle.SOCRATIC || prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('solution')) {
    if (style === ExplanationStyle.SOCRATIC && (prompt.toLowerCase().includes('code') || prompt.toLowerCase().includes('solution'))) {
      // Override Socratic with direct code provision
      systemInstruction += " Provide the code directly without asking questions.";
    } else {
      systemInstruction += " " + getStyleInstruction(style);
    }
  } else {
    systemInstruction += " " + getStyleInstruction(style);
  }
  
  // Build conversation history context
  let conversationContext = '';
  if (chatHistory && chatHistory.length > 0) {
    // Include last 5 messages for context (to avoid token limits)
    const recentHistory = chatHistory.slice(-5);
    conversationContext = '\n\nPrevious conversation:\n';
    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? 'User' : 'Assistant';
      conversationContext += `${role}: ${msg.text}\n`;
    });
  }
  
  // Build editor files context
  let editorFilesContext = '';
  if (allEditorFiles && allEditorFiles.length > 0) {
    editorFilesContext = '\n\n[EDITOR FILES AVAILABLE]:\n';
    allEditorFiles.forEach(file => {
      editorFilesContext += `- ${file.name} (${file.type}): ${file.content.substring(0, 200)}...\n`;
    });
  }
  
  // Context injection
  let finalPrompt = prompt + conversationContext + editorFilesContext;
  
  if (currentCode) {
      finalPrompt += `\n\n[CURRENT CODE (${language})]:\n${currentCode}`;
  }

  if (mode === AppMode.SYLLABUS && contextFiles.length > 0) {
      const contextText = contextFiles.map(f => `[DOC: ${f.name}]\n${f.content}`).join('\n\n').substring(0, 20000);
      systemInstruction += " Base your explanations on the provided technical documentation/syllabus.";
      finalPrompt = `CONTEXT:\n${contextText}\n\nPrevious conversation:${conversationContext}\n\nUSER QUERY: ${prompt}`;
  }

  try {
    const response = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ parts: [{ text: finalPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
      },
    }));

    const candidate = response.candidates?.[0];
    const textPart = candidate?.content?.parts?.find(p => p.text)?.text || "I apologize, I couldn't generate a response. Please try again.";

    return {
      text: textPart,
      audioData: null
    };

  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};

export interface TestCase {
    input: string;
    expectedOutput: string;
}

export interface CodeExecutionResult {
    output: string;
    isCorrect: boolean;
    timeComplexity: string;
    spaceComplexity: string;
    expectedTimeComplexity?: string;
    expectedSpaceComplexity?: string;
    testResults?: { input: string; expected: string; actual: string; passed: boolean }[];
}

export const runCodeSimulation = async (
    code: string, 
    language: string, 
    mode: ExecutionMode = ExecutionMode.SCRIPT,
    testCases?: TestCase[]
): Promise<string> => {
    const ai = getClient();
    
    let prompt = "";
    
    if (testCases && testCases.length > 0) {
        // Run with test cases - clean, simple format
        const testCaseStr = testCases.map((tc, i) => 
            `Test ${i + 1}: Input: ${tc.input}, Expected: ${tc.expectedOutput}`
        ).join('\n');
        
        prompt = `Act as a ${language} compiler. Execute this code with the test cases.

TEST CASES:
${testCaseStr}

CRITICAL: Respond ONLY with test results. NO code, NO analysis, NO explanations, NO extra text.

FORMAT (EXACTLY):
🧪 TEST RESULTS
${testCases.map((_, i) => `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test ${i + 1}: ✅ PASS or ❌ FAIL
Input    → [value]
Expected → [value]  
Actual   → [value]`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: ✅ ALL PASSED or ❌ X/Y FAILED
Time Complexity: O(?)
Space Complexity: O(?)

CODE TO EXECUTE (${language}):
${code}`;
    } else if (mode === ExecutionMode.FUNCTION) {
        prompt = `Act as a ${language} compiler. Execute this function with sample inputs.

Create 3 test cases and run them. CRITICAL: Respond ONLY with results. NO code, NO analysis, NO explanations.

FORMAT (EXACTLY):
🧪 TEST RESULTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 1: ✅ PASS or ❌ FAIL
Input  → [value]
Output → [value]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 2: ✅ PASS or ❌ FAIL
Input  → [value]
Output → [value]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Test 3: ✅ PASS or ❌ FAIL
Input  → [value]
Output → [value]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: ✅ Code works correctly or ❌ Has errors
Time Complexity: O(?)
Space Complexity: O(?)

CODE TO EXECUTE (${language}):
${code}`;
    } else {
        prompt = `Act as a ${language} compiler. Execute this code and show the output.
If there are errors, show them clearly. CRITICAL: NO code, NO analysis, NO explanations.

FORMAT (EXACTLY):
📤 OUTPUT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[actual program output here]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Result: ✅ Success or ❌ Error: [brief description]
Time Complexity: O(?)
Space Complexity: O(?)

CODE TO EXECUTE (${language}):
${code}`;
    }

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });

    return response.text || "No output generated.";
};

export const generateCodingChallenges = async (topic: string, contextFiles: StudyFile[]): Promise<CodingChallenge[]> => {
    const ai = getClient();
    let contextText = "";
    
    if (contextFiles.length > 0) {
        contextText = contextFiles.map(f => f.content).join('\n').substring(0, 10000);
    }
    
    const prompt = `Generate 3 coding challenges related to: ${topic} ${contextText ? 'based on the provided context.' : ''}.
    ${contextText ? `Context: ${contextText}` : ''}
    
    Return a JSON array with exactly 3 challenges. Each challenge must have:
    - id: unique string identifier
    - title: challenge name
    - difficulty: one of "Easy", "Medium", or "Hard"
    - description: detailed problem description
    - starterCode: initial code template
    - testCases: array of test case descriptions
    
    Example format:
    [
      {
        "id": "1",
        "title": "Two Sum",
        "difficulty": "Easy",
        "description": "Given an array of integers, return indices of two numbers that add up to a target.",
        "starterCode": "def twoSum(nums, target):\\n    pass",
        "testCases": ["Input: [2,7,11,15], target=9, Output: [0,1]"]
      }
    ]`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        const parsed = JSON.parse(response.text || '[]');
        return parsed.map((c: any, idx: number) => ({
            id: c.id || `challenge-${Date.now()}-${idx}`,
            title: c.title || `Challenge ${idx + 1}`,
            difficulty: c.difficulty || 'Medium',
            description: c.description || 'No description provided',
            starterCode: c.starterCode || '// Write your solution here',
            testCases: c.testCases || []
        })) as CodingChallenge[];
    } catch (e) {
        console.error('Challenge generation error:', e);
        // Return fallback challenges
        return [
            {
                id: `fallback-${Date.now()}-1`,
                title: `${topic} - Basic Problem`,
                difficulty: 'Easy',
                description: `Solve a basic problem related to ${topic}. Implement the solution step by step.`,
                starterCode: '// Write your solution here\n\nfunction solve() {\n    // Your code\n}',
                testCases: ['Test your solution with different inputs']
            },
            {
                id: `fallback-${Date.now()}-2`,
                title: `${topic} - Intermediate Challenge`,
                difficulty: 'Medium',
                description: `An intermediate level challenge for ${topic}. Consider edge cases and optimize your solution.`,
                starterCode: '// Write your solution here\n\nfunction solve() {\n    // Your code\n}',
                testCases: ['Test with edge cases']
            },
            {
                id: `fallback-${Date.now()}-3`,
                title: `${topic} - Advanced Problem`,
                difficulty: 'Hard',
                description: `An advanced problem for ${topic}. Focus on optimal time and space complexity.`,
                starterCode: '// Write your solution here\n\nfunction solve() {\n    // Your code\n}',
                testCases: ['Test with large inputs']
            }
        ];
    }
};

export const generateRoadmapData = async (contextFiles: StudyFile[], topic?: string): Promise<GraphData> => {
    const ai = getClient();
    
    let promptContext = "";
    if (contextFiles.length > 0) {
        promptContext = contextFiles.map(f => f.content).join('\n').substring(0, 15000);
    } else if (topic) {
        promptContext = topic;
    } else {
        return { nodes: [], links: [] };
    }

    const prompt = `You are a programming and computer science education expert. Create a technical learning roadmap for: "${promptContext}"

    IMPORTANT: This is for a CODING/PROGRAMMING learning platform. Interpret the topic in a SOFTWARE ENGINEERING context:
    - "Trees" = Data Structures (Binary Trees, BST, AVL, Red-Black Trees, Tries, etc.)
    - "Graphs" = Graph Data Structures & Algorithms (BFS, DFS, Dijkstra, etc.)
    - "Arrays" = Array Data Structure & Algorithms (Sorting, Searching, Two Pointers, etc.)
    - "Strings" = String Manipulation & Algorithms (Pattern Matching, KMP, etc.)
    - "Dynamic Programming" = DP Techniques & Patterns
    - "System Design" = Software Architecture & Scalability
    - Any topic should be interpreted as its PROGRAMMING/DSA equivalent
    
    Generate a structured learning path with 6-10 nodes representing key programming concepts, algorithms, or techniques.
    
    CRITICAL: You MUST return a valid JSON object with this EXACT structure:
    {
      "nodes": [
        {"id": "1", "label": "Introduction to [Topic] in Programming", "type": "core", "status": "unlocked"},
        {"id": "2", "label": "Basic Operations & Implementation", "type": "concept", "status": "locked"},
        {"id": "3", "label": "Common Algorithms", "type": "concept", "status": "locked"},
        {"id": "4", "label": "Advanced Techniques", "type": "detail", "status": "locked"}
      ],
      "links": [
        {"source": "1", "target": "2"},
        {"source": "2", "target": "3"}
      ]
    }
    
    Rules:
    - Focus ONLY on programming, coding, DSA, or software engineering aspects
    - nodes: array with id (string), label (string - technical programming term), type ("core"|"concept"|"detail"), status ("unlocked"|"locked")
    - links: array with source and target matching node ids
    - Labels should be specific programming/DSA terms (e.g., "Binary Search Tree Operations", "Tree Traversal Algorithms", "Balanced Trees - AVL & Red-Black")
    - Return ONLY the JSON object
    - NO markdown, NO explanations`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        let responseText = response.text || '{"nodes": [], "links": []}';
        
        // Aggressive cleanup - remove all markdown formatting
        responseText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```javascript\n?/g, '')
            .replace(/```\n?/g, '')
            .replace(/^[\s\n]+|[\s\n]+$/g, '')
            .trim();
        
        // Try to extract JSON if it's embedded in text
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            responseText = jsonMatch[0];
        }
        
        console.log('Parsing roadmap response:', responseText);
        
        let data = JSON.parse(responseText);
        
        // Handle case where nodes might be a string (AI error)
        if (typeof data.nodes === 'string') {
            console.warn('Nodes returned as string, attempting to parse...');
            try {
                data.nodes = JSON.parse(data.nodes);
            } catch (e) {
                console.error('Failed to parse nodes string:', data.nodes);
                throw new Error('Invalid nodes format - received string instead of array');
            }
        }
        
        // Validate and ensure proper structure
        if (!data.nodes || !Array.isArray(data.nodes)) {
            console.error('Invalid nodes structure:', data);
            throw new Error('Invalid nodes structure');
        }
        
        // Ensure all nodes have required properties
        data.nodes = data.nodes.map((node: any, index: number) => ({
            id: String(node.id || index + 1),
            label: String(node.label || `Node ${index + 1}`),
            type: String(node.type || 'concept'),
            status: index === 0 ? 'unlocked' : String(node.status || 'locked')
        }));
        
        // Ensure links is an array with valid structure
        if (!data.links || !Array.isArray(data.links)) {
            data.links = [];
        }
        
        data.links = data.links.map((link: any) => ({
            source: String(link.source),
            target: String(link.target)
        }));
        
        console.log('Successfully parsed roadmap:', data);
        
        return data as GraphData;
    } catch (e) {
        console.error('Roadmap generation error:', e);
        // Return fallback roadmap
        const topicName = topic || 'Programming';
        return {
            nodes: [
                { id: '1', label: `${topicName} Basics`, type: 'core', status: 'unlocked' },
                { id: '2', label: `${topicName} Fundamentals`, type: 'concept', status: 'locked' },
                { id: '3', label: `Intermediate ${topicName}`, type: 'concept', status: 'locked' },
                { id: '4', label: `Advanced ${topicName}`, type: 'detail', status: 'locked' },
                { id: '5', label: `${topicName} Best Practices`, type: 'detail', status: 'locked' }
            ],
            links: [
                { source: '1', target: '2' },
                { source: '2', target: '3' },
                { source: '3', target: '4' },
                { source: '4', target: '5' }
            ]
        };
    }
};

export const generateTextOnly = async (prompt: string, contextFiles: StudyFile[]) => {
    const ai = getClient();
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: `Summarize this coding concept: ${prompt}`
    });
    return response.text;
};

// --- NEW FUTURISTIC FEATURES ---

export const generateSyllabusContent = async (topic: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Create a detailed study syllabus/documentation for the topic: "${topic}". 
    Include Key Concepts, Code Examples, and Common Pitfalls. 
    Format as Markdown.`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });
    return response.text || "Failed to generate syllabus.";
};

export const optimizeCode = async (code: string, language: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are a Code Optimization Engine.
Analyze and optimize the following ${language} code.

RULES:
1. Return ONLY the optimized code - no explanations outside comments
2. Add a brief comment at the top showing: Original O(?) → Optimized O(?)
3. Keep the same function/variable names
4. Add inline comments ONLY where you made significant changes
5. Do NOT add verbose explanations or markdown

CODE:
${code}

Return the optimized code only:`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });
    
    let result = response.text || code;
    // Remove markdown code blocks if present
    result = result.replace(/```[\w]*\n?/g, '').replace(/```$/g, '').trim();
    
    return result;
};

export const deepScanCode = async (code: string, language: string): Promise<ScanResult> => {
    const ai = getClient();
    const prompt = `You are an Expert Code Reviewer. Analyze this ${language} code thoroughly and generate a detailed analysis report.

CRITICAL: Return ONLY the analysis in this EXACT format (no markdown code blocks, no extra text):

═══════════════════════════════════════════════════════════════════════════════
CODE ANALYSIS REPORT
═══════════════════════════════════════════════════════════════════════════════

Overall Quality Score: [0-100]
Status: [✅ Good | ⚠️ Needs Improvement | ❌ Has Issues]

═══════════════════════════════════════════════════════════════════════════════
LOGICAL ISSUES FOUND
═══════════════════════════════════════════════════════════════════════════════

[If no logical issues, write: "✅ No logical issues detected"]

[If issues exist, list each one:]
Issue #1: [Issue Name]
- Line(s): [line numbers]
- Problem: [Detailed explanation of the logical issue]
- Impact: [How this affects the code]
- Suggested Fix: [Specific code change to fix it]

[Repeat for each issue]

═══════════════════════════════════════════════════════════════════════════════
MISSING BASE CASES & EDGE CASES
═══════════════════════════════════════════════════════════════════════════════

[If all base cases are handled, write: "✅ All base cases are properly handled"]

[If missing, list each one:]
Base Case #1: [Case Name]
- Description: [What this case is]
- Current Handling: [How it's currently handled or "Not handled"]
- Suggested Fix: [Code to add]

[Repeat for each missing case]

═══════════════════════════════════════════════════════════════════════════════
CODE SIMPLIFICATIONS & IMPROVEMENTS
═══════════════════════════════════════════════════════════════════════════════

Simplification #1: [Line or Section]
- Current Code: [Show the complex line(s)]
- Simplified Version: [Show the simpler version]
- Benefit: [Why this is better]

[Repeat for each simplification opportunity]

═══════════════════════════════════════════════════════════════════════════════
POTENTIAL RUNTIME ERRORS
═══════════════════════════════════════════════════════════════════════════════

[If no potential errors, write: "✅ No obvious runtime errors detected"]

[If errors possible, list each one:]
Error #1: [Error Type]
- Scenario: [When this error could occur]
- Prevention: [How to prevent it]

[Repeat for each potential error]

═══════════════════════════════════════════════════════════════════════════════
PERFORMANCE CONSIDERATIONS
═══════════════════════════════════════════════════════════════════════════════

- [Performance consideration 1]
- [Performance consideration 2]
- [Performance consideration 3]

═══════════════════════════════════════════════════════════════════════════════
SUMMARY & RECOMMENDATIONS
═══════════════════════════════════════════════════════════════════════════════

[2-3 sentence summary of the code quality]

Priority Fixes:
1. [Most important fix]
2. [Second priority]
3. [Third priority]

═══════════════════════════════════════════════════════════════════════════════

CODE TO ANALYZE (${language}):
${code}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });

    try {
        // Return the full analysis text in the summary field
        const analysisText = response.text || "Analysis failed. Please try again.";
        
        return { 
            score: 75, 
            summary: analysisText,
            issues: [] 
        };
    } catch (e) {
        return { score: 0, summary: "Analysis Failed", issues: [] };
    }
};

export const generateDocumentation = async (code: string, language: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are a Technical Documentation Expert. Generate comprehensive structured documentation for the following ${language} code.

CRITICAL: Return ONLY the documentation in this EXACT format (no markdown code blocks, no extra text):

═══════════════════════════════════════════════════════════════════════════════
ALGORITHM EXPLANATION
═══════════════════════════════════════════════════════════════════════════════

[Detailed explanation of the algorithm/approach in 3-5 sentences]

Key Steps:
1. [Step 1]
2. [Step 2]
3. [Step 3]
[Add more steps as needed]

═══════════════════════════════════════════════════════════════════════════════
CODE IMPLEMENTATION
═══════════════════════════════════════════════════════════════════════════════

${code}

═══════════════════════════════════════════════════════════════════════════════
COMPLEXITY ANALYSIS
═══════════════════════════════════════════════════════════════════════════════

Time Complexity: O(?)
- [Explanation of time complexity]

Space Complexity: O(?)
- [Explanation of space complexity]

═══════════════════════════════════════════════════════════════════════════════
USAGE EXAMPLES
═══════════════════════════════════════════════════════════════════════════════

Example 1:
Input: [example input]
Output: [example output]

Example 2:
Input: [example input]
Output: [example output]

═══════════════════════════════════════════════════════════════════════════════
EDGE CASES & CONSIDERATIONS
═══════════════════════════════════════════════════════════════════════════════

- [Edge case 1]
- [Edge case 2]
- [Important consideration]

═══════════════════════════════════════════════════════════════════════════════

CODE TO DOCUMENT (${language}):
${code}`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });
    return response.text || code;
};

export const generateUnitTests = async (code: string, language: string): Promise<string> => {
    const ai = getClient();
    const prompt = `Create simple test cases for this ${language} code.

Make the tests:
1. Easy to understand
2. Cover normal usage (happy path)
3. Test edge cases (empty inputs, null values, etc.)
4. Use standard testing frameworks

Add comments explaining what each test does.

CODE:
${code}

Return clean test code without markdown formatting.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt
    });
    return response.text || "";
};

export const completeCode = async (code: string, language: string): Promise<CompletionResult> => {
    const ai = getClient();
    const prompt = `You are an intelligent code auto-completion engine.
    Review the following ${language} code.
    1. If it is incomplete, finish the logic.
    2. If it has errors, fix them.
    3. STRICTLY maintain the user's coding style, variable naming, and indentation.
    4. Provide a brief explanation of what you changed or added.

    Return JSON format ONLY.
    Structure: { "fixedCode": "string", "explanation": "string" }

    CODE:
    ${code}`;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    fixedCode: { type: Type.STRING },
                    explanation: { type: Type.STRING }
                }
            }
        }
    });

    try {
        return JSON.parse(response.text || '{"fixedCode": "", "explanation": "Failed to parse"}') as CompletionResult;
    } catch (e) {
        return { fixedCode: code, explanation: "AI Error" };
    }
};

export const convertCodeLanguage = async (code: string, fromLang: string, toLang: string): Promise<string> => {
    const ai = getClient();
    const prompt = `You are a code translator. Convert the following ${fromLang} code to ${toLang}.
    
CRITICAL RULES:
1. Maintain the EXACT same logic and algorithm
2. Use idiomatic ${toLang} syntax and conventions
3. Keep the same variable names where possible
4. Add brief comments explaining ${toLang}-specific features
5. Return ONLY the converted code, no explanations

${fromLang} CODE:
${code}

Convert to ${toLang}:`;

    try {
        const response = await withRetry(() => ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt
        }));

        let convertedCode = response.text || code;
        
        // Remove markdown code blocks if present
        convertedCode = convertedCode.replace(/```[\w]*\n/g, '').replace(/```$/g, '').trim();
        
        // If response is empty or just whitespace, return original code
        if (!convertedCode || convertedCode.length < 10) {
            console.warn('Conversion returned empty or too short response, returning original code');
            return code;
        }
        
        return convertedCode;
    } catch (error) {
        console.error('Code conversion failed:', error);
        // Return original code if conversion fails
        return code;
    }
};

// Validate challenge solution
export const validateChallengeSolution = async (
    challenge: CodingChallenge,
    userCode: string,
    language: string,
    executionOutput: string
): Promise<{ isCorrect: boolean; feedback: string }> => {
    const ai = getClient();
    
    const prompt = `You are an expert code reviewer evaluating a coding challenge solution.

Challenge: ${challenge.title}
Difficulty: ${challenge.difficulty}
Description: ${challenge.description}

Test Cases:
${challenge.testCases.map((tc, i) => `${i + 1}. ${tc}`).join('\n')}

User's Code (${language}):
\`\`\`${language}
${userCode}
\`\`\`

Execution Output:
${executionOutput}

STRICT EVALUATION: Only mark as correct if ALL of the following are true:
1. The code logic correctly implements the algorithm described in the challenge
2. ALL test cases pass with correct output
3. There are NO errors or exceptions in the execution
4. Edge cases are properly handled
5. The output format matches exactly what was expected

Be VERY strict. Only return isCorrect: true if the solution is COMPLETELY correct.

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "isCorrect": boolean,
  "feedback": "Brief feedback about the solution (1-2 sentences)"
}`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.0-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });

        let responseText = response.text || '{"isCorrect": false, "feedback": "Unable to evaluate"}';
        
        // Clean up markdown if present
        responseText = responseText
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
        
        const result = JSON.parse(responseText);
        return {
            isCorrect: result.isCorrect === true,
            feedback: result.feedback || 'Solution evaluated'
        };
    } catch (error) {
        console.error('Challenge validation error:', error);
        return {
            isCorrect: false,
            feedback: 'Unable to validate solution. Please try again.'
        };
    }
};

// Simple wrapper for integrated app
export const geminiService = {
  async sendMessage(message: string, history: any[] = []) {
    const ai = getClient();
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: message
    });
    return response.text || "No response generated.";
  },

  async transcribeAudio(audioBlob: Blob) {
    // Audio transcription would require additional setup
    // For now, return a placeholder
    return "Audio transcription not yet implemented";
  }
};
