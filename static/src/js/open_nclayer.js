/**
 * Eds JavaScript Library v0.1.4 Beta
 */
var modalPass = false;

var kTokensNclayer = false;
var idCardNclayer = false;

var webSocket = null;
var heartbeatMsg = '--heartbeat--';
var heartbeatInterval = null;
var missedHeartbeats = 0;
var missedHeartbeatsLimitMin = 3;
var missedHeartbeatsLimitMax = 50;
var missedHeartbeatsLimit = missedHeartbeatsLimitMin;
var callback = null;
var keyType;
var signType = null;

/**
 * Делаем лимиты максимальными перед новой отправкой
 */
function setMissedHeartbeatsLimitToMax() {
    missedHeartbeatsLimit = missedHeartbeatsLimitMax;
}

/**
 * Общая функция отправки данных на сервер через вебсокеты, используя методы
 *
 * @param  {String}   method
 * @param  {Array}   args     массив передаваемых аргуметов
 * @param  {Function} callbackM вызвать функцию после
 * @return {[type]}
 */
function getData(method, args, callbackM) {
    var methodVariable = {
        'method': method,
        'args': args
    };
    if (callbackM) callback = callbackM;
    setMissedHeartbeatsLimitToMax();
    webSocket.send(JSON.stringify(methodVariable));
}

/**
 * Общая функция отправки данных на сервер через вебсокеты, используя методы
 *
 * @param  {String}   method
 * @param  {Array}   args     массив передаваемых аргуметов
 * @param  {Function} callbackM вызвать функцию после
 * @return {[type]}
 */
function getDataNew(method, args, callbackM) {
    var methodVariable = {
        'module': 'kz.gov.pki.knca.commonUtils',
        'method': method,
        'args': args
    };
    if (callbackM) callback = callbackM;
    setMissedHeartbeatsLimitToMax();
    webSocket.send(JSON.stringify(methodVariable));
}

/**
 * @param  {object}
 * @param  {String}
 * @return {String|null}
 */
// function findSubjectAttr(attrs, attr) {
//     var tmp;
//     var numb;
//
//     for (numb = 0; numb < attrs.length; numb++) {
//         tmp = attrs[numb].replace(/^\s\s*/, '').replace(/\s\s*$/, '');
//         if (tmp.indexOf(attr + '=') === 0) {
//             return tmp.substr(attr.length + 1);
//         }
//     }
//
//     return null;
// }

// function hideChooseNCLayerModal() {
//     document.getElementById('chooseNCLayerModal').style.display = 'none';
// }

/**
 * Показать диалоговое окно ошибки при соединении по веб сокетам
 */
function openNCALayerNotConnectedModal() {
    // hideChooseNCLayerModal();
    $('#NCALayerNotConnected').modal('show')
    // document.getElementById('NCALayerNotConnected').style.display = '';
}

function setMissedHeartbeatsLimitToMin() {
    missedHeartbeatsLimit = missedHeartbeatsLimitMin;
}

/**
 * Пингуем прослойку
 */
function pingLayer() {
    try {
        //missedHeartbeats++;

        //if (missedHeartbeats >= missedHeartbeatsLimit) {
        //  throw new Error('Too many missed heartbeats.');
        //}
        webSocket.send(heartbeatMsg);
    } catch (error) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
        webSocket.close();
    }
}

/**
 * Инициализация прослойки
 * @param  {callback}
 */
function initNCALayer(callbackM) {
    webSocket = new WebSocket('wss://127.0.0.1:13579/');

    webSocket.onopen = function() {
        if (heartbeatInterval === null) {
            missedHeartbeats = 0;
            heartbeatInterval = setInterval(pingLayer, 1000);
        }

        if (callbackM) {
            window[callbackM]();
        }
    };

    webSocket.onclose = function(event) {
        if (!event.wasClean) {
            openNCALayerNotConnectedModal();
        } else {
            //openNCALayerNotConnectedModal();
        }
    };

    webSocket.onmessage = function(event) {
        var result;
        var rw;

        if (event.data === heartbeatMsg) {
            missedHeartbeats = 0;
            return;
        }

        result = JSON.parse(event.data);
        rw = {
            result: result.result,
            secondResult: result.secondResult,
            errorCode: result.errorCode,
            code: result.code,
            responseObject: result.responseObject,
            message: result.message,
            getResult: function() {
                return this.result;
            },
            getSecondResult: function() {
                return this.secondResult;
            },
            getErrorCode: function() {
                return this.errorCode;
            },
            getMessage: function () {
                return this.message;
            },
            getResponseObject: function () {
                return this.responseObject;
            },
            getCode: function () {
                return this.code;
            }
        };
        if (callback){
            window[callback](rw);
        }

        setMissedHeartbeatsLimitToMin();
    };
}

function hideNCALayerNotConnectedModal() {
    document.getElementById('NCALayerNotConnected').style.display = 'none';
}

// function hideInstructionModal() {
//     document.getElementById('instruction').style.display = 'none';
// }
// function showInstructionModal() {
//     document.getElementById('instruction').style.display = '';
// }

// function hideNCAPasswordModal() {
//     document.getElementById('NCApassModal').style.display = 'none';
//     document.getElementById('signNCAWrongPassword').style.display = 'none';
//     document.getElementById('signNCAEmptyPassword').style.display = 'none';
//     document.getElementById('signNCATryPanel').style.display = 'none';
//     document.getElementById('signNCAUnknownErrorPanel').style.display = 'none';
//     document.getElementById('signNCANoCertsInStoreAuth').style.display = 'none';
//     document.getElementById('signNCANoCertsInStoreSign').style.display = 'none';
//     document.getElementById('techErrorNCA').style.display = 'none';
//     document.getElementById('signNCABlock').style.display = 'none';
//     document.getElementById('signNCAPassword').value = '';
// }

// function hideChooseKeyModal() {
//     document.getElementById('chooseKeyModal').style.display = 'none';
// }

// function resetInputs() {
//     document.getElementById('storageAlias').value = '';
//     document.getElementById('storagePath').value = '';
//     document.getElementById('password').value = '';
//     document.getElementById('keyAlias').value = '';
// }

// function ncaLayerErrorCloseAll() {
//     resetInputs();
//
//     hideNCALayerNotConnectedModal();
//     // hideNCAPasswordModal();
//     hideChooseKeyModal();
// }

/**
 * Показать стандартную форму с ошибкой, закрыв все остальные модалки
 */
function openNcaLayerError() {
    // ncaLayerErrorCloseAll();
    document.getElementById('NCALayerError').style.display = '';
}

function doSignXMLRestore() {// eslint-disable-line
    signXmlNewCall('signXmlNewBack');
    return false;
}


function doSignXMLReg() {// eslint-disable-line
    signRegistrationCall('signRegistrationCallBack');
    return false;
}

function signRegistrationCallBack(result) { // eslint-disable-line
    var signedData;
    if (result['code'] === "500") {
        if (result['message'] != null && result['message'] !== 'action.canceled') {
            openNcaLayerError();
        }
    } else if (result['code'] === "200") {
        signedData = result['responseObject'];
        document.getElementById('certificate').value = signedData[0];
        document.getElementById('agreement').value = signedData[1];
        webSocket.close();
        $("#oe_signup_form").submit();
    }
}

function signRegistrationCall(callbackM) {
    const data1 = document.getElementById('xmlToSign1').value;
    const data2 = document.getElementById('xmlToSign2').value;
    const storageAlias = $('#storageAlias').val();
    keyType = document.getElementById('keyType').value;
    let args = [];

    const arr = [data1, data2];
    if (storageAlias && arr) {
        args = [storageAlias, keyType, arr, "", ""];
        getDataNew('signXmls', args, callbackM);
    } else {
        openNcaLayerError();
    }
}


function doSignXMLRegMbg() {// eslint-disable-line
    signMbgRegistrationCall('signMbgRegistrationCallBack');
    return false;
}

function signMbgRegistrationCallBack(result) { // eslint-disable-line
    var signedData;
    if (result['code'] === "500") {
        if (result['message'] != null && result['message'] !== 'action.canceled') {
            openNcaLayerError();
        }
    } else if (result['code'] === "200") {
        signedData = result['responseObject'];
        typeof signedData
        document.getElementById('certificate').value = signedData[0];
        document.getElementById('agreement').value = signedData[1];
        webSocket.close();
        $("#sign_form").submit();
    }
}

function signMbgRegistrationCall(callbackM) {
    var data1 = document.getElementById('xmlToSign').value;
    var storageAlias = $('#storageAlias').val();
    keyType = document.getElementById('keyType').value;
    var args = [];

    var arr = [data1];
    if (storageAlias && arr) {
        args = [storageAlias, keyType, arr, "", ""];
        getDataNew('signXmls', args, callbackM);
    } else {
        openNcaLayerError();
    }
}

/**
 * @param  {[type]}
 * @param  {[type]}
 * @return {Boolean}
 */
// function signXmlBack(result) { // eslint-disable-line
//     var signedData;
//     if (result.errorCode === 'NONE') {
//         signedData = result.getResult();
//         document.getElementById('certificate').value = signedData;
//         webSocket.close();
//         $("#eds_form").submit();
//     }
//     else
//     if (result.errorCode === 'WRONG_PASSWORD' && result.result > -1) {
//         openNcaLayerError();
//     } else if (result.errorCode === 'WRONG_PASSWORD') {
//         openNcaLayerError();
//     } else {
//         document.getElementById('certificate').value = '';
//         openNcaLayerError();
//     }
// }

function signXmlNewBack(result) {
    var signedData;

    if (result['code'] === "500") {
        if (result['message'] != null && result['message'] != 'action.canceled') {
            openNcaLayerError();
        }
    } else if (result['code'] === "200") {
        signedData = result['responseObject'];
        document.getElementById('certificate').value = signedData
        webSocket.close();
        $("#oe_signup_form").submit();
    }
}

/**
 * Вызываем подписку через прослойку
 *
 * @return {callback}
 */
// function signXmlCall(callbackM) {
//     var data = document.getElementById('xmlToSign').value;
//     var storageAlias = $('#storageAlias').val();
//     var storagePath = $('#storagePath').val();
//     var password = $('#password').val();
//     var alias = $('#keyAlias').val();
//     var args = [];
//     var numb;
//
//     if (storagePath && storageAlias && password && alias && data) {
//
//         data = document.getElementById('xmlToSign').value;
//         args = [storageAlias, storagePath, alias, password, data];
//         getData('signXml', args, callbackM);
//
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * Вызываем подписку через прослойку
 *
 * @return {callback}
 */
function signXmlNewCall(callbackM) {
    var data = document.getElementById('xmlToSign').value;
    var storageAlias = $('#storageAlias').val();
    keyType = document.getElementById('keyType').value;
    var args = [];

    console.info('signXmlNewCall', data, storageAlias)
    if (data && storageAlias) {
        args = [storageAlias, keyType, data, "", ""];
        console.info('signXmlNewCall args', args)
        getDataNew('signXml', args, callbackM);
    } else {
        console.info('openNcaLayerError')
        openNcaLayerError();
    }
}

/**
 * Начинаем проверка, какие кнопки показать, проверка Казтокенов
 */
function selectNCAStore() {
    // document.getElementById('buttonSelectCert').disabled = true;
    setTimeout(function () {
        //getData('loadSlotList', ['AKKaztokenStore'], 'selectNCAStoreKazCallback');
        getActiveTokens("getActiveTokensBack");
    }, 500);
}

function getActiveTokens(callBack) {
    var getActiveTokens = {
        "module": "kz.gov.pki.knca.commonUtils",
        "method": "getActiveTokens"
    };
    callback = callBack;
    setMissedHeartbeatsLimitToMax();
    webSocket.send(JSON.stringify(getActiveTokens));
}

function getActiveTokensBack(result) {
    if (result['code'] === "500") {
        openNcaLayerError();
    } else if (result['code'] === "200") {
        var listOfTokens = result['responseObject'];
        kTokensNclayer = false;
        idCardNclayer = false;
        console.log("active tokens " + listOfTokens);
        for (i = 0; i < listOfTokens.length; i++) {
            if (listOfTokens[i] == 'AKKaztokenStore') {
                kTokensNclayer = true;
            }
            if (listOfTokens[i] == 'AKKZIDCardStore') {
                idCardNclayer = true;
            }
        }
        // document.getElementById('buttonSelectCert').disabled = false;
        showNCAStore();
    }
}

/**
 * @return {callback}
 * @param storageAlias
 */
function chooseNCAStorage(storageAlias) {
    // var storagePath = document.getElementById('storagePath').value;
    // var args = [storageAlias, 'P12', storagePath];
    // hideChooseNCLayerModal();
    $('#chooseNCLayerModal').modal('hide');
    document.getElementById('storageAlias').value = storageAlias;
    if (signType === 'LOGIN') {
        doSignXML()
    } else if (signType === 'RESTORE') {
        restoreWithEDS();
    } else if (signType === 'REGISTER') {
        registerWithEDS();
    } else if (signType === 'REGISTER_MBG') {
        registerMgbWithEDS();
    }
    //getData('browseKeyStore', args, 'chooseNCAStorageBack');
}

/**
 * После проверки что подключено, показываем модалку с подкл устройствами или открываем файловый менеджер
 */
function showNCAStore() {
    var selectCertNCLayerStore;
    var html = '';
    var storage = 'PKCS12';
    var kTokens = 'AKKaztokenStore';
    var idCards = 'AKKZIDCardStore';
    var htmlClass = 'btn btn-primary';

    if (kTokensNclayer || idCardNclayer) {
        selectCertNCLayerStore = document.getElementById('selectCertNCLayerStore');

        if (kTokensNclayer) {
            if(getLocale()==='ru'){
                html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + kTokens + "\")' value = \"Казтокен\">";
            }else if(getLocale()==='kk'){
                html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + kTokens + "\")' value = \"Казтокен\">";
            }else if(getLocale()==='en'){
                html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + kTokens + "\")' value = \"KazToken\">";
            }
        }

        if (idCardNclayer) {
            if(getLocale()==='ru'){
                html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + idCards + "\")' value =\"Удостоверение личности\" >";
            }else if(getLocale()==='kk'){
                html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + idCards + "\")' value =\"Жеке куәлік\" >";
            }else if(getLocale()==='en'){
                html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + idCards + "\")' value =\"ID card\" >";
            }
        }

        if(getLocale()==='ru'){
            html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + storage + "\")' value = \"Выбрать файл\">";
        }else if(getLocale()==='kk'){
            html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + storage + "\")' value = \"Файлды таңдау\">";
        }else if(getLocale()==='en'){
            html += "<input type='button' class='" + htmlClass + "' onclick='chooseNCAStorage(\"" + storage + "\")' value = \"Select the file\">";
        }


        selectCertNCLayerStore.innerHTML = html;
        $('#chooseNCLayerModal').modal('show');
    } else {
        chooseNCAStorage(storage);
    }
}

// function selectNCAStoreIdCallback(result) { // eslint-disable-line
//     idCardNclayer = (result.getErrorCode() === 'NONE');
//     // document.getElementById('buttonSelectCert').disabled = false;
//     showNCAStore();
// }

// function selectNCAStoreKazCallback(result) { // eslint-disable-line
//     kTokensNclayer = (result.getErrorCode() === 'NONE');
//     setTimeout(function () {
//         getData('loadSlotList', ['AKKZIDCardStore'], 'selectNCAStoreIdCallback');
//     }, 500)
// }

// function openNCAPasswordModal() {
//     document.getElementById('NCApassModal').style.display = '';
//     modalPass = true;
// }

/**
 * Callback функции browseKeyStore()
 * @param  {String}
 */
// function chooseNCAStorageBack(rw) { // eslint-disable-line
//     var storagePath = document.getElementById('storagePath').value;
//
//     if (rw.getErrorCode() === 'NONE') {
//         storagePath = rw.getResult();
//
//         if (storagePath !== null && storagePath !== '' && typeof storagePath !== 'undefined') {
//             document.getElementById('storagePath').value = storagePath;
//             //openNCAPasswordModal();
//         } else {
//             document.getElementById('storageAlias').value = 'NONE';
//             document.getElementById('storagePath').value = '';
//         }
//     } else {
//         document.getElementById('storageAlias').value = 'NONE';
//         document.getElementById('storagePath').value = '';
//     }
// }

/**
 * Выбираем из выбранного ключа алиас
 * @return {String}
 */
// function keysOptionChanged() {
//     var str = document.getElementById('keys').options[document.getElementById('keys').selectedIndex].text;
//     var alias = str.split('|')[3];
//     document.getElementById('keyAlias').value = alias;
// }

/**
 * Добавляем в html личные данные пользователя
 * @param  {Object}
//  */
// function fillPersonData(data) {
//     var subjectDN = data.result;
//     var subjectAttrs = subjectDN.split(',');
//     var iin = findSubjectAttr(subjectAttrs, 'SERIALNUMBER').substr(3);
//     var email = findSubjectAttr(subjectAttrs, 'E');
//     var cn = findSubjectAttr(subjectAttrs, 'CN');
//     cn = cn || '';
//     var middleName = findSubjectAttr(subjectAttrs, 'G');
//     middleName = middleName || '';
//     var fullName = cn.concat(" ").concat(middleName);
//
//     document.getElementById('signIIN').innerHTML = iin;
//     document.getElementById('signEmail').innerHTML = email;
//     document.getElementById('signFullName').innerHTML = fullName;
// }

/**
 * Дополнительные поля для организаций - БИН и наименование
 * @param  {Object}
 */
// function fillOrgData(data) {
//     var subjectAttrs = data.result.split(',');
//     var bin = findSubjectAttr(subjectAttrs, 'OU');
//     var organizationName = findSubjectAttr(subjectAttrs, 'O');
//
//     if (bin !== null) {
//         if (bin.length > 3) {
//             bin = bin.substr(3);
//         }
//
//         document.getElementById('signBINRow').style.display = '';
//         document.getElementById('signOrgNameRow').style.display = '';
//
//         document.getElementById('signBIN').innerHTML = bin;
//         document.getElementById('signOrgName').innerHTML = organizationName.replaceAll('\\\"', '\"');
//     } else {
//         document.getElementById('signBINRow').style.display = 'none';
//         document.getElementById('signOrgNameRow').style.display = 'none';
//     }
// }
//
// function getNotAfterCall() {
//     var storageAlias = document.getElementById('storageAlias').value;
//     var storagePath = document.getElementById('storagePath').value;
//     var password = document.getElementById('password').value;
//     var alias = document.getElementById('keyAlias').value;
//     var args = [];
//
//     if (storagePath && storageAlias && password && alias) {
//         args = [storageAlias, storagePath, alias, password];
//         getData('getNotAfter', args, 'getNotAfterBack');
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * Добавляем дату окончания эцп
 * @param  {Object}
 */
// function getNotAfterBack(result) { // eslint-disable-line
//     var endDate;
//
//     if (result.errorCode === 'NONE') {
//         endDate = result.result.split(' ')[0];
//         document.getElementById('endDate').innerHTML = endDate;
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * Добавляем дату с
 * @param  {Object}
 */
// function getNotBeforeBack(result) { // eslint-disable-line
//     var beginDate;
//     if (result.errorCode === 'NONE') {
//         beginDate = result.result.split(' ')[0];
//         document.getElementById('beginDate').innerHTML = beginDate;
//         getNotAfterCall();
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * getNotBeforeCall() проверяем все данные
 */
// function getNotBeforeCall() {
//     var storageAlias = document.getElementById('storageAlias').value;
//     var storagePath = document.getElementById('storagePath').value;
//     var password = document.getElementById('password').value;
//     var alias = document.getElementById('keyAlias').value;
//     var args = [];
//
//     if (storagePath && storageAlias && password && alias) {
//         args = [storageAlias, storagePath, alias, password];
//         getData('getNotBefore', args, 'getNotBeforeBack');
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * Заполняем в html данные пользователя эцп
 * @param  {Object}
 */
// function getSubDNBack(result) { // eslint-disable-line
//     if (result.errorCode === 'NONE') {
//         fillPersonData(result);
//         fillOrgData(result);
//         //document.getElementById('personInfo').style.display = '';
//         document.getElementById('signBtnsPnl').style.display = '';
//         document.getElementById('signSelCertBtnsPnl').style.display = 'none';
//
//         getNotBeforeCall();
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * Заполняем данными поля личными данными эцп
 * Берем данные эцп и подготвливаем
 */
// function getSubDN() {
//     var alias = document.getElementById('keyAlias').value;
//     var password = document.getElementById('password').value;
//     var storagePath = document.getElementById('storagePath').value;
//     var storageAlias = document.getElementById('storageAlias').value;
//     var args = [];
//
//     if (storagePath && storageAlias && password && alias) {
//         args = [storageAlias, storagePath, alias, password];
//         getData('getSubjectDN', args, 'getSubDNBack');
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * Callback после ввода пароля
 * @param {Object}
 */
// function setNCAPasswordBack(result) { // eslint-disable-line
//     var keyListEl = document.getElementById('keys');
//     var slotListArr;
//     var list;
//     var counter;
//
//     if (result.errorCode === 'NONE') {
//         keyListEl.options.length = 0;
//         list = result.result;
//         slotListArr = list.split('\n');
//
//         for (counter = 0; counter < slotListArr.length; counter++) {
//             if (slotListArr[counter] === null || slotListArr[counter] === '') {
//                 continue;
//             }
//
//             keyListEl.options[keyListEl.length] = new Option(slotListArr[counter], counter);
//         }
//
//         keysOptionChanged();
//         // hideNCAPasswordModal();
//
//         if (slotListArr.length === 1) {
//             getSubDN();
//         } else {
//             document.getElementById('chooseKeyModal').style.display = '';
//         }
//     } else {
//         document.getElementById('modalNCAInfo').style.display = '';
//         if (result.errorCode === 'WRONG_PASSWORD' && result.result > -1) {
//             document.getElementById('signNCAWrongPassword').style.display = 'inline';
//             document.getElementById('signNCATryPanel').style.display = 'inline';
//             document.getElementById('signNCATries').innerHTML = result.result;
//         } else if (result.errorCode === 'WRONG_PASSWORD') {
//             document.getElementById('signNCAWrongPassword').style.display = 'inline';
//         } else {
//             if (result.errorCode === 'EMPTY_KEY_LIST') {
//                 var keyType = document.getElementById('keyType').value;
//                 if (keyType && keyType === 'AUTH') {
//                     document.getElementById('signNCANoCertsInStoreAuth').style.display = 'inline';
//                 } else if (keyType && keyType === 'SIGN') {
//                     document.getElementById('signNCANoCertsInStoreSign').style.display = 'inline';
//                 } else {
//                     document.getElementById('techErrorNCA').style.display = 'inline';
//                 }
//             } else {
//                 document.getElementById('signNCAUnknownErrorPanel').style.display = 'inline';
//                 document.getElementById('signNCAErrorCode').innerHTML = result.errorCode;
//             }
//         }
//
//         keyListEl.options.length = 0;
//     }
// }

/**
 * setNCAPassword() - вызываем после ввода пароля и отправки
 */
// function setNCAPassword() { // eslint-disable-line
//     var storageAlias = document.getElementById('storageAlias').value;
//     var password = document.getElementById('signNCAPassword').value;
//     var storagePath = document.getElementById('storagePath').value;
//     var keyType = document.getElementById('keyType').value;
//     var args = [];
//     document.getElementById('password').value = password;
//     if (storagePath && storageAlias) {
//         if (password) {
//             args = [storageAlias, storagePath, password, keyType];
//             getData('getKeys', args, 'setNCAPasswordBack');
//         } else {
//             document.getElementById('modalNCAInfo').style.display = '';
//             document.getElementById('signNCAEmptyPassword').style.display = 'inline';
//         }
//     } else {
//         openNcaLayerError();
//     }
// }

/**
 * selectSignType() определеяет тип подписки Java апплет или прослойка
 */
function selectSignType(requestType) { // eslint-disable-line
    /**
     * CONNECTING   0   The connection is not yet open.
     * OPEN         1   The connection is open and ready to communicate.
     * CLOSING      2   The connection is in the process of closing.
     * CLOSED       3   The connection is closed or couldn't be opened.
     */
    signType = requestType;

    if (webSocket === null || webSocket.readyState === 3 || webSocket.readyState === 2) {
        initNCALayer('selectNCAStore');
    } else {
        selectNCAStore();
    }
}

/**
 * doSignRequest() Вызываем перед отправкой xml, чтобы подписать
 * sendSignedXml() Зарегистрированная функция в ангуляре
 * @param {String} Имя контроллера == id в html
 * @return {Booleam}
 */
function doSignXML() {// eslint-disable-line
    signXmlNewCall('signXmlNewBack');
    return false;
}

/**
 * TODO: fix it
 * @param strTarget
 * @param strSubString
 */
String.prototype.replaceAll = function(strTarget, strSubString) {
    var strText = this;
    var intIndexOfMatch = strText.indexOf(strTarget);

    while (intIndexOfMatch !== -1) {
        strText = strText.substring(0, intIndexOfMatch) + strSubString + strText.substring(intIndexOfMatch + strTarget.length, strText.length);
        intIndexOfMatch = strText.indexOf(strTarget, intIndexOfMatch + strSubString.length);
    }

    return strText;
};

function hideNcaLayerError(){
    document.getElementById('NCALayerError').style.display = "none";
}


function fillData() { // eslint-disable-line
    getSubDN();
}
//$(window).on('beforeunload', function(){
// if (webSocket !== null) {
//     webSocket.close();
// }
//});
window.addEventListener('beforeunload', (event) => {
  if (webSocket !== null) {
        webSocket.close();
    }
});



