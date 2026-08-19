import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm max-w-none text-slate-800 space-y-2 text-xs leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-sm font-extrabold text-slate-900 border-b border-purple-100 pb-1 mt-3 mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-blue-600 rounded-full inline-block"></span>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xs font-bold text-slate-850 border-b border-slate-100 pb-1 mt-2.5 mb-1 flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-purple-600 rounded-full inline-block"></span>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-xs font-bold text-slate-800 mt-2 mb-1 text-purple-900">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-[11px] font-bold text-slate-700 mt-1.5 mb-0.5 uppercase tracking-wide">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-1.5 text-slate-700 leading-relaxed text-xs">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="space-y-1 my-1.5 pl-2 list-none">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-4 space-y-1 my-1.5 text-slate-700">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-1.5 text-slate-700 text-xs">
              <span className="text-purple-600 font-bold text-sm leading-none select-none">•</span>
              <div className="flex-1 min-w-0">{children}</div>
            </li>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900 text-purple-950 bg-purple-50/50 px-1 py-0.2 rounded">
              {children}
            </strong>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-purple-400 pl-3 py-1 bg-purple-50/40 rounded-r-lg text-slate-600 italic my-2">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-2 rounded-xl border border-purple-100 shadow-xs">
              <table className="min-w-full divide-y divide-purple-100 text-[11px]">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-purple-50/80 text-slate-700 font-bold text-[10px] uppercase">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-purple-50 bg-white">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-purple-50/20 transition-colors">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-2.5 py-1.5 text-left font-bold text-slate-700">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 text-slate-650">
              {children}
            </td>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <div className="my-2 rounded-xl bg-slate-900 text-slate-100 p-3 overflow-x-auto font-mono text-[11px] border border-slate-800 shadow-inner">
                  <code>{children}</code>
                </div>
              );
            }
            return (
              <code className="bg-purple-100/60 text-purple-900 px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold">
                {children}
              </code>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer;
