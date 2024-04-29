const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

    // Navigate the page to a URL
  await page.goto('http://localhost:8080/login');

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  await page.type("#inputEmail", "admin@demo.fr");
  await page.type("#inputPassword", "admin");

  await page.keyboard.press("Enter");
  await page.waitForNavigation();

  await page.goto("http://localhost:8080/admin/products/ajout");

  await page.type("#product_form_name", "Un exemple");
  await page.type("#product_form_description", "Un exemple de description");
  await page.click('.nice-select');
  await page.click('.nice-select li:nth-child(4)');     // 2: Souris
  await page.type("#product_form_price", "10.5");
  await page.type("#product_form_stock", "5");

  await page.waitForSelector('input[type=file]');
  const inputUploadHandle = await page.$('input[type=file]');

	// path to the file you want to upload
  const images = ['./newimage/example.png', './newimage/image_0_0.jpg']
  await inputUploadHandle.uploadFile(...images);

  await page.click("button[type=submit]");

  //await browser.close();
})();