import { PriceComparisonItem } from '../types';

function renderWithBoldAndLinks(text: string): string {
    if (!text) return '';

    // HTML linklerini parse et
    const linkRegex = /<a href="([^"]+)">([^<]+)<\/a>/g;
    let processedText = text.replace(linkRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$2</a>');

    // Bold text
    const boldRegex = /\*\*(.*?)\*\*/g;
    processedText = processedText.replace(boldRegex, '<strong>$1</strong>');

    return processedText;
}

function generatePriceTableHtml(data: PriceComparisonItem[], location: string): string {
    if (!data || data.length === 0) return '';
    const header = `<thead><tr><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Service</th><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Typical Price (Turkey)</th><th style="border: 1px solid #ddd; padding: 12px; text-align: left; background-color: #f7fafc;">Typical Price (${location})</th></tr></thead>`;
    const body = data.map(item => `<tr><td style="border: 1px solid #ddd; padding: 12px;">${item.service}</td><td style="border: 1px solid #ddd; padding: 12px;">${item.turkeyPrice}</td><td style="border: 1px solid #ddd; padding: 12px;">${item.locationPrice}</td></tr>`).join('');
    return `<table style="width: 100%; border-collapse: collapse; font-family: sans-serif; margin-top: 1.5em; margin-bottom: 1.5em;">${header}<tbody>${body}</tbody></table>`;
};

const parseTableRow = (line: string): string[] => {
    const cells = line.trim().replace(/^|\s*$/g, '').split('|').map(cell => cell.trim());
    return cells.filter(cell => cell !== '');
};

const isTableRow = (line: string): boolean => {
    const trimmed = line.trim();
    return trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.split('|').length > 2;
};

const isTableSeparator = (line: string): boolean => {
    const trimmed = line.trim();
    if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return false;
    const cells = trimmed.split('|').slice(1, -1);
    return cells.length > 0 && cells.every(cell => {
        const cellTrimmed = cell.trim();
        return cellTrimmed.length > 0 && /^-+$/.test(cellTrimmed);
    });
};

const renderMarkdownTable = (headers: string[], rows: string[][]): string => {
    const headerHtml = `<thead><tr>${headers.map(header => `<th scope="col" style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">${renderWithBoldAndLinks(header)}</th>`).join('')}</tr></thead>`;
    const bodyHtml = `<tbody>${rows.map(row => `<tr>${row.map(cell => `<td style="padding: 12px; border-top: 1px solid #e2e8f0;">${renderWithBoldAndLinks(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    return `<table style="width: 100%; border-collapse: collapse; margin-top: 1.5rem; margin-bottom: 1.5rem;">${headerHtml}${bodyHtml}</table>`;
};

// Normalize inline numbered lists like:
// "1. First item. 2. Second item." =>
// "1. First item.\n2. Second item."
function enforceNumberedListLineBreaks(text: string): string {
    if (!text) return text;
    return text
        .split('\n')
        .map(line => {
            const hasFirst = /(\b|^)1[\.)]\s+/.test(line);
            const hasNext = /\s+(?:2|3|4|5|6|7|8|9|10)[\.)]\s+/.test(line);
            if (!hasFirst || !hasNext) return line;
            return line.replace(/\s+((?:[2-9]|[1-9]\d)[\.)])\s+/g, '\n$1 ');
        })
        .join('\n');
}

export function convertMarkdownToHtml(
    content: string,
    priceComparison?: PriceComparisonItem[],
    location?: string
): string {
    if (!content || typeof content !== 'string') return '';

    // Ensure inline enumerations are on separate lines for proper list rendering
    content = enforceNumberedListLineBreaks(content);

    const lines = content.split('\n');
    let html = '';
    let inList = false;
    let listItems = '';
    let inOrderedList = false;
    let orderedListItems = '';
    let paragraphBuffer: string[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];
    let inFaqSection = false;
    let currentFaq: { question: string; answer: string[] } | null = null;

    const flushParagraph = () => {
        if (paragraphBuffer.length > 0) {
            html += `<p>${renderWithBoldAndLinks(paragraphBuffer.join(' '))}</p>\n`;
            paragraphBuffer = [];
        }
    };

    const flushList = () => {
        if (inList) {
            html += `<ul>\n${listItems}</ul>\n`;
            listItems = '';
            inList = false;
        }
    };

    const flushOrderedList = () => {
        if (inOrderedList) {
            html += `<ol>\n${orderedListItems}</ol>\n`;
            orderedListItems = '';
            inOrderedList = false;
        }
    };

    const flushTable = () => {
        if (inTable && tableHeaders.length > 0) {
            html += renderMarkdownTable(tableHeaders, tableRows);
            tableHeaders = [];
            tableRows = [];
            inTable = false;
        }
    };

    const flushFaq = () => {
        if (currentFaq) {
            const answerHtml = currentFaq.answer.map(p => `<p>${renderWithBoldAndLinks(p)}</p>`).join('\n');
            html += `<details>\n<summary>${renderWithBoldAndLinks(currentFaq.question)}</summary>\n<div>\n${answerHtml}\n</div>\n</details>\n`;
            currentFaq = null;
        }
    };

    lines.forEach(line => {
        const trimmedLine = line.trim();

        if (trimmedLine.startsWith('##') && trimmedLine.toLowerCase().includes('faq')) {
            flushParagraph();
            flushList();
            flushOrderedList();
            flushTable();
            flushFaq();
            inFaqSection = true;
            html += `<h2>${renderWithBoldAndLinks(trimmedLine.substring(3))}</h2>\n`;
            return;
        }

        if (trimmedLine === '[PRICE_COMPARISON_TABLE]') {
            flushParagraph();
            flushList();
            flushOrderedList();
            flushTable();
            flushFaq();
            if (priceComparison && location && priceComparison.length > 0) {
                html += generatePriceTableHtml(priceComparison, location);
            }
            return;
        }

        if (trimmedLine === '') {
            flushParagraph();
            flushList();
            flushOrderedList();
            flushTable();
            flushFaq();
            return;
        }

        if (isTableSeparator(trimmedLine)) {
            return;
        }

        if (isTableRow(trimmedLine)) {
            flushParagraph();
            flushList();
            flushOrderedList();
            flushFaq();
            if (!inTable) {
                tableHeaders = parseTableRow(trimmedLine);
                inTable = true;
            } else {
                tableRows.push(parseTableRow(trimmedLine));
            }
            return;
        }

        if (inTable) {
            flushTable();
        }

        if (inFaqSection) {
            if (trimmedLine.startsWith('* ')) {
                flushFaq();
                currentFaq = { question: trimmedLine.substring(2).trim(), answer: [] };
            } else if (currentFaq) {
                currentFaq.answer.push(trimmedLine);
            }
        } else {
            // Ordered list (e.g., "1. Step" or "1) Step")
            const olMatch = trimmedLine.match(/^(\d+)[\.)]\s+(.*)$/);
            if (olMatch) {
                flushParagraph();
                flushList();
                if (!inOrderedList) {
                    inOrderedList = true;
                }
                orderedListItems += `<li>${renderWithBoldAndLinks(olMatch[2])}</li>\n`;
            } else if (trimmedLine.startsWith('##### ')) {
                flushParagraph();
                flushList();
                flushOrderedList();
                html += `<h5>${renderWithBoldAndLinks(trimmedLine.substring(6))}</h5>\n`;
            } else if (trimmedLine.startsWith('#### ')) {
                flushParagraph();
                flushList();
                flushOrderedList();
                html += `<h4>${renderWithBoldAndLinks(trimmedLine.substring(5))}</h4>\n`;
            } else if (trimmedLine.startsWith('### ')) {
                flushParagraph();
                flushList();
                flushOrderedList();
                html += `<h3>${renderWithBoldAndLinks(trimmedLine.substring(4))}</h3>\n`;
            } else if (trimmedLine.startsWith('## ')) {
                flushParagraph();
                flushList();
                flushOrderedList();
                html += `<h2>${renderWithBoldAndLinks(trimmedLine.substring(3))}</h2>\n`;
            } else if (trimmedLine.startsWith('* ')) {
                flushParagraph();
                flushOrderedList();
                if (!inList) {
                    inList = true;
                }
                listItems += `<li>${renderWithBoldAndLinks(trimmedLine.substring(2))}</li>\n`;
            } else {
                flushList();
                flushOrderedList();
                paragraphBuffer.push(trimmedLine);
            }
        }
    });

    flushParagraph();
    flushList();
    flushOrderedList();
    flushTable();
    flushFaq();

    return html;
}

