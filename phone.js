const {Builder, By, Key, until} = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');


async function kek(){
    const options = new chrome.Options()

    // options.addArguments('--headless')
    options.addArguments('--disable-dev-shm-usage')
    options.addArguments('--no-sandbox')

    rand_array=['.offer__parameters','.a-credit__amount','.kolesa-score-average','.offer__info-views','.a-credit__row','.offer__sub']
    rand_array2=['100','200','300','400','500','600','700','800','900']
    async function login() {
        let driver = new Builder().forBrowser('chrome').setChromeOptions(options).build();
        driver.manage().window().maximize()

        await driver.get('https://kolesa.kz/a/show/120888312'); 

        await driver.wait(until.elementLocated(By.css('.seller-phones__show-button')), 10000);
        console.log('Show  loaded.')

        const element  = rand_array[Math.floor(Math.random() * rand_array.length)];
        await driver.findElement(By.css(element)).click();
        console.log(element)
        let number =  rand_array2[Math.floor(Math.random() * rand_array2.length)];
        console.log(number)

        await driver.executeScript(`window.scrollBy(0,${number})`);
        await driver.sleep(3000)
    
        
        // await driver.findElement(By.css('.seller-phones__show-button')).click();
        // await driver.wait(until.elementLocated(By.css('.seller-phones__phones-list')), 10000);
        // console.log('Phones loaded.')
        // let phones = await driver.findElement(By.css('.seller-phones__phones-list')).findElements(By.tagName('li'))
        // console.log(phones.length)
        // const array = []
        // for(phone of phones){
        //     const p = await phone.getText()
        //     array.push(p.replace(/ /g,''))
        // }
        // console.log(array[0])
        // await driver.close()
        // await driver.quit()

    };
    login()

    // async function changePrice(l){
    //     try{
    //         await login()
    //         await driver.wait(until.elementLocated(By.css('dar-header')), 10000);

    //         let inpPrice = By.css("dar-overlay .price-input")
    //         let btnSubmit = By.css("dar-overlay .dar-btn");
    //         let body = By.css('body')
    //         for(const item of l){
    //             await driver.get(item.link)
    //             console.log(item.link,54)
    //             await driver.wait(until.elementLocated(inpPrice), 10000).clear();
    //             await driver.wait(until.elementLocated(inpPrice), 10000).sendKeys(item.price, Key.RETURN);
    //             await driver.wait(until.elementLocated(btnSubmit), 10000).click();
    //             console.log('click',58)
    //             await driver.wait(until.elementLocated(By.css('router-outlet')), 20000);
    //         }
    //     }finally{
    //         await driver.quit();
    //     }
    // }

    // changePrice(links)
}
kek()