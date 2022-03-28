// imports
require('dotenv').config();
const fs = require('fs');
const axios = require('axios')
var CronJob = require('cron').CronJob;
const keys = require('./keys')
const jsonfile = require('jsonfile')
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { Telegraf } = require('telegraf')
const extra = require('telegraf/extra')
const markup = extra.HTML()
var changePrice = require('./test');
const {createXLSX} =require('./createXLSX')
const {uploadFileToForte,makePostRequest} = require('./post')


//constants
const our_store_name = 'Letostore.kz'
let excelValues = []
let excelValues2 

var users = []
var isBigger
const user_file = 'users.json'
const doc = new GoogleSpreadsheet('1dAzf31hrxmhebytsDY9nUnXi1SW6JLTOQUA-aNo8fyI');
const forteGS = new GoogleSpreadsheet('1qFdyGFKecS9EY5rMGAkqm489jFGzdGBqSBEigN9GLyI');

const bot = new Telegraf(process.env.BOT_TOKEN);

fs.exists(user_file,function(exists){
    if(exists){
        jsonfile.readFile(user_file, function (err, obj) {
            if (err) console.error(err)
            if(obj!==undefined){
                users=obj
            }    
            console.log('Number of users:'+users.length)
        })
    }
});

//read document which contains prices of Leto Store products from google spreadsheets 
async function loadGoogleSheet(){
    excelValues = []
    await doc.useServiceAccountAuth({
        client_email: keys.client_email,
        private_key: keys.private_key,
      });
    await doc.loadInfo(); // loads document properties and worksheets
    const sheet = doc.sheetsByIndex[1]
    const rows = await sheet.getRows()
    for(var i= 1;i<rows.length;i++){
        const model = rows[i]['Наименование товара']
        const price = rows[i]['7%']
        const sku = rows[i]['SKU']
        excelValues.push({'model':model,'price':price,'sku':sku})
    }
    console.log('excel is loaded')
}
// loadGoogleSheet()

//read document 
async function loadGoogleSheet2(){
    console.log('reading google sheet')
    excelValues2 = []
    await forteGS.useServiceAccountAuth({ 
        client_email: keys.client_email,
        private_key: keys.private_key,
      });
    await forteGS.loadInfo(); // loads document properties and worksheets
    const sheet = forteGS.sheetsByIndex[0]
    excelValues2 = await sheet.getRows()
    // console.log(excelValues2[0]['SKU'])
}
loadGoogleSheet2()

function createArrayOfArraysAndXLXS(){
    console.log('creating new file...')
    let arrayOfArrays = []

    arrayOfArrays.push(['SKU','Model','Brand','price','PP1','KZ-ALA'])
    for(var i= 0;i<excelValues2.length;i++){
        const sku = excelValues2[i]['SKU']
        const model = excelValues2[i]['Model']
        const brand = excelValues2[i]['Brand']
        const price =excelValues2[i]['price']
        const pp1 = excelValues2[i]['PP1']
        const kz_ala = excelValues2[i]['KZ-ALA']

        arrayOfArrays.push([sku,model,brand,price,pp1,kz_ala])
    }
    // console.log(arrayOfArrays[1])
    createXLSX(arrayOfArrays)
    console.log('New XSLX saved!')
}

//function to get prices from forte market and compare to Leto Store's prices
async function getData(){
    var showInTelegram=[]
    let promises = [];
    let minimumValues = []
    var top5 = []
    var linkToProduct = ''
    var linkToChange = ''
    const U = await makePostRequest();

    let arrayToSelenium = []

    for (let i = 0; i < U.length; i++) {
        promises.push(
            axios.get(U[i])
            .then(async response=>{
                //filling some constants
                var itemInfo = []
                const data = await response.data  
                const item_name = data.showcase.name
                
                //array of each store information(name of product,store name and price of product)
                data.nomenclatures_data.forEach((nomenclature)=>{
                    //promotions was nomenclature.promotions
                    itemInfo.push({'name':item_name,'store':nomenclature.merchant_name,'price':nomenclature.nomenclature.city_price_map['KZ'],'promotions':nomenclature.nomenclature.uid,'articul':nomenclature.nomenclature.articul})
                })

                //sort according to price 
                itemInfo = itemInfo.sort(compare);

                //minimum price on forte right now
                const current_minimum = itemInfo[0].price
                //our store info
                const our_store = itemInfo.find(({ store }) => store === our_store_name)
                const wasPrice = our_store.price

                //links
                linkToProduct = 'https://market.forte.kz/items/'+data.showcase.uid
                linkToChange = 'https://seller.forte.kz/products/manage(popup:overlay/products/manage/'+our_store.promotions+')'
                // linkToChange = 'https://seller.forte.kz/products/manage(popup:overlay/products/manage/'+our_store.promotions[0].ReqItemId+')'

                //searching from excel where we have allowable prices
                let product_from_excel =  excelValues.find(obj => obj.sku === our_store.articul)
                let allowable_price
                //допустимая цена из экзеля
                if(product_from_excel){
                    allowable_price = parseInt(product_from_excel.price.replace(/\s+/g, ''))
                }
                
                //проверям меньше ли наша цена чем допустимая и меняем ее на допустимую+10000/5000тг 
                if(allowable_price && our_store.price<allowable_price){
                    const zarabotok = our_store.price>100000 ? 10000:5000
                    const newPrice = allowable_price+zarabotok
                    // arrayToSelenium.push({link: linkToChange, price: newPrice})

                    const ind=itemInfo.findIndex((obj => obj.store === our_store_name));
                    itemInfo[ind].price=newPrice

                    itemInfo = itemInfo.sort(compare);

                    //top 5 stores 
                    if(itemInfo.length>5){
                        top5 = itemInfo.slice(0,5)
                    }else{
                        top5 = itemInfo
                    }

                    if(newPrice>wasPrice){
                        isBigger=true
                    }else{
                        isBigger=false
                    }

                    minimumValues.push({
                        'index': i,
                        'sku':our_store.articul,
                        'name': item_name,
                        'allowable_price':allowable_price,
                        'newPrice':newPrice,
                        'wasPrice':wasPrice,
                        'top5':top5,
                        'linkToProduct':linkToProduct,
                        'linkToChange':linkToChange,
                        'isBigger':isBigger
                    })
                }else{
                    //если мы не на первом месте
                    if(itemInfo[0].store!==our_store_name){
                        //если минимальная цена меньше чем наша
                        if (current_minimum <= our_store.price){ 
                            const minimum_minus_one = (parseInt(current_minimum)-1)
                            const zarabotok = our_store.price>100000 ? 10000:5000
                            console.log(our_store.articul)
                            console.log(product_from_excel)
                            console.log(item_name)
                            //если допустимая цена меньше чем минимальная минус один
                            console.log(allowable_price+zarabotok,191)
                            if(allowable_price && minimum_minus_one > allowable_price+zarabotok){
                                const newPrice = minimum_minus_one        
                                // arrayToSelenium.push({link: linkToChange, price: newPrice})
                                
                                const ind=itemInfo.findIndex((obj => obj.store === our_store_name));
                                itemInfo[ind].price=newPrice
                                itemInfo = itemInfo.sort(compare);

                                //top 5 stores 
                                if(itemInfo.length>5){
                                    top5 = itemInfo.slice(0,5)
                                }else{
                                    top5 = itemInfo
                                }

                                if(newPrice>wasPrice){
                                    isBigger=true
                                }else{
                                    isBigger=false
                                }

                                minimumValues.push({
                                    'index': i,
                                    'sku':our_store.articul,
                                    'name': item_name,
                                    'allowable_price':allowable_price,
                                    'newPrice':newPrice,
                                    'wasPrice':wasPrice,
                                    'top5':top5,
                                    'linkToProduct':linkToProduct,
                                    'linkToChange':linkToChange,
                                    'isBigger':isBigger
                                })
                            }
                        }
                    }
                    //check second store from the top in order to increase our price till second_store's price - 1
                    //если мы на первом месте, чтобы увеличивать цену подстраиваясь под второе место 
                    else{
                        //если есть второе место и их цена минус один больше чем наша
                        if(allowable_price && itemInfo[1] && (itemInfo[1].price-1)>itemInfo[0].price){
                            const newPrice = itemInfo[1].price-1  
                            // arrayToSelenium.push({link: linkToChange, price: newPrice})
                            
                            const ind=itemInfo.findIndex((obj => obj.store === our_store_name));
                            itemInfo[ind].price=newPrice

                            itemInfo = itemInfo.sort(compare);
                            
                            //top 5 stores 
                            if(itemInfo.length>5){
                                top5 = itemInfo.slice(0,5)
                            }else{
                                top5 = itemInfo
                            }

                            if(newPrice>wasPrice){
                                isBigger=true
                            }else{
                                isBigger=false
                            }
                            minimumValues.push({
                                'index': i,
                                'sku':our_store.articul,
                                'name': item_name,
                                'allowable_price':allowable_price,
                                'newPrice':newPrice,
                                'wasPrice':wasPrice,
                                'top5':top5,
                                'linkToProduct':linkToProduct,
                                'linkToChange':linkToChange,
                                'isBigger':isBigger
                            })
                        }
                    }
                }
                
            })
            .catch(err=>{
                console.log(U[i]+' '+err)
            })     
        )
    }

    const res = await Promise.all(promises).then(()=> {
        console.log('Number of items need to change:'+minimumValues.length)

        // console.log(arrayToSelenium,229)

        // if(arrayToSelenium.length>0){
        //     changePrice(arrayToSelenium)
        // }

        minimumValues.forEach((item)=>{
            const obj = { 
                'sku':item.sku,
                "name": item.name,
                "allowable_price":item.allowable_price,
                "price": item.newPrice,
                "top5":item.top5,
                "linkToProduct":item.linkToProduct,
                'linkToChange':item.linkToChange,
                'was':item.wasPrice,
                'isBigger':item.isBigger
            }
            showInTelegram.push(obj)
        })  
        return showInTelegram
    });
    return res
    
}

var job = new CronJob('*/1 * * * *', async function() {
    console.log('You will see this message every minute');
    await loadGoogleSheet()
    
    if(users){
        async function waitForPromise() {
            const result = await getData();
            if(result.length>0){
                await loadGoogleSheet2()
            }
            var emoji
            result.forEach((item)=>{
                // console.log(item)
                var top5String = ''
                item.top5.forEach((top,index)=>{
                    top5String+='<b>'+(index+1)+')</b><i>'+top.store+':'+top.price+'тг</i>\n'
                })

                const emoji = item.isBigger ? '⬆' : '⬇';

                console.log(item.name+", "+item.was+" New Price: "+item.price+" "+emoji)

                users.forEach((user)=>{
                    bot.telegram.sendMessage(user.chatId,
                        '<b>Название товара:</b> <i>'+item.name+'</i>\
                        \n<b>Самая низкая цена была:</b> <i>'+item.was+'тг</i>\
                        \n<b>Самая низкая цена стала:</b> <i>'+item.price+'тг </i>'+emoji+'\
                        \n<b>Наша допустимая цена:</b> <i>'+item.allowable_price+'тг</i>\
                        \n<b>Ссылка на изменение:</b>'+item.linkToChange+'\
                        \n<b>Ссылка на продукт: </b>'+item.linkToProduct+'\
                        \n<b>Топ 5:</b>\n'+top5String
                        ,
                        markup)
                })
                changeForteGS(item.sku,item.price)
            })
            if(result.length>0){
                console.log('Something changed')
                await createArrayOfArraysAndXLXS()
                await uploadFileToForte()
            }
            
        }
        waitForPromise()
    }
}, null, true);
job.start();



//sort function for prices 
function compare(a, b) {
    const priceA = a.price;
    const priceB = b.price;
  
    let comparison = 0;
    if (priceA > priceB) {
      comparison = 1;
    } else if (priceA < priceB) {
      comparison = -1;
    }
    return comparison;
}
function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

async function changeForteGS(sku,newPrice){
    for(var i= 1;i<excelValues2.length;i++){
        if(excelValues2[i]['SKU']===sku){
            excelValues2[i]['price']=newPrice
            await excelValues2[i].save(); 
            break
        }
    }
}


bot.start((ctx) => {
    ctx.telegram.sendMessage(ctx.chat.id,'Здрасьте, начинаю парсить, подождите минуту :)');
    const existing_user = users.find(({ chatId }) => chatId === ctx.chat.id);

    console.log("New user:"+ctx.chat.id)
    if(!existing_user){
        users.push({
            'chatId':ctx.chat.id
        })
        jsonfile.writeFile(user_file, users, function (err) {
            if (err) console.log(err)
        })
    }
})
bot.launch()