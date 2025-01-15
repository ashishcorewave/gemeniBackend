const express = require('express');
const fileUpload = require('express-fileupload');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises; // Use fs.promises for async file operations

const app = express();
const port = 3002;

// Enable file uploads
app.use(fileUpload());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));


//Enable CORS for HTTP
app.use((req, resp, next) => {
    resp.header("Access-Control-Allow-Origin", "*");
    resp.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With,Authorization,Content-Type,Accept,bkd_api_key");
    next();
});

const apiKey = "AIzaSyBTnsao9mx_R_XL0QgES5nkwpx17VwgCJ0"; // Store API key in environment variables
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

app.post('/chatbot-message', async (req, res) => {
    try {
        let imageBase64 = null;
        let mimeType = null;
        if (req.files) {
            if (req.files.image) {
                const imageFile = req.files.image;
                imageBase64 = imageFile.data.toString('base64');
                mimeType = imageFile.mimetype;
                console.log("mimeType1", mimeType);
            }
        }

        const parts = [];

        if (imageBase64) {
            parts.push({
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            });
        }
        parts.push({ text: `${req.body.message}. Please give me a response in short content about 20-35 words` });
        const result = await model.generateContent(parts);
        const responseText = result.response.text();
        res.status(200).json({ reply: responseText });
    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});