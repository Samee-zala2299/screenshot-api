const chromium = require('chrome-aws-lambda');
const puppeteer = require('puppeteer-core');
module.exports = async (req, res) => {
  let browser = null;
  try {
    const url = (req.query.url || req.body?.url || '').toString();
    if (!url) return res.status(400).send('Missing "url" parameter');
    const execPath = await chromium.executablePath || null;
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: execPath,     // Vercel/Serverless provides binary
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 45000 });
    const buffer = await page.screenshot({ fullPage: true, type: 'png' });
    await browser.close();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buffer);
  } catch (err) {
    console.error('Screenshot error:', err);
    try { if (browser) await browser.close(); } catch(e){}
    return res.status(500).send('Error taking screenshot: ' + (err.message || err.toString()));
  }
};
