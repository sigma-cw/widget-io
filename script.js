////////////////////////////////////////////////////////////////////////////////
//                             CONSTANTS                                      //
////////////////////////////////////////////////////////////////////////////////

const SCRIPT_ARRAY = [
    chrome.runtime.getURL('handleCode.js'),
    chrome.runtime.getURL('js/jszip.min.js'),
    chrome.runtime.getURL('js/FileSaver.js')
]

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

function handleWidgetList() {
    $('#widgets').html('')
    $('span[ng-show="!vm.editableWidgetNames[widget.id]"]').each((el) => {
        var name = $('span[ng-show="!vm.editableWidgetNames[widget.id]"]')[el].innerText;
        var option = $(`
            <option value="${name}">${name}</option>
        `)
        $('#widgets').append(option)
    });
}

function appendScript(src) {
    var sc = document.createElement('script');
    sc.src = src
    sc.type = 'text/javascript'
    sc.onload = function () {
        this.remove();
    };
    (document.body).appendChild(sc);
}

////////////////////////////////////////////////////////////////////////////////
//                             STYLES                                         //
////////////////////////////////////////////////////////////////////////////////

var style = $(`
    <style>
        .extension-button {
            position: fixed;
            bottom: 20px;
            left: 400px;
        }

        .extension-button.md-fab {
            background-color: #ED1B53;
            color: rgb(255,255,255);
        }

        .extension-button.md-button.md-default-theme.md-fab:not([disabled]).md-focused, 
        .extension-button.md-button.md-fab:not([disabled]).md-focused, 
        .extension-button.md-button.md-default-theme.md-fab:not([disabled]):hover, 
        .extension-button.md-button.md-fab:not([disabled]):hover {
            background-color: #F64473;
        }

        .sigma-extension-menu {
            width: 300px;
            position: fixed;
            bottom: 90px;
            left: 400px;
            margin: 12px 8px;
            grid-row-gap: 8px;
            display: inline-grid;
            grid-template-columns: 1fr;
        }

        .sigma-extension-menu a {
            color: #ED1B53;
            font-weight: 600;
        }

        .sigma-extension-menu a:visited {
            color: #ED1B53;
        }

        .sigma-extension-menu .extension-title .title {
            font-size: 20px;
            font-weight: 800;
            color: #ED1B53;
        }

        .sigma-extension-menu .extension-title .dev {
            font-size: 14px;
            color: #606060;
        }

        .sigma-extension-menu .extension-box {
            padding: 20px;
            background: white;
            border-radius: 4px;
            width: 100%;
            overflow: hidden;
        }

        .sigma-extension-menu .extension-box .box-title {
            font-weight: 600;
            margin-bottom: 10px;
        }

        .sigma-extension-menu .extension-box .desc {
            font-size: 14px;
            margin-bottom: 5px;
            line-height: 1.2;
            transition: color 0.5s ease;
        }

        .sigma-extension-menu .extension-box .selection p {
            font-weight: 500;
            color: #606060;
        }

        .sigma-extension-menu .extension-box .selection select {
            width: 100%;
            padding: 6px;
            border-radius: 4px;
            border: solid 2px #A4A4A4;
        }

        .sigma-extension-menu .extension-box .selection option {
            padding: 3px;
            border-radius: 4px;
        }

        .sigma-extension-menu .extension-users {
            height: 238px;
            transition: height 0.5s ease;
        }

        .sigma-extension-menu .extension-devs {
            height: 258px;
            transition: height 0.5s ease;
        }

        ext-button {
            background-color: #ED1B53;
            color: rgb(255,255,255);
            border-radius: 20px;
            padding: 8px;
            cursor: pointer;
            display: flex;
            justify-content: center;
            align-items: center;
            width: 100%;
            font-weight: 600;
            margin-top: 15px;
        }

        ext-button:hover {
            background-color: #F64473;
        }

        input[type="file"] {
            display: none;
        }

        .zip-select, 
        .html-select, 
        .css-select, 
        .js-select, 
        .fields-select,
        .data-select {
            border-radius: 4px;
            background-color: #EAEAEA;
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-left: 10px;
        }

        .zip-select label, 
        .html-select label, 
        .css-select label, 
        .js-select label, 
        .fields-select label,
        .data-select label {
            padding: 6px 12px;
            background-color: #ED1B53;
            color: white;
            border-radius: 4px;
            cursor: pointer;
        }

        .zip-select label:hover, 
        .html-select label:hover, 
        .css-select label:hover, 
        .js-select label:hover, 
        .fields-select label:hover,
        .data-select label:hover {
            background-color: #F64473;
        }

        .sigma-extension-menu .hidden {
            height: 61px;
            cursor: pointer;
            transition: height 0.5s ease;
        }

        .sigma-extension-menu .hidden .desc {
            color: white;
            transition: color 0.5s ease;
        }

        .sigma-dialog {
            padding: 30px;
        }

        .sigma-dialog.overlay-editor__session-data-dialog__root {
            max-width: 550px;
        }

        .sigma-dialog .title-area h3 {
            margin-bottom: 20px;
        }

        .sigma-dialog .title-area p {
            margin-bottom: 10px;
        }

        .sigma-dialog a {
            color: #ED1B53;
            font-weight: 600;
        }

        .sigma-dialog .selection {
            margin-bottom: 20px;
        }

        .sigma-dialog ext-button {
            width: 300px;
            align-self: center;
        }

    </style>
`)

////////////////////////////////////////////////////////////////////////////////
//                           HTML ELEMENTS                                    //
////////////////////////////////////////////////////////////////////////////////

var button  = $(`
    <button class="extension-button md-fab widget-creator__trigger-button md-button md-ink-ripple">
        <md-icon style="pointer-events: none;" class="material-icons" role="img" aria-label="{{ vm.isOpen ? 'close' : 'add' }}">
            code
        </md-icon>
    </button>
`);

var menu = $(`
    <div class="sigma-extension-menu">
        <div class="extension-box extension-title">
            <p class="title">widget.io</p>
            <p class="dev">Developed by <a target="_blank" href="https://twitter.com/sigmacw_">@sigmacw_</a></p>
            <p class="dev">Designed by <a target="_blank" href="https://twitter.com/R3do_">@R3do_</a></p>
        </div>
        <div class="extension-box extension-users">
            <p class="box-title">FOR USERS</p>
            <p class="desc">
                Automatic custom widget set up. Select the supported
                widget zip file, and press the magic button.
            </p>
            <div class="selection">
                <p>Select widget ZIP file</p>
                <div class="zip-select">
                    <span>No file selected...</span>
                    <label for="zip" class="sigma-file-upload">
                        Upload
                    </label>
                </div>
                <input type="file"
                    id="zip" name="zip"
                    accept=".7z,.zip,.rar">
            </div>
            <ext-button id="sigma-create">CREATE WIDGET</ext-button>
        </div>
        <div class="extension-box extension-devs hidden">
            <p class="box-title">FOR DEVELOPERS</p>
            <p class="desc">
                Download any custom widget as a zip archive, no need for
                manual copy and pasting. Select the widget from the dropdown
                below and click download!
            </p>
            <div class="selection">
                <p>Select widget...</p>
                <select name="widgets" id="widgets">
                </select>
            </div>
            <ext-button id="sigma-save">SAVE WIDGET</ext-button>
        </div>
    </div>
`);

////////////////////////////////////////////////////////////////////////////////
//                           SCRIPT ACTIONS                                   //
////////////////////////////////////////////////////////////////////////////////

$('html > head').append(style);

SCRIPT_ARRAY.forEach((src) => {
    appendScript(src)
})

waitForElm('#editor-wrapper')
    .then(() => {
        // Create menu
        $('#editor-wrapper').append(menu);
        $(menu).hide()

        // Handle click outside of menu
        $(window).click(() => {
            $(menu).hide()
        })
        $(menu).click((event) => {
            event.stopPropagation();
        })

        $('.extension-devs').click(() =>{
            $('.extension-devs').removeClass('hidden')
            $('.extension-users').addClass('hidden')
        });

        $('.extension-users').click(() =>{
            $('.extension-users').removeClass('hidden')
            $('.extension-devs').addClass('hidden')
        });
        
        // Create button
        $('#editor-wrapper').append(button);
        $(button).click((event) => {
            event.stopPropagation();
            handleWidgetList()
            $('#editor-wrapper > .sigma-extension-menu').toggle()
        });
    })
