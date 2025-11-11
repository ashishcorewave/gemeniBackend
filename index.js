const express = require('express');
const fileUpload = require('express-fileupload');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs').promises;
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

// Enable file uploads
app.use(fileUpload());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true, parameterLimit: 50000 }));

// Enable CORS
app.use((req, resp, next) => {
  resp.header("Access-Control-Allow-Origin", "*");
  resp.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Authorization, Content-Type, Accept, bkd_api_key");
  next();
});

const apiKey = process.env.GEMINI_API_KEY || "AIzaSyAAmXJgRNmuWkItakKXv5IEaFOGhejjAVs"; 
const genAI = new GoogleGenerativeAI(apiKey);

// ✅ Make sure model name is correct and available
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// Test route
app.get("/", (req, resp) => {
  resp.status(200).send("Welcome to Chatbot Backend APIs");
});

// ✅ Chatbot Message Route
app.post('/chatbot-message', async (req, res) => {
  try {
    let imageBase64 = null;
    let mimeType = null;

    // Handle file if uploaded
    if (req.files && req.files.image) {
      const imageFile = req.files.image;
      imageBase64 = imageFile.data.toString('base64');
      mimeType = imageFile.mimetype;
      console.log("Image uploaded:", mimeType);
    }

    // ✅ Fix: Properly interpolate message text with backticks
    const parts = [];

    if (imageBase64) {
      parts.push({
        inlineData: {
          data: imageBase64,
          mimeType: mimeType,
        },
      });
    }

    // ✅ Correct template string syntax
    parts.push({
      text: `${req.body.message}. Please give me a response in short content about 20-35 words.`,
    });

    // Generate AI response
    const result = await model.generateContent({ contents: [{ parts }] });

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
