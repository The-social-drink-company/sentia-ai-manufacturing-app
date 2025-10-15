import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { JSDOM } from 'jsdom';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Chunks the Xero Accounting API Node SDK HTML documentation into manageable markdown files
 */
class XeroDocsChunker {
  constructor() {
    this.inputFile = path.join(__dirname, '..', 'context', 'API-docs', 'Xero Accounting API Node SDK.html');
    this.outputDir = path.join(__dirname, '..', 'context', 'API-docs', 'xero-node-sdk-chunks');
    this.maxTokensPerChunk = 15000; // More conservative limit for Claude context
    this.chunks = [];
  }

  /**
   * Estimates token count (rough approximation: 1 token ≈ 4 characters)
   */
  estimateTokens(text) {
    return Math.ceil(text.length / 4);
  }

  /**
   * Converts HTML section to markdown
   */
  htmlToMarkdown(element) {
    let markdown = '';
    
    if (!element) return markdown;
    
    // Handle different element types
    switch (element.tagName?.toLowerCase()) {
      case 'h1':
        markdown += `# ${element.textContent}\n\n`;
        break;
      case 'h2':
        markdown += `## ${element.textContent}\n\n`;
        break;
      case 'h3':
        markdown += `### ${element.textContent}\n\n`;
        break;
      case 'h4':
        markdown += `#### ${element.textContent}\n\n`;
        break;
      case 'h5':
        markdown += `##### ${element.textContent}\n\n`;
        break;
      case 'h6':
        markdown += `###### ${element.textContent}\n\n`;
        break;
      case 'p':
        markdown += `${element.textContent}\n\n`;
        break;
      case 'pre':
        markdown += `\`\`\`\n${element.textContent}\n\`\`\`\n\n`;
        break;
      case 'code':
        if (element.parentElement?.tagName?.toLowerCase() !== 'pre') {
          markdown += `\`${element.textContent}\``;
        }
        break;
      case 'ul':
        element.querySelectorAll('li').forEach(li => {
          markdown += `- ${li.textContent}\n`;
        });
        markdown += '\n';
        break;
      case 'ol':
        element.querySelectorAll('li').forEach((li, index) => {
          markdown += `${index + 1}. ${li.textContent}\n`;
        });
        markdown += '\n';
        break;
      case 'table':
        markdown += this.tableToMarkdown(element);
        break;
      case 'a':
        const href = element.getAttribute('href');
        markdown += href ? `[${element.textContent}](${href})` : element.textContent;
        break;
      default:
        // For other elements, just get text content
        if (element.textContent?.trim()) {
          markdown += `${element.textContent}\n\n`;
        }
    }
    
    return markdown;
  }

  /**
   * Converts HTML table to markdown table
   */
  tableToMarkdown(table) {
    let markdown = '';
    const rows = table.querySelectorAll('tr');
    
    if (rows.length === 0) return markdown;
    
    // Header row
    const headerCells = rows[0].querySelectorAll('th, td');
    if (headerCells.length > 0) {
      markdown += '| ' + Array.from(headerCells).map(cell => cell.textContent.trim()).join(' | ') + ' |\n';
      markdown += '| ' + Array.from(headerCells).map(() => '---').join(' | ') + ' |\n';
    }
    
    // Data rows
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].querySelectorAll('td');
      if (cells.length > 0) {
        markdown += '| ' + Array.from(cells).map(cell => cell.textContent.trim()).join(' | ') + ' |\n';
      }
    }
    
    markdown += '\n';
    return markdown;
  }

  /**
   * Processes the HTML file and creates chunks
   */
  async processFile() {
    console.log('Reading HTML file...');
    
    if (!fs.existsSync(this.inputFile)) {
      throw new Error(`Input file not found: ${this.inputFile}`);
    }
    
    const htmlContent = fs.readFileSync(this.inputFile, 'utf-8');
    const dom = new JSDOM(htmlContent);
    const document = dom.window.document;
    
    // Create output directory
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    
    // Find main content sections
    const mainContent = document.querySelector('main') || document.querySelector('.content') || document.body;
    const sections = this.identifySections(mainContent);
    
    console.log(`Found ${sections.length} main sections`);
    
    // Process sections into chunks
    let currentChunk = {
      index: 1,
      title: 'Xero Node SDK Documentation - Part 1',
      content: '# Xero Accounting API Node SDK Documentation\n\n',
      tokens: this.estimateTokens('# Xero Accounting API Node SDK Documentation\n\n')
    };
    
    for (const section of sections) {
      const sectionMarkdown = this.processSection(section);
      const sectionTokens = this.estimateTokens(sectionMarkdown);
      
      // If section itself is too large, split it further
      if (sectionTokens > this.maxTokensPerChunk) {
        // Save current chunk if it has content
        if (currentChunk.content.length > 100) {
          this.saveChunk(currentChunk);
          this.chunks.push(currentChunk);
        }
        
        // Split large section into smaller chunks
        const subChunks = this.splitLargeSection(sectionMarkdown, section.title);
        for (const subChunk of subChunks) {
          this.chunks.push(subChunk);
          this.saveChunk(subChunk);
        }
        
        // Start new chunk
        currentChunk = {
          index: this.chunks.length + 1,
          title: `Xero Node SDK Documentation - Part ${this.chunks.length + 1}`,
          content: `# Xero Accounting API Node SDK Documentation - Part ${this.chunks.length + 1}\n\n`,
          tokens: this.estimateTokens(`# Xero Accounting API Node SDK Documentation - Part ${this.chunks.length + 1}\n\n`)
        };
      }
      // Check if adding this section would exceed token limit
      else if (currentChunk.tokens + sectionTokens > this.maxTokensPerChunk && currentChunk.content.length > 100) {
        // Save current chunk and start new one
        this.saveChunk(currentChunk);
        this.chunks.push(currentChunk);
        
        currentChunk = {
          index: this.chunks.length + 1,
          title: `Xero Node SDK Documentation - Part ${this.chunks.length + 1}`,
          content: `# Xero Accounting API Node SDK Documentation - Part ${this.chunks.length + 1}\n\n`,
          tokens: this.estimateTokens(`# Xero Accounting API Node SDK Documentation - Part ${this.chunks.length + 1}\n\n`)
        };
        
        currentChunk.content += sectionMarkdown;
        currentChunk.tokens += sectionTokens;
      } else {
        currentChunk.content += sectionMarkdown;
        currentChunk.tokens += sectionTokens;
      }
    }
    
    // Save final chunk
    if (currentChunk.content.length > 100) {
      this.saveChunk(currentChunk);
      this.chunks.push(currentChunk);
    }
    
    // Create index file
    this.createIndex();
    
    console.log(`Successfully created ${this.chunks.length} documentation chunks`);
    console.log(`Files saved to: ${this.outputDir}`);
  }

  /**
   * Identifies main sections in the document
   */
  identifySections(container) {
    const sections = [];
    
    // Look for major headings and their content
    const headings = container.querySelectorAll('h1, h2, h3');
    
    for (let i = 0; i < headings.length; i++) {
      const heading = headings[i];
      const nextHeading = headings[i + 1];
      
      // Collect all content between this heading and the next
      const sectionContent = [];
      let current = heading;
      
      while (current && current !== nextHeading) {
        sectionContent.push(current);
        current = current.nextElementSibling;
      }
      
      if (sectionContent.length > 0) {
        sections.push({
          title: heading.textContent.trim(),
          level: parseInt(heading.tagName.substring(1)),
          elements: sectionContent
        });
      }
    }
    
    return sections;
  }

  /**
   * Processes a section into markdown
   */
  processSection(section) {
    let markdown = '';
    
    for (const element of section.elements) {
      markdown += this.htmlToMarkdown(element);
    }
    
    return markdown;
  }

  /**
   * Splits a large section into smaller chunks
   */
  splitLargeSection(content, sectionTitle) {
    const subChunks = [];
    const lines = content.split('\n');
    let currentSubChunk = {
      index: this.chunks.length + subChunks.length + 1,
      title: `${sectionTitle} - Part ${subChunks.length + 1}`,
      content: `# ${sectionTitle} - Part ${subChunks.length + 1}\n\n`,
      tokens: 0
    };
    
    currentSubChunk.tokens = this.estimateTokens(currentSubChunk.content);
    
    for (const line of lines) {
      const lineTokens = this.estimateTokens(line + '\n');
      
      if (currentSubChunk.tokens + lineTokens > this.maxTokensPerChunk && currentSubChunk.content.length > 100) {
        subChunks.push(currentSubChunk);
        
        currentSubChunk = {
          index: this.chunks.length + subChunks.length + 1,
          title: `${sectionTitle} - Part ${subChunks.length + 1}`,
          content: `# ${sectionTitle} - Part ${subChunks.length + 1}\n\n`,
          tokens: 0
        };
        currentSubChunk.tokens = this.estimateTokens(currentSubChunk.content);
      }
      
      currentSubChunk.content += line + '\n';
      currentSubChunk.tokens += lineTokens;
    }
    
    if (currentSubChunk.content.length > 100) {
      subChunks.push(currentSubChunk);
    }
    
    return subChunks;
  }

  /**
   * Saves a chunk to file
   */
  saveChunk(chunk) {
    const filename = `xero-sdk-part-${chunk.index.toString().padStart(2, '0')}.md`;
    const filepath = path.join(this.outputDir, filename);
    
    const content = `${chunk.content}\n\n---\n\n*This is part ${chunk.index} of the Xero Accounting API Node SDK documentation. Estimated tokens: ~${chunk.tokens}*\n`;
    
    fs.writeFileSync(filepath, content, 'utf-8');
    console.log(`Saved chunk ${chunk.index}: ${filename} (~${chunk.tokens} tokens)`);
  }

  /**
   * Creates an index file listing all chunks
   */
  createIndex() {
    let indexContent = '# Xero Accounting API Node SDK Documentation Index\n\n';
    indexContent += 'This documentation has been split into multiple files for easier navigation:\n\n';
    
    for (const chunk of this.chunks) {
      const filename = `xero-sdk-part-${chunk.index.toString().padStart(2, '0')}.md`;
      indexContent += `- [Part ${chunk.index}](${filename}) - ${chunk.title} (~${chunk.tokens} tokens)\n`;
    }
    
    indexContent += '\n## About\n\n';
    indexContent += 'This documentation was automatically chunked from the official Xero Accounting API Node SDK documentation to fit within Claude context windows.\n\n';
    indexContent += `Generated on: ${new Date().toISOString()}\n`;
    indexContent += `Total chunks: ${this.chunks.length}\n`;
    indexContent += `Source: xero-node SDK documentation\n`;
    
    const indexPath = path.join(this.outputDir, 'README.md');
    fs.writeFileSync(indexPath, indexContent, 'utf-8');
    console.log(`Created index file: README.md`);
  }
}

// Run the chunker
async function main() {
  try {
    const chunker = new XeroDocsChunker();
    await chunker.processFile();
  } catch (error) {
    console.error('Error chunking documentation:', error);
    process.exit(1);
  }
}

// Run the chunker
main();