const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');


module.exports = function (links){
    const options = new chrome.Options()

    options.addArguments('--headless')
    options.addArguments('--disable-dev-shm-usage')
    options.addArguments('--no-sandbox')

    let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
    driver.manage().window().maximize()

    const username = '7471398262'
    const password = 'Newpass888'

    async function login() {
        let loginContainer = By.css('form');
        let loginSubmit = By.css('.btn-submit');
        let passSubmit = By.css('.dar-btn');
        let inpUsername = By.name("username")
        let inpPassword = By.css(".mat-input-element")

        await driver.get('https://seller.forte.kz/auth'); 

        await driver.wait(until.elementLocated(loginContainer), 10000);
        console.log('Login screen loaded.')
        
        await driver.wait(until.elementLocated(inpUsername), 10000);
        const input_username= await driver.findElement(inpUsername)
        await driver.findElement(inpUsername).sendKeys(username); 
        // console.log(driver.findElement(loginSubmit),35)
        await driver.findElement(loginSubmit).click();
        

        await driver.get('https://seller.forte.kz/auth/login');
        await driver.wait(until.elementLocated(loginContainer), 10000);
        console.log('Password screen loaded.')

        let input_pass= await driver.findElement(inpPassword)
        let sbm_btn = await driver.findElement(passSubmit) 

        await driver.wait(until.elementLocated(inpPassword), 10000);
        await input_pass.sendKeys(password); 
        // const input = await input_pass.getAttribute("value"); 
        // console.log(input,48)
        console.log('password is in input')
        // await driver.wait(until.elementLocated(passSubmit), 10000);
        // await driver.wait(until.elementIsEnabled(sbm_btn), 20000);
        // await driver.sleep(5000);
        // await driver.wait(until.elementIsVisible(sbm_btn),10000);
        // console.log('element is visible')
        // const r = await sbm_btn.getRect()
        // console.log(r,58)

        // const s = await driver.findElement(passSubmit).isEnabled()
        // console.log(s,61)

        await driver.findElement(passSubmit).click();
        console.log('Click')
    };

    async function changePrice(l){
        try{
            await login()
            await driver.wait(until.elementLocated(By.css('dar-header')), 10000);

            let inpPrice = By.css("dar-overlay .price-input")
            let btnSubmit = By.css("dar-overlay .dar-btn");
            let body = By.css('body')
            // console.log(driver.findElement(body).getAttribute('innerHTML'))

            // await driver.wait(until.elementLocated(By.css("body")), 10000).getAttribute('innerHTML');

            for(const item of l){
                await driver.get(item.link)
                console.log(item.link,54)
                await driver.wait(until.elementLocated(inpPrice), 10000).clear();
                await driver.wait(until.elementLocated(inpPrice), 10000).sendKeys(item.price, Key.RETURN);
                await driver.wait(until.elementLocated(btnSubmit), 10000).click();
                console.log('click',58)
                await driver.wait(until.elementLocated(By.css('router-outlet')), 20000);
            }
        }finally{
            await driver.quit();
        }
    }

    changePrice(links)
}