const axios = require('axios')
const queryString = require('query-string');
const fs = require('fs')
const FormData = require('form-data')
const XLSX = require('xlsx')


//get all available and visible products api-links which we sell from forte market
async function makePostRequest() {
    URLS = []
    const token = await getToken()

    const startUrl = 'https://marketapi.forte.kz/api/v4/products/showcase/fulldata/'
    const endUrl = '?cityid=KZ&mindboxDeviceUUID=21af85fb-f54e-4c2c-94b1-037b84f68c3e'
    const data = {"from":0,"size":1000,"query_name_article_barcode":"","merchant_id":"A0PZ3VHlBJJVZNIDT6","status":"approved"}
    await axios({
        method: 'post',
        url: 'https://marketapi.forte.kz/api/v4/products/nomenclature/filter',
        data:data,
        headers: {
            'Authorization': "Bearer "+ token,
            'X-Owner': 'MERCHANT##A0PZ3VHlBJJVZNIDT6',
        }
    })
    .then(function (res) {
        console.log('Got all products')
        res.data.nomenclature.forEach((item)=>{  
            if(item.is_visible){
                const newUrl = startUrl+item.product_id+endUrl
                URLS.push(newUrl)
            }
        })
    })
    // let res = await axios.post('https://marketapi.forte.kz/api/v4/products/nomenclature/filter',{"from":0,"size":1000,"query_name_article_barcode":"","merchant_id":"A0PZ3VHlBJJVZNIDT6","status":"approved"},
    // {
    //     'X-Owner': 'MERCHANT##A0PZ3VHlBJJVZNIDT6',
    //     'Authorization': "Bearer " + token
    // });
    // res.data.nomenclature.forEach((item)=>{  
    //     if(item.is_visible){
    //         // console.log()
    //         const newUrl = startUrl+item.product_id+endUrl
    //         URLS.push(newUrl)
    //     }
    // })
    return URLS
}

function getToken() {
    let data = {
        username: "mobile:77471398262",
        password: "pwd:Newpass888",
        grant_type: "password",
        scope: "general",
        ecoSystem: "FORTE_BANK"
    }
    return axios({
        method: 'post',
        url: 'https://api.dar.kz/v1/oauth/token',
        data: queryString.stringify(data),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': "Basic Zm9ydGVfbWFya2V0X3dlYjox"
        }
    })
    .then(function (response) {
        // console.log(response.data,24);
        return (response.data.access_token)
    })
    .catch(function (response) {
        console.log(response,47);
    });
}

async function uploadFileToForte(){
    const form_data = new FormData();
    form_data.append("file", fs.createReadStream('forte.xlsx'));

    const token = await getToken()
    return axios({
        method: 'post',
        url: 'https://marketapi.forte.kz/v1/uploader/file/',
        data:form_data,
        headers: {
            'Authorization': "Bearer "+ token,
            'X-Owner': 'MERCHANT##A0PZ3VHlBJJVZNIDT6',
            ...form_data.getHeaders()
        }
    })
    .then(function (response) {
        console.log('File forte.xslx successfully upload to forte market')
        // console.log(response.data,24);
    })
    .catch(function (response) {
        console.log(response.response.data);
        if(response.response.data.status===409 || response.response.data.status===502){
            uploadFileToForte()
        }
    });
}

// uploadFileToForte()

// let payload = {
//     "merchant_id": "9m28h3wQS2Mjk1er3Y",
//     "name": "Самокат детский 21th Scooter S13",
//     "price": 26006,
//     "stock_id": [
//         "399aaafa-c23e-11e9-9339-0a580a0207dd"
//     ],
//     // "city_price_map": {"KZ-ALA": 26006},
// }


// async function changePrice(){
//     const token = await getToken()
//     axios({
//         method: 'put',
//         url: 'https://marketapi.forte.kz/api/v4/products/nomenclature/eefed837-aae5-11ea-983d-0a580a0203cf',
//         data: payload,
//         headers: {
//             'Authorization': "Bearer "+token,
//             'X-Owner': 'MERCHANT##9m28h3wQS2Mjk1er3Y'
//         }
//     })
//         .then(function (response) {
//         //handle success
//             console.log(response.data);
//     })
//         .catch(function (response) {
//         //handle error
//             console.log(response);
//             console.log(token)
//     });
// }
// changePrice()

module.exports = {
    getToken,
    uploadFileToForte,
    makePostRequest
}