'use strict';

const puppeteer = require('puppeteer');
// const config = require('../../config/config');

async function generatePdf(url) {
  // https://peter.sh/experiments/chromium-command-line-switches
  const args = [
    '--single-process',
    '--no-zygote',
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',
    '--ignore-certificate-errors',
    '--disable-gpu',
    '--no-first-run',
    '--allow-running-insecure-content',
  ];

  const browser = await puppeteer.launch({
    // executablePath: config.env !== 'development' ?  '/usr/bin/google-chrome-stable' : undefined,
    headless: 'new',
    args,
    timeout: 0,
  });
  const page = await browser.newPage();

  page.setDefaultNavigationTimeout(0);

  await page.goto(url, {
    waitUntil: 'networkidle0', // wait for page to load completely
  });

  // https://pptr.dev/api/puppeteer.page.waitforselector/
  await page.waitForSelector('#export-pdf', {
    timeout: 0,
  });

  const pdf = await page.pdf({
    printBackground: true,
    format: 'A4',
  });

  await page.close();
  await browser.close();

  return pdf;
}


module.exports = generatePdf;
