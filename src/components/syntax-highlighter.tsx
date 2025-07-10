"use client";

import React from "react";
import { Prism as SyntaxHighlighterLib } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

interface SyntaxHighlighterProps {
  code: string;
  language: string;
  highlightLines?: number[];
}

export const SyntaxHighlighter: React.FC<SyntaxHighlighterProps> = ({
  code,
  language,
  highlightLines = [],
}) => {
  // Map language to supported format
  const getLanguage = (lang: string): string => {
    const languageMap: Record<string, string> = {
      js: "javascript",
      ts: "typescript",
      py: "python",
      rb: "ruby",
      go: "go",
      java: "java",
      cs: "csharp",
      cpp: "cpp",
      c: "c",
      php: "php",
      rust: "rust",
      swift: "swift",
      kotlin: "kotlin",
    };
    
    return languageMap[lang.toLowerCase()] || lang.toLowerCase();
  };

  return (
    <SyntaxHighlighterLib
      language={getLanguage(language)}
      style={vscDarkPlus}
      wrapLines={highlightLines.length > 0}
      lineProps={(lineNumber) => ({
        style: {
          display: "block",
          backgroundColor: highlightLines.includes(lineNumber)
            ? "rgba(255, 0, 0, 0.2)"
            : undefined,
        },
      })}
      customStyle={{
        margin: 0,
        borderRadius: "0.375rem",
        fontSize: "0.875rem",
      }}
    >
      {code}
    </SyntaxHighlighterLib>
  );
}; 
 
 
 