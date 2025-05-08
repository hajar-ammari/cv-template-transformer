import fs from 'fs-extra';
import path from 'path';
import htmlDocx from 'html-docx-js';
import pdf from 'html-pdf';

export async function convertHtmlToDocx(htmlPath, baseName) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const docxBuffer = await htmlDocx.asBlob(html);
    const buffer = Buffer.from(await docxBuffer.arrayBuffer());
    const docxPath = `converted/${baseName}.docx`;
    fs.writeFileSync(docxPath, buffer);
    return docxPath;
}

export async function convertHtmlToPdf(htmlPath, baseName) {
    const html = fs.readFileSync(htmlPath, 'utf8');
    const pdfPath = `converted/${baseName}.pdf`;
    await new Promise((resolve, reject) => {
        pdf.create(html).toFile(pdfPath, (err) => {
            if (err) return reject(err);
            resolve();
        });
    });
    return pdfPath;
}

export function addDefaultTemplateStyle(html) {
    const style = `
    <style>
    body {
        margin-top: 2.5cm;
        margin-bottom: 2.5cm;
        margin-left: 2cm;
        margin-right: 2cm;
        font-family: Arial, sans-serif;
        font-size: 11pt;
    }
    table {
        width: 100%;
        border-collapse: collapse;
        page-break-inside: auto;
    }
    th, td {
        border: 1px solid black;
        padding: 6px;
        vertical-align: top;
    }
    tr {
        page-break-inside: avoid;
        page-break-after: auto;
    }
    </style>
    `;
    return style + html;
}
