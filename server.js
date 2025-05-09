// server.js

import express from 'express';
import multer from 'multer';
import fs from 'fs-extra';
import path from 'path';
import dotenv from 'dotenv';
import mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { extractFieldsWithLLM, extractDataWithLLM, generateFilledCVWithLLM } from './llm.js';
import { addDefaultTemplateStyle, convertHtmlToDocx, convertHtmlToPdf } from './utils.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

const upload = multer({ dest: 'uploads/' });
fs.ensureDirSync('uploads');
fs.ensureDirSync('converted');
fs.ensureDirSync('logs');

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.post('/transform', upload.fields([{ name: 'template' }, { name: 'cv' }]), async (req, res) => {
    try {
        const templateFile = req.files.template[0];
        const cvFile = req.files.cv[0];

        const templateBuffer = fs.readFileSync(templateFile.path);
        const { value: templateHtmlRaw } = await mammoth.convertToHtml({ buffer: templateBuffer });
        const templateHtml = addDefaultTemplateStyle(templateHtmlRaw);

        const fieldsToFill = await extractFieldsWithLLM(templateHtml);

        const cvBuffer = fs.readFileSync(cvFile.path);
        const cvText = (await pdfParse(cvBuffer)).text;

        const sanitizedFields = fieldsToFill.map(field =>
            typeof field === 'string' ? field.trim() : ''
        ).filter(f => f);

        const extractedData = await extractDataWithLLM(cvText, sanitizedFields);

        const filledHtml = await generateFilledCVWithLLM(templateHtml, fieldsToFill, extractedData);

        const baseName = Date.now();
        const htmlPath = `converted/${baseName}.html`;
        fs.writeFileSync(htmlPath, filledHtml);

        await convertHtmlToDocx(htmlPath, baseName);
        await convertHtmlToPdf(htmlPath, baseName);

        res.json({
            message: 'CV successfully generated!',
            downloadHtml: `/download/html/${baseName}.html`,
            downloadDocx: `/download/docx/${baseName}.docx`,
            downloadPdf: `/download/pdf/${baseName}.pdf`
        });

    } catch (error) {
        console.error('Error in processing:', error);
        res.status(500).send('An error occurred: ' + error.message);
    } finally {
        fs.removeSync(req.files.template[0].path);
        fs.removeSync(req.files.cv[0].path);
    }
});

app.get('/download/html/:filename', (req, res) => {
    res.download(path.join(__dirname, 'converted', req.params.filename));
});

app.get('/download/docx/:filename', (req, res) => {
    res.download(path.join(__dirname, 'converted', req.params.filename));
});

app.get('/download/pdf/:filename', (req, res) => {
    res.download(path.join(__dirname, 'converted', req.params.filename));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
