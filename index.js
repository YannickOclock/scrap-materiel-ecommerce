const axios = require('axios');
const fs = require('fs');
const puppeteer = require('puppeteer');

(async () => {
  // Launch the browser and open a new blank page
  const browser = await puppeteer.launch({headless: false});
  const page = await browser.newPage();

  // je me rends sur le site local
  await page.goto('http://localhost:8080/login');

  await page.type("#inputEmail", "admin@demo.fr");
  await page.type("#inputPassword", "admin");

  await page.keyboard.press("Enter");
  await page.waitForNavigation();

    // Navigate the page to a URL
  await page.goto('https://www.materiel.net/souris-pc/l480/+fc2503-1/?sort=32', { waitUntil: 'domcontentloaded' });

  // Set screen size
  await page.setViewport({width: 1080, height: 1024});

  const btnsHref = await page.evaluate(() => {
    const btnsHref = [];
    let count = 0;
    for(const productLink of document.querySelectorAll(".c-product__link")) {
      btnsHref[count] = productLink.getAttribute('href');
      count += 1;
    }
    return btnsHref;
  });
  
  for(let i=0; i<6; i++) {
    await page.goto(btnsHref[i], { waitUntil: 'domcontentloaded' });

    await page.waitForTimeout("500");
    // informations du produit

    const data = await page.evaluate(() => {
      const data = {};
      
      data.title = document.querySelector("h1").textContent;
      data.images = [];

      const priceElement = document.querySelector(".o-product__price");
      let priceOrigin = priceElement.textContent;
      priceOrigin = priceOrigin.replace(/\s/g, '');
      let price = priceOrigin.replace('€', '');
      data.price = parseInt(price)/100;
      data.priceOrigin = price;
      
      const descriptionElement = document.querySelector("div#c-product__id p.mb-4");
      data.description = descriptionElement.textContent;

      const carouselElement = document.querySelector(".mNet-carousel");
      const imgElements = carouselElement.querySelectorAll(".img-fluid.js-to__product-gallery");
      for(const imgElement of imgElements) {
        data.images.push({
          source: imgElement.dataset["srcMedium"],
          extension: imgElement.dataset["srcMedium"].split('.').pop()
        });
      }
      return data;
    });

    data.downloadImages = [];
    
    for(const imageId in data.images) {
      // Then download the file with Axios...
      const response = await axios({
        url: data.images[imageId].source,
        method: 'GET',
        responseType: 'stream',
      });

      const localImage = `./newimage/image_${i}_${imageId}.${data.images[imageId].extension}`;
      const writer = fs.createWriteStream(localImage);
      data.downloadImages.push(localImage);

      response.data.pipe(writer);

      writer.on('finish', () => {
        console.log('Download finished');
      });

      writer.on('error', (error) => {
        console.error('Error occurred:', error);
      });
      console.log(`id produit : ${i}`);
    }

    console.log(data);

    if(data.downloadImages.length > 0) {

      await page.goto("http://localhost:8080/admin/products/ajout", { waitUntil: 'domcontentloaded' });
      console.log(data);

      await page.type("#product_form_name", data.title);
      await page.type("#product_form_description", data.description);
      await page.click('.nice-select');
      await page.click('.nice-select li:nth-child(8)');     // 2: Souris
      await page.type("#product_form_price", `${data.price}`);
      await page.type("#product_form_stock", "5");

      await page.waitForSelector('input[type=file]');
      const inputUploadHandle = await page.$('input[type=file]');

      // path to the file you want to upload
      const myImages = data.downloadImages;
      await inputUploadHandle.uploadFile(...myImages);

      await page.click("button[type=submit]");

      await page.waitForSelector(".alert-success");
    }
  }

  await browser.close();
})();