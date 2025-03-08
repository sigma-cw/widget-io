var codePath;

////////////////////////////////////////////////////////////////////////////////
//                             CONSTANTS                                      //
////////////////////////////////////////////////////////////////////////////////

const filesArray = ['html', 'css', 'js', 'fields', 'data']

const ini = `[HTML]
path = "html.txt"

[CSS]
path = "css.txt"

[JS]
path = "js.txt"

[FIELDS]
path = "fields.txt"

[DATA]
path = "data.txt"
`

////////////////////////////////////////////////////////////////////////////////
//                             FUNCTIONS                                      //
////////////////////////////////////////////////////////////////////////////////

function waitForElm(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}

function handleFile(file, type) {
    let fr = new FileReader();
    $(`.${type}-select span`).text(file.name);
    fr.readAsText(file, "UTF-8");
    fr.onload = function (data) {
        switch (type) {
            case 'html':
                window.postMessage([data.target.result, 'html']);
                break;
            case 'css':
                window.postMessage([data.target.result, 'css']);
                break;
            case 'js':
                window.postMessage([data.target.result, 'js']);
                break;
            case 'fields':
                window.postMessage([data.target.result, 'fields']);
                break;
            case 'data':
                window.postMessage([data.target.result, 'data']);
                break;
            default:
                break;
        }
    }
}

function handleZip(file) {
    var zip = new JSZip();
    zip.loadAsync(file)
        .then(function (zip) {
            $('.zip-select span').text(file.name)
            if (!zip.files[`widget.ini`]) {
                handleUnsupported(zip)
                return
            }
            zip.files[`widget.ini`].async('string')
                .then((data) => {
                    pathArray = handleIniData(data);
                    if (pathArray.length != 5) {
                        handleUnsupported(zip)
                        return
                    }

                    if (!zip.files[`${pathArray[0]}`] ||
                        !zip.files[`${pathArray[1]}`] ||
                        !zip.files[`${pathArray[2]}`] ||
                        !zip.files[`${pathArray[3]}`] ||
                        !zip.files[`${pathArray[4]}`]) {
                        alert('This widget was not set up properly. Opening manual upload dialog...')
                        handleUnsupported(zip)
                        return
                    }
                    readFiles(zip, pathArray);
                })
        });
}

function handleUnsupported(zip) {
    // alert("This widget is not supported.")
    resetSession()

    waitForElm('#sigma-create-unsupported').then(() => {
        $('#sigma-create-unsupported').click(() => {
            $('#zip').val('')
            $('.zip-select span').text('No file selected...')
            handleCode(codePath)
        });
    });

    filesArray.forEach((type) => {
        waitForElm(`#${type}`).then(() => {
            $(`#${type}`).on("change", function (evt) {
                console.log('Change detected')
                var files = evt.target.files;
                for (var i = 0; i < files.length; i++) {
                    handleFile(files[i], type);
                }
            });
        })
    })

    var backdrop = $(`
        <md-backdrop class="md-dialog-backdrop md-opaque" 
                     style="position: fixed;" aria-hidden="true">
        </md-backdrop>`)
    $('body').prepend(backdrop)
    $('body').append(dialog)

    // Handle click outside of dialog
    $(window).click(() => {
        $('.sigma-extension-dialog').remove()
        $(backdrop).remove()
    })
    $('.sigma-dialog').click((event) => {
        event.stopPropagation();
    })
}

function handleIniData(data) {
    var lines = data.split('\n');
    var pathArray = [];
    for (var i = 0; i < lines.length; i++) {
        if (lines[i].includes('[HTML]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[CSS]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[JS]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[FIELDS]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }

        if (lines[i].includes('[DATA]')) {
            var _temp = lines[i + 1].split('"');
            pathArray.push(_temp[1]);
        }
    }

    return pathArray;
}

function readFiles(zip, pathArray) {
    var htmlCode, cssCode, jsCode, fieldsCode, dataCode;
    zip.files[`${pathArray[0]}`].async('string')
        .then((data) => {
            htmlCode = data;
            zip.files[`${pathArray[1]}`].async('string')
                .then((data) => {
                    cssCode = data;
                    zip.files[`${pathArray[2]}`].async('string')
                        .then((data) => {
                            jsCode = data;
                            zip.files[`${pathArray[3]}`].async('string')
                                .then((data) => {
                                    fieldsCode = data;
                                    zip.files[`${pathArray[4]}`].async('string')
                                        .then((data) => {
                                            dataCode = data;
                                            code = [htmlCode, cssCode, jsCode, fieldsCode, dataCode]
                                            window.postMessage([code, 'zip'])
                                            return
                                        });
                                });
                        });
                });
        });
}

/* function handleCode(path) {
    $('widget-creator > button').click();
    tab = $('.widget-creator__items').children()[4];
    tab_content = $(tab).children()[4];
    widget_button = $(tab_content).children()[$(tab_content).children().length - 1];

    $(widget_button).click();

    $('.custom-event-list-editor-button-container > button').click();

    waitForElm('.html-editor .CodeMirror').then(() => {
        const htmlEditor = $('.html-editor .CodeMirror')[0].CodeMirror
        if (path[0]) {
            htmlEditor.setValue(path[0]);
        } else {
            htmlEditor.setValue('');
        }

        const fields = $('._md-nav-bar-list').children();
        $($(fields[1]).children()[0]).click();
    });

    waitForElm('.css-editor .CodeMirror').then(() => {
        const cssEditor = $('.css-editor .CodeMirror')[0].CodeMirror;
        if (path[1]) {
            cssEditor.setValue(path[1]);
        } else {
            cssEditor.setValue('');
        }

        const fields = $('._md-nav-bar-list').children();
        $($(fields[2]).children()[0]).click();
    });

    waitForElm('.js-editor .CodeMirror').then(() => {
        const jsEditor = $('.js-editor .CodeMirror')[0].CodeMirror;
        if (path[2]) {
            jsEditor.setValue(path[2]);
        } else {
            jsEditor.setValue('')
        }

        const fields = $('._md-nav-bar-list').children();
        $($(fields[3]).children()[0]).click();
    });

    waitForElm('.fields-editor .CodeMirror').then(() => {
        const fieldsEditor = $('.fields-editor .CodeMirror')[0].CodeMirror;
        if (path[3]) {
            fieldsEditor.setValue(path[3]);
        } else {
            fieldsEditor.setValue('')
        }

        const fields = $('._md-nav-bar-list').children();
        $($(fields[4]).children()[0]).click();
    });

    waitForElm('.field-data-editor .CodeMirror').then(() => {
        const dataEditor = $('.field-data-editor .CodeMirror')[0].CodeMirror;
        if (path[4]) {
            dataEditor.setValue(path[4]);
        } else {
            dataEditor.setValue('')
        }

        $('.exit-code-editor').click()
    });
}

function writeCode() {
    var zip = new JSZip()
    zip.file('widget.ini', ini)
    codeArray = [];

    var value = $('#widgets')[0].value
    var widgetList = $('span[ng-show="!vm.editableWidgetNames[widget.id]"]')
    widgetList.each((el) => {
        if (widgetList[el].innerText === value) {
            $($(widgetList[el]).parent()[0]).click()
        }
    })

    $('.custom-event-list-editor-button-container > button').click();

    waitForElm('.html-editor .CodeMirror').then(() => {
        const htmlEditor = $('.html-editor .CodeMirror')[0].CodeMirror
        //codeArray.push(htmlEditor.getValue())
        zip.file('html.txt', htmlEditor.getValue())

        const fields = $('._md-nav-bar-list').children();
        $($(fields[1]).children()[0]).click();
    });

    waitForElm('.css-editor .CodeMirror').then(() => {
        const cssEditor = $('.css-editor .CodeMirror')[0].CodeMirror;
        //codeArray.push(cssEditor.getValue())
        zip.file('css.txt', cssEditor.getValue())

        const fields = $('._md-nav-bar-list').children();
        $($(fields[2]).children()[0]).click();
    });

    waitForElm('.js-editor .CodeMirror').then(() => {
        const jsEditor = $('.js-editor .CodeMirror')[0].CodeMirror;
        //codeArray.push(jsEditor.getValue())
        zip.file('js.txt', jsEditor.getValue())

        const fields = $('._md-nav-bar-list').children();
        $($(fields[3]).children()[0]).click();
    });

    waitForElm('.fields-editor .CodeMirror').then(() => {
        const fieldsEditor = $('.fields-editor .CodeMirror')[0].CodeMirror;
        //codeArray.push(jsEditor.getValue())
        zip.file('fields.txt', fieldsEditor.getValue())

        const fields = $('._md-nav-bar-list').children();
        $($(fields[4]).children()[0]).click();
    });

    waitForElm('.field-data-editor .CodeMirror').then(() => {
        const dataEditor = $('.field-data-editor .CodeMirror')[0].CodeMirror;
        //codeArray.push(fieldsEditor.getValue())
        zip.file('data.txt', dataEditor.getValue())

        $('.exit-code-editor').click();
        zip.generateAsync({ type: "blob" }).then(function (blob) {
            saveAs(blob, `${value}.zip`);
        });
    });


}
 */

function handleCode(path) {
    $('widget-creator > button').click();
    tab = $('.widget-creator__items').children()[4];
    tab_content = $(tab).children()[4];
    widget_button = $(tab_content).children()[$(tab_content).children().length - 1];

    $(widget_button).click();

    $('.custom-event-list-editor-button-container > button').click();

    waitForElm('.html-editor.code-editor .monaco-editor').then(() => {
        const modelNumber = getDataUri('.html-editor.code-editor', 0)
        const model = monaco.editor.getModels();

        if (path[0]) {
            model[modelNumber - 1].setValue(path[0]);
        } else {
            model[modelNumber - 1].setValue('');
        }
        const fields = $('._md-nav-bar-list').children();
        $($(fields[1]).children()[0]).click();
    });

    waitForElm('.css-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.css-editor.code-editor', 1)
        if (path[1]) {
            model[modelNumber - 1].setValue(path[1]);
        } else {
            model[modelNumber - 1].setValue('');
        }
        const fields = $('._md-nav-bar-list').children();
        $($(fields[2]).children()[0]).click();
    });

    waitForElm('.js-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.js-editor.code-editor', 2)
        if (path[2]) {
            model[modelNumber - 1].setValue(path[2]);
        } else {
            model[modelNumber - 1].setValue('');
        }
        const fields = $('._md-nav-bar-list').children();
        $($(fields[3]).children()[0]).click();
    });

    waitForElm('.fields-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.fields-editor.code-editor', 3)
        if (path[3]) {
            model[modelNumber - 1].setValue(path[3]);
        } else {
            model[modelNumber - 1].setValue('');
        }
        const fields = $('._md-nav-bar-list').children();
        $($(fields[4]).children()[0]).click();
    });

    waitForElm('.field-data-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.field-data-editor.code-editor', 4)
        if (path[4]) {
            model[modelNumber - 1].setValue(path[4]);
        } else {
            model[modelNumber - 1].setValue('');
        }
        $('.exit-code-editor').click()
    });
}
function getDataUri(classes, index) {
    const parentElement = document.querySelector(classes);
    if (parentElement) {
        const targetElement = parentElement.querySelector(`${classes} .monaco-editor`);

        if (targetElement) {
            const dataUri = targetElement.getAttribute('data-uri');
            const parts = dataUri.split("model/");
            return parts.length > 1 ? parts[1] : null;
        }
        else {
            const fields = $('._md-nav-bar-list').children();
            $($(fields[index]).children()[0]).click();
            const targetElement = parentElement.querySelector(`${classes} .monaco-editor`);

            if (targetElement) {
                const dataUri = targetElement.getAttribute('data-uri');
                const parts = dataUri.split("model/");
                return parts.length > 1 ? parts[1] : null;
            }
        }
    } else {
        console.log(`Element ${classes} not found`)
    }
    return null;
}

function writeCode() {
    var zip = new JSZip()
    zip.file('widget.ini', ini)
    codeArray = [];

    var value = $('#widgets')[0].value
    var widgetList = $('span[ng-show="!vm.editableWidgetNames[widget.id]"]')
    widgetList.each((el) => {
        if (widgetList[el].innerText === value) {
            $($(widgetList[el]).parent()[0]).click()
        }
    })

    $('.custom-event-list-editor-button-container > button').click();

    waitForElm('.html-editor.code-editor .monaco-editor').then(() => {
        const modelNumber = getDataUri('.html-editor.code-editor', 0)
        const model = monaco.editor.getModels();

        zip.file('html.txt', model[modelNumber - 1].getValue());

        const fields = $('._md-nav-bar-list').children();
        $($(fields[1]).children()[0]).click();
    });

    waitForElm('.css-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.css-editor.code-editor', 1)

        zip.file('css.txt', model[modelNumber - 1].getValue());

        const fields = $('._md-nav-bar-list').children();
        $($(fields[2]).children()[0]).click();
    });

    waitForElm('.js-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.js-editor.code-editor', 2);
        zip.file('js.txt', model[modelNumber - 1].getValue());

        const fields = $('._md-nav-bar-list').children();
        $($(fields[3]).children()[0]).click();
    });

    waitForElm('.fields-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.fields-editor.code-editor', 3);

        zip.file('fields.txt', model[modelNumber - 1].getValue());

        const fields = $('._md-nav-bar-list').children();
        $($(fields[4]).children()[0]).click();
    });

    waitForElm('.field-data-editor.code-editor .monaco-editor').then(() => {
        const model = monaco.editor.getModels();
        const modelNumber = getDataUri('.field-data-editor.code-editor', 4);

        zip.file('data.txt', model[modelNumber - 1].getValue());
        zip.generateAsync({ type: "blob" }).then(function (blob) {
            saveAs(blob, `${value}.zip`);
        });
        console.log("zip", "downloaded");
        $('.exit-code-editor').click();
    });
}

function resetSession() {
    $('#zip').val('')
    $('#html').val('')
    $('#css').val('')
    $('#js').val('')
    $('#fields').val('')
    $('#data').val('')

    $('.zip-select span').text('No file selected...')
    $('.html-select span').text('No file selected...')
    $('.css-select span').text('No file selected...')
    $('.js-select span').text('No file selected...')
    $('.fields-select span').text('No file selected...')
    $('.data-select span').text('No file selected...')

    codePath = []
}

////////////////////////////////////////////////////////////////////////////////
//                             ACTION SCRIPTS                                 //
////////////////////////////////////////////////////////////////////////////////

waitForElm('#zip').then(() => {
    codePath = []
    $('#zip').on("change", function (evt) {
        var files = evt.target.files;
        for (var i = 0; i < files.length; i++) {
            handleZip(files[i]);
        }
    });
});

waitForElm('#sigma-create').then(() => {
    $('#sigma-create').click(() => {
        $('#zip').val('')
        $('.zip-select span').text('No file selected...')
        handleCode(codePath)
    });
});

waitForElm('#sigma-save').then(() => {
    $('#sigma-save').click(() => {
        writeCode()
    });
});

////////////////////////////////////////////////////////////////////////////////
//                          EVENT LISTENERS                                   //
////////////////////////////////////////////////////////////////////////////////

window.addEventListener("message", function (event) {

    if (event.data[1] === 'zip') {
        codePath = event.data[0];
    }
    else if (event.data[1] === 'html') {
        codePath[0] = event.data[0];
    }
    else if (event.data[1] === 'css') {
        codePath[1] = event.data[0];
    }
    else if (event.data[1] === 'js') {
        codePath[2] = event.data[0];
    }
    else if (event.data[1] === 'fields') {
        codePath[3] = event.data[0];
    }
    else if (event.data[1] === 'data') {
        codePath[4] = event.data[0];
    }

});

////////////////////////////////////////////////////////////////////////////////
//                             HTML SOURCES                                   //
////////////////////////////////////////////////////////////////////////////////

const dialog = `
<div class="sigma-extension-dialog">
    <div class="md-dialog-container sigma-dialog-container" tabindex="-1" md-theme="default"
        style="top: 0px; height: 961px;">
        <div class="md-dialog-focus-trap" tabindex="0"></div>
        <md-dialog class="sigma-dialog overlay-editor__session-data-dialog__root _md md-default-theme md-transition-in"
            md-theme="default" role="dialog" tabindex="-1" aria-describedby="dialogContent_111" style="">
            <div class="title-area">
                <h3>Manual upload</h3>
                <p>
                    Unfortunately, the ZIP you uploaded is not supported by this
                    extension. Do not fret, however! You can manually provide
                    the required files. Open the ZIP and locate files with names
                    that either contain or otherwise resemble <a>"html.txt"</a>, <a>"css.txt"</a>,
                    <a>"js.txt"</a>, and <a>"fields.txt"</a>. Refer to the instructions that
                    came with your widget to find these files or their equivalents.
                 </p>
                 <p>
                    Then, select each file in the respective box below, and click
                    "Create widget". Enjoy!
                </p>
            </div>
            <div class="upload-area">
                <div class="selection">
                    <p>Select widget HTML file</p>
                    <div class="html-select">
                        <span>No file selected...</span>
                        <label for="html" class="sigma-file-upload">
                            Upload
                        </label>
                    </div>
                    <input type="file" id="html" name="zip" accept=".txt,.html">
                </div>
                <div class="selection">
                    <p>Select widget CSS file</p>
                    <div class="css-select">
                        <span>No file selected...</span>
                        <label for="css" class="sigma-file-upload">
                            Upload
                        </label>
                    </div>
                    <input type="file" id="css" name="zip" accept=".txt,.css">
                </div>
                <div class="selection">
                    <p>Select widget JS file</p>
                    <div class="js-select">
                        <span>No file selected...</span>
                        <label for="js" class="sigma-file-upload">
                            Upload
                        </label>
                    </div>
                    <input type="file" id="js" name="zip" accept=".txt,.js">
                </div>
                <div class="selection">
                    <p>Select widget FIELDS file</p>
                    <div class="fields-select">
                        <span>No file selected...</span>
                        <label for="fields" class="sigma-file-upload">
                            Upload
                        </label>
                    </div>
                    <input type="file" id="fields" name="zip" accept=".txt,.json">
                </div>
                <div class="selection">
                    <p>Select widget DATA file</p>
                    <div class="data-select">
                        <span>No file selected...</span>
                        <label for="data" class="sigma-file-upload">
                            Upload
                        </label>
                    </div>
                    <input type="file" id="data" name="zip" accept=".txt,.json">
                </div>
            </div>
            <ext-button id="sigma-create-unsupported">CREATE WIDGET</ext-button>
        </md-dialog>
        <div class="md-dialog-focus-trap" tabindex="0"></div>
    </div>
</div>
`
