var resourceURL = '/resource/'
window.CoreControls.forceBackendType('ems');

var urlSearch = new URLSearchParams(location.hash)
var custom = JSON.parse(urlSearch.get('custom'));
resourceURL = resourceURL + custom.namespacePrefix;

// office workers
window.CoreControls.setOfficeWorkerPath(resourceURL + 'office')
window.CoreControls.setOfficeAsmPath(resourceURL + 'office_asm');
window.CoreControls.setOfficeResourcePath(resourceURL + 'office_resource');

// pdf workers
window.CoreControls.setPDFResourcePath(resourceURL + 'resource')
if (custom.fullAPI) {
  window.CoreControls.setPDFWorkerPath(resourceURL+ 'pdf_full')
  window.CoreControls.setPDFAsmPath(resourceURL +'asm_full');
} else {
  window.CoreControls.setPDFWorkerPath(resourceURL+ 'pdf_lean')
  window.CoreControls.setPDFAsmPath(resourceURL +'asm_lean');
}

// external 3rd party libraries
window.CoreControls.setExternalPath(resourceURL + 'external')
window.CoreControls.setCustomFontURL('https://pdftron.s3.amazonaws.com/custom/ID-zJWLuhTffd3c/vlocity/webfontsv20/');




window.addEventListener("message", receiveMessage, false);

function receiveMessage(event) {
  if (event.isTrusted && typeof event.data === 'object') {
    switch (event.data.type) {
      case 'OPEN_DOCUMENT':
        event.target.readerControl.loadDocument(event.data.file)
        break;
      case 'OPEN_DOCUMENT_BLOB':
        const { blob, extension, filename, contentVersionId, contentDocumentId } = event.data.payload;
        docViewer.on('documentLoaded', function(e) {
          // Save contentDocuemntId to use later during saving
          docViewer.getDocument().__contentDocumentId = contentDocumentId;
        })
        event.target.readerControl.loadDocument(blob, { extension, filename, documentId: contentVersionId })

        break;
      case 'CLOSE_DOCUMENT':
        event.target.readerControl.closeDocument()
        break;
      case 'DOCUMENT_SAVED':
        console.log('DOCUMENT_SAVED', event.data);
        readerControl.showErrorMessage('Document saved!')
        setTimeout(() => {
          readerControl.closeElements(['errorModal', 'loadingModal'])
        }, 2000)
        break;
      default:
        break;
    }
  }
}



// ====================================
// == Post message to LWC/parent app ==
// ====================================

window.addEventListener('viewerLoaded', async function() {
  // this will be called on keydown
  readerControl.hotkeys.on('ctrl+s, command+s', e => {
    e.preventDefault();
    saveDocument();
  });

  readerControl.setHeaderItems(function(header) {
    var myCustomButton = {
      type: 'actionButton',
      dataElement: 'saveDocumentButton',
      title: 'tool.SaveDocument',
      img: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M0 0h24v24H0z" fill="none"/><path d="M17 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V7l-4-4zm-5 16c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3zm3-10H5V5h10v4z"/></svg>',
      onClick: function() {
        saveDocument();
      }
    }
    header.get('viewControlsButton').insertBefore(myCustomButton);
  });
});


async function saveDocument() {
  console.log('readerControl.saveAnnotations();');

  var doc = docViewer.getDocument();
  if (!doc) {
    return;
  }
  readerControl.openElement('loadingModal');

  var fileType = doc.getType()
  var filename = doc.getFilename()
  var xfdfString = await docViewer.getAnnotationManager().exportAnnotations();
  var data = await doc.getFileData({
    // saves the document with annotations in it
    xfdfString: xfdfString
  });

  var binary = '';
  var bytes = new Uint8Array( data );
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode( bytes[ i ] );
  }

  var base64Data = window.btoa( binary );

  var payload = {
    title: filename.replace(/\.[^/.]+$/, ""),
    filename,
    base64Data,
    fileType,
    fileExtension: fileType,
    contentDocumentId: doc.__contentDocumentId
  }
  console.log(payload);
  parent.postMessage({type: 'SAVE_DOCUMENT', payload }, '*'); // <---- post message to LWC
}