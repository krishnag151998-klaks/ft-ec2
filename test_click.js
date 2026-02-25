const puppeteer = require('puppeteer');

(async () => {
    try {
        const browser = await puppeteer.launch({
            headless: "new",
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();

        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));

        console.log("Navigating...");
        await page.goto('http://localhost:3000', { waitUntil: 'networkidle2', timeout: 30000 });

        console.log("Evaluating...");
        let htmlClassBefore = await page.evaluate(() => document.documentElement.className);
        console.log('HTML class before click:', htmlClassBefore);

        let btnClass = await page.evaluate(() => {
            let btn = document.querySelector('.theme-toggle-btn');
            return btn ? btn.className : 'NOT_FOUND';
        });
        console.log('Button class:', btnClass);

        if (btnClass !== 'NOT_FOUND') {
            console.log('Clicking button...');
            await page.click('.theme-toggle-btn');
            await new Promise(r => setTimeout(r, 1000));

            let htmlClassAfter = await page.evaluate(() => document.documentElement.className);
            console.log('HTML class after click:', htmlClassAfter);

            let storage = await page.evaluate(() => localStorage.getItem('theme'));
            console.log('localStorage theme:', storage);
        } else {
            console.log("Button not found directly inside DOM!");
            // Wait, is it rendered after mount?
            await new Promise(r => setTimeout(r, 1000));
            let btnClass2 = await page.evaluate(() => {
                let btn = document.querySelector('.theme-toggle-btn');
                return btn ? btn.className : 'NOT_FOUND';
            });
            console.log('Button class after 1s:', btnClass2);
        }

        await browser.close();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
})();
