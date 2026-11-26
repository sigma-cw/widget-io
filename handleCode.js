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

function waitForNewElm(getEl) {
	return new Promise((resolve) => {
		const found = getEl();
		if (found) return resolve(found);

		const observer = new MutationObserver(() => {
			const el = getEl();
			if (el) {
				observer.disconnect();
				resolve(el);
			}
		});

		observer.observe(document.body, { childList: true, subtree: true });
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

function handleCode(path) {
	$('#overlay').click();
	$('[data-base-ui-portal]').remove();
    $('floating-actions > section > button').first().click();
	const addWidgetButton = $('[data-editor-action="Open widget creator"]');
	$(addWidgetButton).click();

	const staticCustomPopup = 'div[data-slot="dropdown-menu-scroll-area"]'
	waitForElm(staticCustomPopup).then(() => {
		$(staticCustomPopup).children()[3].click();
	})

	const customWidgetButton = '[role="menuitem"][data-variant="default"]';
	waitForElm(customWidgetButton).then(() => {
		$(customWidgetButton).last()[0].click();
	})

	const findOpenEditorButton = () =>
	  [...document.querySelectorAll("se-editor-sidebar button")].find(
		(b) => b.textContent.trim() === "Open Editor" // This is flaky asf cause different languages *may* have different text content for this button. I checked with a few and it seemed to be consistent, but who knows
	  );

	waitForNewElm(findOpenEditorButton).then((button) => button.click());

	waitForElm('[data-slot="tabs-list"]').then(() => {
		const tabs = $('[data-slot="tabs-list"]').children();

		waitForElm('[data-mode-id="html"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			model.setValue(path[0] || '');

			$(tabs[1]).click();
		});

		waitForElm('[data-mode-id="css"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			model.setValue(path[1] || '');

			$(tabs[2]).click();
		});

		waitForElm('[data-mode-id="javascript"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			model.setValue(path[2] || '');

			$(tabs[3]).click();
		});

		waitForElm('[data-mode-id="json"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			model.setValue(path[3] || '');

			$(tabs[4]).click();
		});

		waitForElm('[data-index="4"] [data-mode-id="json"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			model.setValue(path[4] || '');
			console.log(model, path[4])

			$('[data-slot="dialog-footer"] button').click()
		});
	})
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
    var widgetList = $('li[data-editor-action="Select widget"]')
    widgetList.each((el) => {
        if (widgetList[el].innerText === value) {
            $(widgetList[el]).click()
        }
    })

	const findSettingsButton = () =>
		[...document.querySelectorAll('se-editor-sidebar div div[data-slot="collapsible"] button')].find(
			(button) => button.textContent.trim() === "Settings" // This is flaky asf cause different languages *may* have different text content for this button. I checked with a few and it seemed to be consistent, but who knows
		);
	waitForNewElm(findSettingsButton).then((button) => button.click());

	const findOpenEditorButton = () =>
	  [...document.querySelectorAll("se-editor-sidebar button")].find(
		(button) => button.textContent.trim() === "Open Editor" // This is flaky asf cause different languages *may* have different text content for this button. I checked with a few and it seemed to be consistent, but who knows
	  );
	waitForNewElm(findOpenEditorButton).then((button) => button.click());

	waitForElm('[data-slot="tabs-list"]').then(() => {
		const tabs = $('[data-slot="tabs-list"]').children();

		waitForElm('[data-mode-id="html"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			zip.file('html.txt', model.getValue());

			$(tabs[1]).click();
		});

		waitForElm('[data-mode-id="css"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			zip.file('css.txt', model.getValue());

			$(tabs[2]).click();
		});

		waitForElm('[data-mode-id="javascript"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			zip.file('js.txt', model.getValue());

			$(tabs[3]).click();
		});

		waitForElm('[data-mode-id="json"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			zip.file('fields.txt', model.getValue());

			$(tabs[4]).click();
		});

		waitForElm('[data-index="4"] [data-mode-id="json"] .monaco-editor').then(() => {
			const model = monaco.editor.getModels().slice(-1)[0];
			zip.file('data.txt', model.getValue());

			zip.generateAsync({ type: "blob" }).then(function (blob) {
				saveAs(blob, `${value}.zip`);
			});
			console.log("zip", "downloaded");
			$('[data-slot="dialog-footer"] button').click()
		});
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
		$('#zip').val('')
		$('.zip-select span').text('No file selected...')
		handleCode(codePath)
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
        style="top: 0px; height: 1012px;">
        <div class="md-dialog-focus-trap" tabindex="0"></div>
        <md-dialog class="sigma-dialog overlay-editor__session-data-dialog__root _md md-default-theme md-transition-in"
            md-theme="default" role="dialog" tabindex="-1" aria-describedby="dialogContent_111" style="">
            <div class="title-area">
                <h3>Manual upload</h3>
                <p>
                    Unfortunately, the ZIP you uploaded is not supported by this
                    extension. Do not fret, however! You can manually provide
                    the required files. Open the file you just uploaded using 7-Zip or a similar program,
					and drag out its contents to a folder on your computer.
					What you extracted should contain or otherwise resemble <a>"html.txt"</a>, <a>"css.txt"</a>,
                    <a>"js.txt"</a>, <a>"fields.txt"</a>, and <a>"data.txt"</a>
					(exact naming may vary for each widget, but the files should be named somewhat like that).
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
