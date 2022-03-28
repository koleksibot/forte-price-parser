const XLSX = require('xlsx')

async function createXLSX(array){
    var wb = XLSX.utils.book_new();

    wb.Props = {
        Title: "Forte CreateXLSX",
        Subject: "Test",
        Author: "Nassiba",
        CreatedDate: new Date()
    };
    
    wb.SheetNames.push("Test Sheet");
    // var ws_data = [['hello' , 'world']];  
    var ws = XLSX.utils.aoa_to_sheet(array);
    wb.Sheets["Test Sheet"] = ws;
    
    
    XLSX.writeFile(wb, 'forte.xlsx');
}

module.exports = {
    createXLSX,
};