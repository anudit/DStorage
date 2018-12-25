window.addEventListener('load', async () => {
    if (window.ethereum) {
        window.web3 = new Web3(ethereum);
        try {
                await ethereum.enable();
        } catch (error) {
                console.log(error);
        }
    } else if (window.web3) {
        window.web3 = new Web3(web3.currentProvider);
    } else {
        web3 = new Web3(new Web3.providers.HttpProvider("https://ropsten.infura.io/v3/8f68025ea6a8425cb75ae44591a8b1b3"));
    }
});

web3.eth.defaultAccount = web3.eth.accounts[0];
var IPFSStorageContract = web3.eth.contract([{"constant":false,"inputs":[{"name":"ind","type":"uint8"}],"name":"clearEntry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"name":"_digest","type":"bytes32"},{"name":"_hashFunction","type":"uint8"},{"name":"_size","type":"uint8"}],"name":"setEntry","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"anonymous":false,"inputs":[{"indexed":true,"name":"key","type":"address"},{"indexed":false,"name":"digest","type":"bytes32"},{"indexed":false,"name":"hashFunction","type":"uint8"},{"indexed":false,"name":"size","type":"uint8"}],"name":"EntrySet","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"name":"key","type":"address"}],"name":"EntryDeleted","type":"event"},{"constant":true,"inputs":[{"name":"ind","type":"uint8"}],"name":"getEntry","outputs":[{"name":"digest","type":"bytes32"},{"name":"hashfunction","type":"uint8"},{"name":"size","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"getNumberOfEntries","outputs":[{"name":"l","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}]);
var IPFSStorage = IPFSStorageContract.at('0xae1de97ad41250331b0b186cae51af3692cc31ef');

var EntrySetEvent = IPFSStorage.EntrySet();
EntrySetEvent.watch(function(error, result){
    if (!error)
        {
            //console.log(result);
            //updateStats();
            location.reload(true);
        } else {
            console.log(error);
        }
});

var EntryDeletedEvent = IPFSStorage.EntryDeleted();
EntryDeletedEvent.watch(function(error, result){
    if (!error)
        {
            console.log(result);
        } else {
            console.log(error);
        }
});

function getInfuraLink(hash){
    return "https://ipfs.infura.io/ipfs/" + hash;
}

function storeHash(multihash){
    var decoded =  getBytes32FromMultihash(multihash);
    var digest = decoded['digest'];
    var hashFunction = decoded['hashFunction'];
    var size = decoded['size'];

    IPFSStorage.setEntry(digest,hashFunction,size,function(error, result) {
        if (!error) {
                console.log(result);
        } else
                console.log(error);
    });
}

function getEntry(){

    let multihashList = [];
    let validFileNumber = 0;
    IPFSStorage.getNumberOfEntries(function(error, result) {
        if (!error) {
                var i;
                for(i=0; i<result.c[0]; i++){
                    IPFSStorage.getEntry(i,function(error, result) {
                        if (!error) {
                                if(result[0] != "0x0000000000000000000000000000000000000000000000000000000000000000"){
                                    multihashList.push(getMultihashFromBytes32({digest : result[0], hashFunction : 18,size : 32}));
                                    validFileNumber+=1;
                                }
                        } else
                                console.log(error);
                    });
                }
        } else
                return error;
    });
    
    return multihashList;
}

function clearEntry(ind){
    IPFSStorage.clearEntry(ind,function(error, result) {
        if (!error) {
                console.log(result);
        } else
                console.log(error);
    });
}

function updateStats(){
    $('#address').html(window.web3.eth.accounts[0]);
    IPFSStorage.getNumberOfEntries(function(error, result) {
        if (!error) {
                $('#numFiles').html(result.c[0]);
        } else
                return error;
    });
    var hashList = getEntry();
    
    setTimeout(function(){
        var list = document.getElementById("fileList");
        for (var i = 0; i < hashList.length; i++ ) {
            li = document.createElement("li");
            li.appendChild(document.createTextNode(hashList[i] + " : "));
            a = document.createElement("a");
            a.setAttribute('href', getInfuraLink(hashList[i]));
            a.innerHTML = "Download Here";
            li.appendChild(a);
            li.innerHTML += "&nbsp;";
            list.appendChild(li);
        }
    }, 1000);
}

$(document).ready(function() {

    updateStats();

    $("#btnSubmit").click(function(event) {
        event.preventDefault();
        var form = $('#submitfile')[0];
        var data = new FormData(form);

        $("#btnSubmit").prop("disabled", true);

        $.ajax({
            type: "POST",
            enctype: 'multipart/form-data',
            url: "http://localhost:5000/uploader",
            data: data,
            processData: false,
            contentType: false,
            cache: false,
            timeout: 600000,
            success: function(data) {

                $("#result").text(data);
                console.log("SUCCESS : ", data);

                var multihash =  data['ipfsHash'];
                storeHash(multihash);
                    
                $("#btnSubmit").prop("disabled", false);
            },
            error: function(e) {

                $("#result").text(e.responseText);
                console.log("ERROR : ", e);
                $("#btnSubmit").prop("disabled", false);

            }
        });



    });
    
});