/**
 * Markdown Renderer Component
 * Renders markdown content with syntax highlighting
 */
import { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import DOMPurify from 'dompurify';
import marked from 'marked';
import Prism from 'prismjs';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-ruby';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-php';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-sql';

// Configure marked renderer
const renderer = new marked.Renderer();

// Override link renderer to open links in new tab
renderer.link = (href, title, text) => {
  const link = `<a href="${href}" target="_blank" rel="noopener noreferrer" ${title ? `title="${title}"` : ''}>${text}</a>`;
  return link;
};

// Configure marked options
marked.setOptions({
  renderer,
  highlight: (code, lang) => {
    if (Prism.languages[lang]) {
      return Prism.highlight(code, Prism.languages[lang], lang);
    }
    return code;
  },
  pedantic: false,
  gfm: true,
  breaks: true,
  sanitize: false,
  smartypants: true,
  xhtml: false,
});

/**
 * Markdown Renderer Component
 * @param {Object} props - Component props
 * @param {string} props.content - Markdown content to render
 */
const MarkdownRenderer = ({ content }) => {
  const containerRef = useRef(null);
  
  // Apply syntax highlighting after rendering
  useEffect(() => {
    if (containerRef.current) {
      Prism.highlightAllUnder(containerRef.current);
    }
  }, [content]);
  
  // Render markdown content
  const renderMarkdown = () => {
    if (!content) return '';
    
    // Convert markdown to HTML
    const rawHtml = marked(content);
    
    // Sanitize HTML to prevent XSS
    const sanitizedHtml = DOMPurify.sanitize(rawHtml, {
      ADD_ATTR: ['target'],
    });
    
    return sanitizedHtml;
  };
  
  return (
    <div
      ref={containerRef}
      className="markdown-renderer"
      dangerouslySetInnerHTML={{ __html: renderMarkdown() }}
    />
  );
};

MarkdownRenderer.propTypes = {
  content: PropTypes.string.isRequired,
};

export default MarkdownRenderer;

