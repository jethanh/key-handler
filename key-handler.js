const axios = require("axios");
const readline = require("readline");
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// This program will be able to handle the JSON files created from DR for both hot and cold machines.
// The CLI functionality is built out and works as expected with thorough manual testing.
// Program will be able to handle both online and offline tasks based on if an xprv is present. 
    //(if no xprv present, it's a hot machine and will use xpubs instead.)

// a user can choose from a list of keys (all DR JSON files), and select which key they'd like to perform jobs on.
// from there, they currently have the option to "display", "utxos", "sweep", or "change".
    // display: Displays the current key that the user is interacting with.
    // utxos: Uses an xpub value to build a UTXO set of (to be implemented.)
    // sweep: Uses an xprv value and UTXO json files to build a sweep transaction (to be implemented.)
    // change: Provides the user with a list of keys (from JSON files) to select from.


async function getKeys(){
    //this will be a function to retrieve the JSON keyfiles - we will also need to implement the decryption of the files.
    //currently dummy data, but any JSON obj should work here,
    //will require changes the Key class values in order to match DR JSON.

    const keys = [{"xprv": "xprv123", "xpub": "xpub123", "vault": "International"}, //each object/index represents JSON file of a vault.
                  {"xpub": "xpub456", "walletType": "p2sh", "vault": "Deposit"}, //this one has no xprv to show that the program can handle JSON with only xpub (cold machine).
                  {"xprv": "xprv789", "xpub": "xpub789", "walletType": "p2pkh", "vault": "Default"} ]
    return keys
}

class Key {
    //constructor takes a JSON object that holds wallet & other supplemental data (xpub/xprv, walletType, etc.)
    constructor(key) {
        this.xprv = key.xprv
        this.xpub = key.xpub
        this.walletType = key.walletType
        //TODO: implement logic for handling multiple keys based on walletType
        //change these values to handle the actual JSON data format.
    }
    // these methods will be invoked based on user input, implement feature logic here.
    // this program should be capable of handling offline and online jobs.

    // TODO: Logic for gathering UTXOs with xpub as input.
    //       Logic for writing UTXOs to new JSON files.
    //       Logic for using the UTXO JSON data to build a sweep txn.
    //       Logic for catching erroneous entries (i.e. trying to 'sweep' when no xprv is available.)
    //       To be continued...

    // ================ methods ================

    displayCurrentKey(obj, arr) {
        if(this.xprv != undefined){
            console.log(`The currently selected key is: ${this.xprv}`)
        } else {
            console.log(`The currently selected key is: ${this.xpub}`)
        }
        rerun(obj, arr)
    }

    getUtxos(obj, arr){
        //logic for gathering UTXOs here using an xpub
        //write catch statements for if anything other than xpub is passed in here.
        if (this.xpub == undefined){
            console.log('Ensure that the JSON files you are running the program on contains xpub values.')  
        } else {
            console.log('==== code responsible for gathering UTXOs goes here ====')
            //testing API call here to ensure we can retrieve UTXO data with this method.
            //TODO: create a helper function which derives xpub children, queries txns, and creates UTXO JSON file.
            axios.get(`https://api.blockcypher.com/v1/btc/main/addrs/${this.xpub}/balance`)
                .then(res => res) //do something with responses here
                .catch(err => err) //error handling here.
            console.log(`Gathering UTXOs for ${this.xpub}`)
        }
        rerun(obj, arr)
    }

    sweep(obj, arr){
        //write logic for building the sweep transaction using the data gathered from the "getUtxos" method above.
        //this one will be run on a cold machine, 
        //actionsPrompts will be available for the user to choose which action they'd like to take.
        console.log('==== Code responsible for building a sweep TXN goes here. ====')
        console.log(`Sweeping transactions for the key ${this.xprv}`)
        rerun(obj, arr)
    }
}

// =================================================================================================================== //
let displayDesc = "'display': displays the currently selected key"
let utxosDesc = "'utxos': gathers utxos for the selected xpub (hot machine)"
let changeDesc = "'change': provides a list of keys to choose from"
let sweepDesc = "'sweep': builds a sweep transaction using the selected xprv and appropriate UTXO JSON file (cold machine)\n"


let actionsPrompt = `\n ---- What would you like to do? ---- \n ${displayDesc} \n ${changeDesc} \n ${utxosDesc} \n ${sweepDesc} \n>>> Enter one of the options above: `
let verifyPrompt = "Would you like to use the following key?:"
let continuePrompt = ">>> Would you like to continue? (Y or N): "
let yesNoPrompt = "Please enter a valid answer (Y or N):"
let chooseKeyPrompt = "---- Please choose a key from the list above to proceed with. ----"
let enterKeyPrompt = ">>> Please choose a new key (enter the number): "

let selectedKey;

//main function for driving the program.
function runProgramOnKey(key, arr){
    let keyToUse = identifyKey(key)
    rl.question( verifyPrompt + ` ${keyToUse} \n >>> Enter 'Y' or 'N': `, function(answer) {
        if (equalTo(answer.toLowerCase(), 'y', 'n') == true){
            if (answer.toLowerCase() === 'y'){
                selectedKey = new Key(key)
            } 
    
            if (answer.toLowerCase() == 'n'){ //no values left, prompt user to choose from a list.
                changeKey(arr)
            }

            rl.question(actionsPrompt, function(answer) { //once key has been chosen, provide user with their options.
                options(answer, selectedKey, arr);
            });
        } else { //invalid user input will prompt user to choose key from a list.
            changeKey(arr)
        }
    });
}

async function run(){
    let arrayOfKeys = await getKeys() //retrieve the keys from JSON file.
    runProgramOnKey(arrayOfKeys[0], arrayOfKeys) //run the program on the keys, starting with the first index.
}

run()

rl.on("close", function() {
    process.exit(0)
});



// ================ functions ================

function invalidResponse(question, obj, arr){
    console.log('Invalid Response.')
    rl.question(question, function(ans){
        options(ans, obj, arr)
    })
}

function identifyKey(key){
    //this function identifies which key to use.
    //If there's an xprv (aka, we are on cold machine), use it.
    //Otherwise, use xpub.
    if (key.xprv != undefined){
        return `${key.xprv}`
    } else {
        return `${key.xpub}`
    }
}

function options(answer, obj, arr){
    // function for a user's options, takes answer and executes the applicable method.
    // if the user provides an invalid response, it will have the user retry.
    if (answer.toString().toLowerCase() == 'sweep'){
        return obj.sweep(obj, arr);
    } else if (answer.toString().toLowerCase() == 'display') {
        return obj.displayCurrentKey(obj, arr);
    } else if (answer.toString() == 'utxos'){
        return obj.getUtxos(obj, arr);
    } else if (answer.toString().toLowerCase() == 'change') {
        changeKey(arr)
    } else {
        invalidResponse(actionsPrompt, obj, arr)
    }
}

function rerun(obj, arr){
    // function that asks the user if they want to continue and reruns the program if Y.
    rl.question(continuePrompt, function(answer){
        if (answer.toLowerCase() ==  'y'){
            rl.question(actionsPrompt, function(answer){
                options(answer, obj, arr)
            })
        } else if(answer.toLowerCase() == 'n') {
            console.log('Exiting the program.')
            rl.close()
        } else {
            console.log(yesNoPrompt)
            rerun(obj,arr)
        }
    })
}

function changeKey(arr){
    //arr = list of keys from JSON files, TODO: display the name of the vault and/or xpub with real data.
    //provides the user with a list of keys to choose from,
    //the user will enter the selected keys tag number and the program will rerun with the new key object.
    //if xprv/xpub is not present, it will show "undefined", but can change that to whatever.

    for (item in arr){
        console.log('===========================')
        console.log(`${item}: `+ 'xprv: ' + arr[item].xprv)
        console.log('   ' + 'xpub: ' + arr[item].xpub)
        console.log('   ' + 'wallet type: ' + arr[item].walletType)
        console.log('   ' + 'vault: ' + arr[item].vault)
        console.log('===========================')
    }
    console.log(chooseKeyPrompt)
    rl.question(enterKeyPrompt, function(answer){
        if(inRange(parseInt(answer), 0, arr.length - 1) == false){ //if the response is invalid, prompt them to choose again.
            changeKey(arr)
        } else {
            selectedKey = new Key(arr[answer])
            if(arr[answer].xprv != undefined){
                console.log(`Changed to key ${arr[answer].xprv}`)
            } else {
                console.log(`Changed to key ${arr[answer].xpub}`)
            }
            rerun(selectedKey, arr)
        }
    })
}

function equalTo(a, b, c){
    if (a==b || a==c){
        return true
    } else {
        return false
    }
}

function inRange(x, min, max) {
    return ((x-min)*(x-max) <= 0);
}