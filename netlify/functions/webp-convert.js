const sharp = require('sharp');

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    // Parse the request body
    let requestBody;
    try {
      requestBody = JSON.parse(event.body);
    } catch (parseError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid JSON body' })
      };
    }

    const { imageData, fileName } = requestBody;

    if (!imageData) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'imageData is required' })
      };
    }

    if (!fileName) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'fileName is required' })
      };
    }

    // Convert base64 to buffer
    let imageBuffer;
    try {
      // Remove data URL prefix if present (e.g., "data:image/png;base64,")
      const base64String = imageData.replace(/^data:image\/[^;]+;base64,/, '');
      imageBuffer = Buffer.from(base64String, 'base64');
    } catch (bufferError) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid base64 image data' })
      };
    }

    // Convert to WebP using Sharp - keep original dimensions, use 80% quality
    const webpBuffer = await sharp(imageBuffer)
      .webp({ quality: 80 }) // 80% quality, keep original dimensions
      .toBuffer();

    // Convert back to base64
    const webpBase64 = webpBuffer.toString('base64');

    // Generate new filename with .webp extension
    const newFileName = fileName.replace(/\.[^/.]+$/, '.webp');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        webpData: webpBase64,
        originalSize: imageBuffer.length,
        webpSize: webpBuffer.length,
        originalFileName: fileName,
        webpFileName: newFileName
      })
    };

  } catch (error) {
    console.error('WebP conversion error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Image conversion failed',
        details: error.message
      })
    };
  }
};
